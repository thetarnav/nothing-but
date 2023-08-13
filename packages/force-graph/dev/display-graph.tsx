import * as S from '@nothing-but/solid/signal'
import { event, math, trig } from '@nothing-but/utils'
import { Vector } from '@nothing-but/utils/trig'
import { Position } from '@nothing-but/utils/types'
import { createEventListener, createEventListenerMap } from '@solid-primitives/event-listener'
import { resolveElements } from '@solid-primitives/refs'
import { RootPoolFactory, createRootPool } from '@solid-primitives/rootless'
import { MachineStates, createMachine } from '@solid-primitives/state-machine'
import { createEffect, createMemo, createSignal, onCleanup, onMount, type JSX } from 'solid-js'
import * as FG from '../src/index.js'

export function SvgForceGraph(props: {
    graph: FG.Graph
    node: RootPoolFactory<FG.Node, JSX.Element>
    active?: boolean
    targetFPS?: number
}): JSX.Element {
    const isActive = 'active' in props ? () => props.active : () => false

    const useNodeEl = createRootPool(props.node)
    const nodeEls = resolveElements(() => props.graph.nodes.map(useNodeEl)).toArray

    const useLine = createRootPool(
        () => (<line class="stroke-cyan-7/25 stroke-0.1%" />) as SVGLineElement,
    )
    const lines = createMemo(() => props.graph.edges.map(useLine))

    const posToP = (xy: number, grid_size: number) => ((xy + grid_size / 2) / grid_size) * 100 + '%'

    function updateElements() {
        const els = nodeEls(),
            line_els = lines(),
            { nodes, edges, options } = props.graph,
            { grid_size } = options

        for (let i = 0; i < edges.length; i++) {
            const { a, b } = edges[i]!
            const line = line_els[i]!

            if (a.moved) {
                line.x1.baseVal.valueAsString = posToP(a.position.x, grid_size)
                line.y1.baseVal.valueAsString = posToP(a.position.y, grid_size)
            }

            if (b.moved) {
                line.x2.baseVal.valueAsString = posToP(b.position.x, grid_size)
                line.y2.baseVal.valueAsString = posToP(b.position.y, grid_size)
            }
        }

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]!

            if (!node.moved) continue

            const { x, y } = node.position
            const el = els[i]! as HTMLElement

            el.style.left = posToP(x, grid_size)
            el.style.top = posToP(y, grid_size)

            node.moved = false
        }
    }

    onMount(() => {
        const animation = FG.makeFrameAnimation(props.graph, updateElements, props.targetFPS ?? 44)

        const init = createMemo(() => {
            props.graph // track graph prop

            const [init, setInit] = createSignal(true)
            const timeout = setTimeout(() => setInit(false), 2000)
            onCleanup(() => clearTimeout(timeout))

            return init
        })

        updateElements()

        createEffect(() => {
            if (isActive() || init()()) {
                FG.startFrameAnimation(animation)
            } else {
                FG.pauseFrameAnimation(animation)
            }
        })

        onCleanup(() => {
            FG.stopFrameAnimation(animation)
        })
    })

    return (
        <>
            <svg class="absolute w-full h-full">{lines()}</svg>
            {nodeEls()}
        </>
    )
}

interface CanvasState {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    graph: FG.Graph
    size: number
    position: Position
    scale: number
    derived: {
        edge_width: number
        node_radius: number
    }
    signal: S.Signal<undefined>
}

function makeCanvasState(canvas: HTMLCanvasElement, graph: FG.Graph): CanvasState | Error {
    const ctx = canvas.getContext('2d')
    if (!ctx) return new Error('Could not get canvas context')

    const init_size = Math.min(canvas.width, canvas.height)

    const state: CanvasState = {
        canvas,
        graph,
        ctx,
        size: init_size,
        position: { x: 0, y: 0 },
        scale: 2,
        derived: {
            edge_width: 0,
            node_radius: 0,
        },
        signal: S.signal(),
    }
    updateDerived(state)

    return state
}

