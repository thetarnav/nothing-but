import * as S from '@nothing-but/solid/signal'
import { createStateMachine } from '@nothing-but/solid/state-machine'
import { event, math } from '@nothing-but/utils'
import { Position } from '@nothing-but/utils/types'
import { createEventListener, makeEventListener } from '@solid-primitives/event-listener'
import { resolveElements } from '@solid-primitives/refs'
import { RootPoolFactory, createRootPool } from '@solid-primitives/rootless'
import clsx from 'clsx'
import {
    createEffect,
    createMemo,
    createSelector,
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

    const position = S.signal<Position>({ x: 0, y: 0 })
    const scale = S.signal(2)

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

    const enum StateType {
        Default,
        Dragging,
        MovingSpace,
        Moving,
    }

    const state = createStateMachine<{
        [StateType.Default]: {
            to: [StateType.Dragging, StateType.MovingSpace]
        }
        [StateType.Dragging]: {
            input: { node: FG.Node; e: PointerEvent }
            value: FG.Node
            to: [StateType.Default]
        }
        [StateType.MovingSpace]: {
            to: [StateType.Default, StateType.Moving]
        }
        [StateType.Moving]: {
            input: PointerEvent
            to: [StateType.Default, StateType.MovingSpace]
        }
    }>({
        initial: StateType.Default,
        states: {
            [StateType.Default]() {},
            [StateType.Dragging](data, next) {
                data.node.locked = true
                onCleanup(() => (data.node.locked = false))

                const pointer_id = data.e.pointerId

                function handleDrag(e: PointerEvent) {
                    if (e.pointerId !== pointer_id) return

                    e.preventDefault()
                    e.stopPropagation()

                    const pos = getEventPosition(e)

                    FG.changeNodePosition(force_graph.grid, data.node, pos.x, pos.y)
                }

                handleDrag(data.e)
                makeEventListener(document, 'pointermove', handleDrag)

                createEventListener(document, ['pointerup', 'pointercancel', 'pointerleave'], e => {
                    if (e.pointerId !== pointer_id) return
                    next(StateType.Default)
                })

                return data.node
            },
            [StateType.MovingSpace](data, next) {
                makeEventListener(document, 'pointerdown', e => {
                    if (e.button !== 0) return

                    e.preventDefault()

                    next(StateType.Moving, e)
                })

                makeEventListener(document, 'keyup', e => {
                    if (e.key === ' ') {
                        e.preventDefault()
                        next(StateType.Default)
                    }
                })
            },
            [StateType.Moving](e, next) {
                const start = getEventPosition(e)
                const pointer_id = e.pointerId

                makeEventListener(document, 'pointermove', e => {
                    if (e.pointerId !== pointer_id) return

                    e.preventDefault()
                    e.stopPropagation()

                    const pos = getEventPosition(e)

                    S.mutate(position, p => {
                        p.x += pos.x - start.x
                        p.y += pos.y - start.y
                    })
                })

                createEventListener(document, ['pointerup', 'pointercancel', 'pointerleave'], e => {
                    if (e.pointerId !== pointer_id) return
                    next(StateType.MovingSpace)
                })

                makeEventListener(document, 'keyup', e => {
                    if (e.key === ' ') {
                        next(StateType.Default)
                    }
                })
            },
        },
    })

    const isDraggingNode = createSelector(
        state,
        (node: FG.Node, v) => v.type === StateType.Dragging && v.value === node,
    )

    makeEventListener(document, 'keydown', e => {
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
                if (state.type !== StateType.Default) {
                    e.preventDefault()
                    state.to[StateType.Default]()
                }
                break
            }
            case ' ': {
                e.preventDefault()
                if (state.type !== StateType.Default) return
                state.to(StateType.MovingSpace)
                break
            }
        }
    })

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
                        active={state.type === StateType.Dragging}
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
                                on:pointerdown={e => {
                                    const state_val = state()

                                    if (e.button !== 0 || state_val.type !== StateType.Default) {
                                        return
                                    }

                                    state_val.to(StateType.Dragging, { node: node(), e })
                                }}
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
