import * as S from '@nothing-but/solid/signal'
import { ease, event, math, trig } from '@nothing-but/utils'
import type { Position } from '@nothing-but/utils/types'
import { createEventListener, createEventListenerMap } from '@solid-primitives/event-listener'
import { resolveElements } from '@solid-primitives/refs'
import { createRootPool, type RootPoolFactory } from '@solid-primitives/rootless'
import { createMachine, type MachineStates } from '@solid-primitives/state-machine'
import {
    batch,
    createEffect,
    createMemo,
    createSignal,
    onCleanup,
    onMount,
    type JSX,
} from 'solid-js'
import { Portal } from 'solid-js/web'
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
    size: S.Signal<number>
    position: S.Signal<Position>
    zoom: S.Signal<{
        /**
         * min
         * 0 - 1
         *     max
         */
        ratio: number
        /**
         * min
         * 1 - 6
         *     max
         */
        scale: number // TODO user configurable
    }>
}

const calcZoomScale = (zoom: number): number => 1 + ease.in_out_cubic(zoom) * 5
const calcNodeRadius = (canvas_size: number): number => canvas_size / 240
const calcEdgeWidth = (canvas_size: number): number => canvas_size / 2000

function makeCanvasState(canvas: HTMLCanvasElement, graph: FG.Graph): CanvasState | Error {
    const ctx = canvas.getContext('2d')
    if (!ctx) return new Error('Could not get canvas context')

    const init_size = Math.min(canvas.width, canvas.height)

    return {
        canvas,
        graph,
        ctx,
        size: S.signal(init_size),
        position: S.signal({ x: 0, y: 0 }),
        zoom: S.signal({
            ratio: 0,
            scale: calcZoomScale(0),
        }),
    }
}

function eventToGraphPos(state: CanvasState, e: PointerEvent | WheelEvent): Position {
    const ratio = event.ratioInElement(e, state.canvas)
    return pointRatioToGraphPos(state, ratio)
}

function pointRatioToGraphPos(state: CanvasState, pos: Position): trig.Vector {
    const { scale } = state.zoom.read(),
        grid_size = state.graph.grid.size,
        scaled_size = grid_size / scale,
        grid_pos = state.position.read()

    const graph_click_pos = trig.vec_map(
        pos,
        n => n * scaled_size + grid_size / 2 - scaled_size / 2,
    )

    graph_click_pos.x += grid_pos.x
    graph_click_pos.y += grid_pos.y

    return graph_click_pos
}

interface MoveDraggingInit {
    point_ratio: Position
    graph_position: Position
    pointer_id: number
}

function handleMoveEvent(state: CanvasState, e: PointerEvent, init: MoveDraggingInit): void {
    if (e.pointerId !== init.pointer_id) return

    e.preventDefault()
    e.stopPropagation()

    const click_ratio = event.ratioInElement(e, state.canvas)

    const delta = trig.vec_difference(init.point_ratio, click_ratio)
    trig.vec_mut(delta, n => n * (state.graph.grid.size / state.zoom.read().scale))

    S.mutate(state.position, pos => {
        pos.x = init.graph_position.x + delta.x
        pos.y = init.graph_position.y + delta.y
    })
}

interface BaseInput {
    state: CanvasState
}

interface Events {
    ESCAPE?(event: KeyboardEvent): void
    SPACE?(event: KeyboardEvent): void
    SPACE_UP?(event: KeyboardEvent): void

    POINTER_DOWN?(event: PointerEvent): void
    POINTER_UP?(event: PointerEvent | null): void
}

const enum Mode {
    Default = 'default',
    DraggingNode = 'dragging_node',
    MoveSpace = 'move_space',
    MoveDragging = 'move_dragging',
}