function updateDerived(state: CanvasState): void {
    state.derived.edge_width = state.size / 2000
    state.derived.node_radius = state.size / 240
}

interface Events {
    ESCAPE?(event: KeyboardEvent): void
    SPACE?(event: KeyboardEvent): void

    POINTER_DOWN?(event: PointerEvent): void
    POINTER_UP?(event: PointerEvent): void
}

const mode_states: MachineStates<{
    default: {
        input: {
            state: CanvasState
        }
        value: Events
    }
    dragging: {
        input: {
            state: CanvasState
            node: FG.Node
            e: PointerEvent
            init_graph_pos: Position
        }
        value: Events
    }
}> = {
    default({ state }, to) {
        return {
            POINTER_DOWN(e) {
                e.preventDefault()
                e.stopPropagation()

                const canvas_e_pos = event.positionInElement(e, state.canvas)
                const graph_e_pos = canvasPosToGraphPos(state, canvas_e_pos)

                const canvas_missclick_tolerance = state.derived.node_radius + 5
                const graph_missclick_tolerance = canvasDistToGraphDist(
                    state,
                    canvas_missclick_tolerance,
                )

                const closest = FG.findClosestNodeLinear(
                    state.graph.nodes,
                    graph_e_pos,
                    graph_missclick_tolerance,
                )
                if (!closest) return

                to.dragging({ state, node: closest, e, init_graph_pos: graph_e_pos })
            },
        }
    },
    dragging({ state, node, e, init_graph_pos }, to) {
        const pointer_id = e.pointerId

        node.locked = true
        onCleanup(() => (node.locked = false))

        /*
            Smoothly move the node to the pointer position
        */
        const init_pos_delta = trig.vec_difference(init_graph_pos, node.position)
        let last_pos = init_graph_pos
        const interval = setInterval(() => {
            trig.vec_mut(init_pos_delta, v => v * 0.95)
            FG.changeNodePosition(
                state.graph.grid,
                node,
                last_pos.x - init_pos_delta.x,
                last_pos.y - init_pos_delta.y,
            )

            const d = trig.distance(trig.ZERO, init_pos_delta)
            if (d < 0.1) {
                clearInterval(interval)
                init_pos_delta.x = 0
                init_pos_delta.y = 0
            }
        })
        onCleanup(() => clearInterval(interval))

        createEventListener(document, 'pointermove', e => {
            if (e.pointerId !== pointer_id) return

            e.preventDefault()
            e.stopPropagation()

            const canvas_e_pos = event.positionInElement(e, state.canvas)
            const goal_graph_e_pos = canvasPosToGraphPos(state, canvas_e_pos)
            last_pos = goal_graph_e_pos
            const graph_e_pos = trig.vec_difference(goal_graph_e_pos, init_pos_delta)

            FG.changeNodePosition(state.graph.grid, node, graph_e_pos.x, graph_e_pos.y)
        })

        return {
            type: 'dragging',
            POINTER_UP(e) {
                if (e.pointerId !== pointer_id) return

                to.default({ state })
            },
        }
    },
}

function pointToCanvas(state: CanvasState, xy: number): number {
    const { size } = state
    return (xy / state.graph.grid.size) * size + size / 2
}

