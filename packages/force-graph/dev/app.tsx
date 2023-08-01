import * as S from '@nothing-but/solid/signal'
import { event, math } from '@nothing-but/utils'
import { Position } from '@nothing-but/utils/types'
import { createEventListener, makeEventListener } from '@solid-primitives/event-listener'
import { resolveElements } from '@solid-primitives/refs'
import { RootPoolFactory, createRootPool } from '@solid-primitives/rootless'
import clsx from 'clsx'
import {
    createEffect,
    createMemo,
    createSignal,
    onCleanup,
    onMount,
    type Component,
    type JSX,
} from 'solid-js'
import * as FG from '../src'
import { getLAGraph } from './init'

export const graph_options = FG.makeGraphOptions({
    inertia_strength: 0.3,
    link_strength: 0.012,
    origin_strength: 0.01,
    repel_distance: 22,
    repel_strength: 0.5,
})

export function ForceGraph(props: {
    graph: FG.Graph
    node: RootPoolFactory<FG.Node, JSX.Element>
    active?: boolean
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
        const TARGET_FPS = 44
        const animation = FG.makeFrameAnimation(props.graph, updateElements, TARGET_FPS)

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

function eventPositionInElement(e: PointerEvent, el: HTMLElement): Position {
    const rect = el.getBoundingClientRect()
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
    }
}

export const App: Component = () => {
    // const initialGraph = getInitialGraph()
    // const force_graph = generateInitialGraph(1024)
    const force_graph = getLAGraph()

    const change_signal = S.signal()

    interface DraggingNode {
        type: 'dragging'
        node: FG.Node
        pointer_id: number
    }

    interface MovingSpace {
        type: 'moving-space'
    }

    interface Moving {
        type: 'moving'
        point: Position
        pointer_id: number
    }

    type DraggingState = DraggingNode | MovingSpace | Moving

    const position = S.signal<Position>({ x: 0, y: 0 })
    const scale = S.signal(2)

    const dragging_state = S.signal<DraggingState>()

    const isDraggingNode = S.selector(
        dragging_state,
        (node: FG.Node, v) => !!v && v.type === 'dragging' && v.node === node,
    )

    createEffect((prev: DraggingNode | undefined) => {
        const { value } = dragging_state
        if (value && value.type === 'dragging') {
            value.node.locked = true
            return value
        }
        if (prev) {
            prev.node.locked = false
        }
    })

    function getEventPosition(e: PointerEvent): Position {
        const p = eventPositionInElement(e, container)
        const { grid_size } = force_graph.options
        const scale_value = scale.value
        const scaled_size = grid_size / scale_value
        return {
            x: p.x * scaled_size - scaled_size / 2,
            y: p.y * scaled_size - scaled_size / 2,
        }
    }

    function handlePointerMove(state: DraggingNode | Moving, e: PointerEvent) {
        if (e.pointerId !== state.pointer_id) return

        e.preventDefault()
        e.stopPropagation()

        const pos = getEventPosition(e)

        switch (state.type) {
            case 'dragging': {
                FG.changeNodePosition(force_graph.grid, state.node, pos.x, pos.y)
                break
            }
            case 'moving': {
                S.mutate(position, p => {
                    p.x += pos.x - state.point.x
                    p.y += pos.y - state.point.y
                })
                break
            }
        }
    }

    createEffect(() => {
        const dragging = dragging_state.get()
        if (dragging === undefined) return

        switch (dragging.type) {
            case 'dragging': {
                makeEventListener(document, 'pointermove', e => handlePointerMove(dragging, e))

                createEventListener(document, ['pointerup', 'pointercancel', 'pointerleave'], e => {
                    if (e.pointerId !== dragging.pointer_id) return
                    S.reset(dragging_state)
                })

                break
            }
            case 'moving': {
                makeEventListener(document, 'pointermove', e => handlePointerMove(dragging, e))

                createEventListener(document, ['pointerup', 'pointercancel', 'pointerleave'], e => {
                    if (e.pointerId !== dragging.pointer_id) return
                    S.set(dragging_state, { type: 'moving-space' })
                })

                makeEventListener(document, 'keyup', e => {
                    if (e.key === ' ') {
                        S.reset(dragging_state)
                    }
                })
                break
            }
            case 'moving-space': {
                makeEventListener(document, 'pointerdown', e => {
                    if (e.button !== 0) return

                    e.preventDefault()

                    const pos = getEventPosition(e)

                    S.set(dragging_state, {
                        type: 'moving',
                        point: { x: pos.x, y: pos.y },
                        pointer_id: e.pointerId,
                    })
                })

                makeEventListener(document, 'keyup', e => {
                    if (e.key === ' ') {
                        e.preventDefault()
                        S.reset(dragging_state)
                    }
                })

                break
            }
        }
    })

    makeEventListener(document, 'keydown', e => {
        if (
            e.repeat ||
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
                S.reset(dragging_state)
                break
            }
            case ' ': {
                const dragging = dragging_state.get()
                if (dragging) return

                e.preventDefault()

                S.set(dragging_state, { type: 'moving-space' })
            }
        }
    })

    function handleNodePointerDown(e: PointerEvent, node: FG.Node) {
        if (e.button !== 0 || dragging_state.value !== undefined) return

        const dragging: DraggingNode = {
            type: 'dragging',
            node,
            pointer_id: e.pointerId,
        }

        S.set(dragging_state, dragging)

        handlePointerMove(dragging, e)
    }

    // const interval = setInterval(() => {
    //     for (const node of force_graph.nodes) {
    //         node.key = node.key + '!'
    //     }
    //     S.trigger(change_signal)
    // }, 2000)
    // onCleanup(() => clearInterval(interval))

    function edgesMod(node: FG.Node) {
        return math.clamp(node.edges.length, 1, 30) / 30
    }

    let container!: HTMLDivElement
    return (
        <div class="w-screen min-h-110vh center-child flex-col overflow-hidden">
            <div
                ref={el => {
                    container = el
                    event.preventMobileScrolling(container)
                }}
                class="relative w-90vmin h-90vmin m-auto bg-dark-9 relative overflow-hidden overscroll-none touch-none"
            >
                <div
                    class="absolute inset-0"
                    style={{
                        transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`,
                    }}
                >
                    <ForceGraph
                        graph={force_graph}
                        active={dragging_state.value !== undefined}
                        node={node => (
                            <div
                                class={clsx(
                                    'absolute w-0 h-0',
                                    'center-child leading-100% text-center select-none cursor-move',
                                    isDraggingNode(node()) ? 'text-cyan' : 'text-white',
                                )}
                                style={{
                                    'will-change': 'top, left',
                                    'font-size': `calc(0.45vmin + 0.5vmin * ${edgesMod(node())})`,
                                    '--un-text-opacity': 0.6 + (edgesMod(node()) / 10) * 4,
                                }}
                                on:pointerdown={e => handleNodePointerDown(e, node())}
                            >
                                {(change_signal.value, node().key)}
                            </div>
                        )}
                    />
                </div>
            </div>
        </div>
    )
}