const mode_states: MachineStates<{
    [Mode.Default]: {
        to: Mode.DraggingNode | Mode.MoveSpace | Mode.MoveDragging
        input: BaseInput
        value: Events
    }
    [Mode.DraggingNode]: {
        to: Mode.Default
        input: BaseInput & {
            node: FG.Node
            pointer_id: number
            init_graph_point: Position
        }
        value: Events
    }
    [Mode.MoveSpace]: {
        to: Mode.Default
        input: BaseInput
        value: Events
    }
    [Mode.MoveDragging]: {
        to: Mode.Default
        input: BaseInput & MoveDraggingInit
        value: Events
    }
}> = {
    [Mode.Default]({ state }, to) {
        return {
            POINTER_DOWN(e) {
                e.preventDefault()
                e.stopPropagation()

                const canvas_size = state.size.read()
                const pointer_id = e.pointerId
                const point_graph = eventToGraphPos(state, e)

                const click_max_dist =
                    ((calcNodeRadius(canvas_size) + 5) / canvas_size) *
                    state.graph.options.grid_size

                const node = FG.findClosestNodeLinear(
                    state.graph.nodes,
                    point_graph,
                    click_max_dist,
                )

                if (node) {
                    to(Mode.DraggingNode, {
                        state,
                        node,
                        pointer_id,
                        init_graph_point: point_graph,
                    })
                } else {
                    to(Mode.MoveDragging, {
                        state,
                        point_ratio: event.ratioInElement(e, state.canvas),
                        graph_position: trig.vector(state.position.read()),
                        pointer_id,
                    })
                }
            },
            SPACE(e) {
                e.preventDefault()
                to(Mode.MoveSpace, { state })
            },
        }
    },
    [Mode.DraggingNode]({ state, node, pointer_id, init_graph_point }, to) {
        node.locked = true
        onCleanup(() => (node.locked = false))

        /*
            Smoothly move the node to the pointer position
        */
        const init_pos_delta = trig.vec_difference(init_graph_point, node.position)
        let last_graph_pos = init_graph_point
        const interval = setInterval(() => {
            trig.vec_mut(init_pos_delta, v => v * 0.95)
            FG.changeNodePosition(
                state.graph.grid,
                node,
                last_graph_pos.x - init_pos_delta.x,
                last_graph_pos.y - init_pos_delta.y,
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

            const goal_graph_e_pos = eventToGraphPos(state, e)
            last_graph_pos = goal_graph_e_pos
            const graph_e_pos = trig.vec_difference(goal_graph_e_pos, init_pos_delta)

            FG.changeNodePosition(state.graph.grid, node, graph_e_pos.x, graph_e_pos.y)
        })

        return {
            POINTER_UP(e) {
                if (e instanceof PointerEvent && e.pointerId !== pointer_id) return

                to(Mode.Default, { state })
            },
        }
    },
    [Mode.MoveSpace]({ state }, to) {
        const init$ = S.signal<MoveDraggingInit>()

        createEffect(() => {
            const init = init$.read()
            if (!init) return

            createEventListener(document, 'pointermove', e => {
                handleMoveEvent(state, e, init)
            })
        })

        return {
            SPACE(e) {
                e.preventDefault()
            },
            SPACE_UP(e) {
                to(Mode.Default, { state })
            },
            POINTER_DOWN(e) {
                if (init$.read() !== undefined) return

                e.preventDefault()
                e.stopPropagation()

                S.set(init$, {
                    point_ratio: event.ratioInElement(e, state.canvas),
                    graph_position: trig.vector(state.position.read()),
                    pointer_id: e.pointerId,
                })
            },
            POINTER_UP(e) {
                const init = init$.read()
                if (!init || (e instanceof PointerEvent && e.pointerId !== init.pointer_id)) return

                S.set(init$, undefined)
            },
        }
    },
    [Mode.MoveDragging](input, to) {
        const { state } = input

        createEventListener(document, 'pointermove', e => {
            handleMoveEvent(state, e, input)
        })

        return {
            POINTER_UP(e) {
                if (e instanceof PointerEvent && e.pointerId !== input.pointer_id) return

                to(Mode.Default, { state })
            },
        }
    },
}

function updateCanvas(state: CanvasState): void {
    const { ctx, graph } = state,
        { scale } = state.zoom.read(),
        { nodes, edges } = graph,
        canvas_size = state.size.read(),
        grid_size = graph.grid.size,
        grid_pos = state.position.read()

    const node_radius = calcNodeRadius(canvas_size)
    const edge_width = calcEdgeWidth(canvas_size)

    /*
        clear
    */
    ctx.resetTransform()
    ctx.clearRect(0, 0, canvas_size, canvas_size)

    /*
        transform - scale and translate
    */
    const correct_origin = -(scale - 1) * (canvas_size / 2)
    ctx.setTransform(
        scale,
        0,
        0,
        scale,
        correct_origin - (grid_pos.x / grid_size) * canvas_size * scale,
        correct_origin - (grid_pos.y / grid_size) * canvas_size * scale,
    )

    /*
        border
    */
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, canvas_size, canvas_size)

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
        ctx.moveTo(
            (a.position.x / grid_size) * canvas_size,
            (a.position.y / grid_size) * canvas_size,
        )
        ctx.lineTo(
            (b.position.x / grid_size) * canvas_size,
            (b.position.y / grid_size) * canvas_size,
        )
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
            (x / grid_size) * canvas_size,
            (y / grid_size) * canvas_size,
            node_radius,
            node_radius,
            0,
            0,
            Math.PI * 2,
        )
        ctx.fill()
    }
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

            S.set(state.size, size)
        })
        ro.observe(canvas)
        onCleanup(() => ro.disconnect())
    }

    const mode = createMachine({
        states: mode_states,
        initial: {
            type: Mode.Default,
            input: { state },
        },
    })

    createEventListenerMap(canvas, {
        pointerdown(e) {
            mode.value.POINTER_DOWN?.(e)
        },
        wheel(e) {
            batch(() => {
                e.preventDefault()
                const { deltaY } = e
                const graph_point_before = eventToGraphPos(state, e)

                S.mutate(state.zoom, zoom => {
                    zoom.ratio = math.clamp(zoom.ratio + deltaY * -0.0005, 0, 1)
                    zoom.scale = calcZoomScale(zoom.ratio)
                })

                /*
                    keep the same graph point under the cursor
                */
                const graph_point_after = eventToGraphPos(state, e)
                const delta = trig.vec_difference(graph_point_before, graph_point_after)

                S.update(state.position, pos => trig.vec_sum(pos, delta))
            })
        },
    })

    createEventListenerMap(document, {
        pointerup(e) {
            mode.value.POINTER_UP?.(e)
        },
        pointercancel(e) {
            mode.value.POINTER_UP?.(e)
        },
        contextmenu() {
            mode.value.POINTER_UP?.(null)
        },
        keydown(e) {
            if (event.shouldIgnoreKeydown(e)) return

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
        },
        keyup(e) {
            if (event.shouldIgnoreKeydown(e)) return

            if (e.key === ' ') {
                mode.value.SPACE_UP?.(e)
            }
        },
    })

    /*
        DEBUG
    */
    ;<Portal>
        <div class="fixed top-5 left-5">{mode.type}</div>
    </Portal>

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

        const active = createMemo(() => mode.type === Mode.DraggingNode || init()())

        createEffect(() => {
            if (active()) {
                FG.startFrameAnimation(animation)
            } else {
                FG.pauseFrameAnimation(animation)
            }
        })

        createEffect(() => {
            if (active()) return

            // track changes to the canvas
            state.size.read()
            state.zoom.read()
            state.position.read()

            requestAnimationFrame(() => updateCanvas(state))
        })

        onCleanup(() => {
            FG.stopFrameAnimation(animation)
        })
    }

    return canvas
}