function updateCanvas(state: CanvasState): void {
    const { ctx, size, position, scale, graph } = state,
        { edge_width, node_radius } = state.derived,
        { nodes, edges } = graph

    /*
        clear
    */
    ctx.clearRect(0, 0, size, size)

    /*
        transform - scale and translate
    */
    const correct_origin = -(scale - 1) * (size / 2)
    ctx.setTransform(
        scale,
        0,
        0,
        scale,
        correct_origin - (position.x / graph.grid.size) * size * scale,
        correct_origin - (position.y / graph.grid.size) * size * scale,
    )

    /*
        border
    */
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, size, size)

    /*
        edges
    */
    for (const { a, b } of edges) {
        const edges_mod = math.clamp(a.edges.length + b.edges.length, 1, 30) / 30
        const opacity = 0.2 + (edges_mod / 10) * 2

        ctx.strokeStyle =
            a.locked || b.locked
                ? `rgba(129, 140, 248, ${opacity})`
                : `rgba(150, 150, 150, ${opacity})`
        ctx.lineWidth = edge_width
        ctx.beginPath()
        ctx.moveTo(pointToCanvas(state, a.position.x), pointToCanvas(state, a.position.y))
        ctx.lineTo(pointToCanvas(state, b.position.x), pointToCanvas(state, b.position.y))
        ctx.stroke()
    }

    /*
        nodes
    */
    for (const node of nodes) {
        const { x, y } = node.position
        const edges_mod = math.clamp(node.edges.length, 1, 30) / 30
        const opacity = 0.6 + (edges_mod / 10) * 4

        ctx.fillStyle = node.locked
            ? `rgba(129, 140, 248, ${opacity})`
            : `rgba(248, 113, 113, ${opacity})`
        ctx.beginPath()
        ctx.ellipse(
            pointToCanvas(state, x),
            pointToCanvas(state, y),
            node_radius,
            node_radius,
            0,
            0,
            Math.PI * 2,
        )
        ctx.fill()
    }
}

function canvasDistToGraphDist(state: CanvasState, dist: number): number {
    return (dist / state.size) * (state.graph.options.grid_size / state.scale)
}

function canvasPosToGraphPos(state: CanvasState, pos: Position): Vector {
    const graph_click_pos = trig.vec_map(
        pos,
        n => (n - 0.5) * (state.graph.options.grid_size / state.scale),
    )
    trig.vec_add(graph_click_pos, state.position)
    return graph_click_pos
}

export function CanvasForceGraph(props: {
    graph: FG.Graph
    trackNodes: () => void
    targetFPS?: number
}): JSX.Element {
    const { graph, targetFPS = 44, trackNodes } = props

    const init_size = graph.options.grid_size

    const canvas = (
        <canvas class="absolute w-full h-full" width={init_size} height={init_size} />
    ) as HTMLCanvasElement

    const state = makeCanvasState(canvas, graph)
    if (state instanceof Error) throw state

    {
        const ro = new ResizeObserver(() => {
            const { width, height } = canvas.getBoundingClientRect()
            const size = Math.min(width, height)

            canvas.width = size
            canvas.height = size
            state.size = size

            updateDerived(state)

            S.trigger(state.signal)
        })
        ro.observe(canvas)
        onCleanup(() => ro.disconnect())
    }

    const mode = createMachine({
        states: mode_states,
        initial: {
            type: 'default',
            input: { state },
        },
    })

    createEventListener(canvas, 'pointerdown', e => {
        mode.value.POINTER_DOWN?.(e)
    })

    createEventListenerMap(document, {
        pointerup(e) {
            mode.value.POINTER_UP?.(e)
        },
        pointercancel(e) {
            mode.value.POINTER_UP?.(e)
        },
    })

    createEventListener(document, 'keydown', e => {
        if (
            e.ctrlKey ||
            e.altKey ||
            e.metaKey ||
            e.shiftKey ||
            e.isComposing ||
            e.defaultPrevented ||
            e.target !== document.body
        )
            return

        switch (e.key) {
            case 'Escape': {
                mode.value.ESCAPE?.(e)
                break
            }
            case ' ': {
                mode.value.SPACE?.(e)
                break
            }
        }
    })

    {
        const animation = FG.makeFrameAnimation(graph, () => updateCanvas(state), targetFPS)
        updateCanvas(state)

        const init = createMemo(() => {
            trackNodes() // track changes to nodes

            const [init, setInit] = createSignal(true)
            const timeout = setTimeout(() => setInit(false), 2000)
            onCleanup(() => clearTimeout(timeout))

            return init
        })

        const active = createMemo(() => {
            state.signal.read()
            return mode.type === 'dragging' || init()()
        })

        createEffect(() => {
            if (active()) {
                FG.startFrameAnimation(animation)
            } else {
                FG.pauseFrameAnimation(animation)
            }
        })

        onCleanup(() => {
            FG.stopFrameAnimation(animation)
        })
    }

    return canvas
}
