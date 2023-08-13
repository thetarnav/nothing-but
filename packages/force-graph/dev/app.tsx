import * as S from '@nothing-but/solid/signal'
import { event, math } from '@nothing-but/utils'
import { Position } from '@nothing-but/utils/types'
import { type Component } from 'solid-js'
import * as FG from '../src/index.js'
import { CanvasForceGraph } from './display-graph.jsx'
import { getLAGraph } from './init.js'

const TARGET_FPS = 44
export const graph_options = FG.makeGraphOptions({
    inertia_strength: 0.3,
    link_strength: 0.012,
    origin_strength: 0.01,
    repel_distance: 22,
    repel_strength: 0.5,
})

export const App: Component = () => {
    // const initialGraph = getInitialGraph()
    // const force_graph = generateInitialGraph(1024)
    const force_graph = getLAGraph()

    const change_signal = S.signal()

    const position = S.signal<Position>({ x: 0, y: 0 })
    const scale = S.signal(2)

    function getEventPosition(e: PointerEvent): Position {
        const p = event.positionInElement(e, container)
        const { grid_size } = force_graph.options
        const scale_value = scale.value
        const scaled_size = grid_size / scale_value
        return {
            x: p.x * scaled_size - scaled_size / 2,
            y: p.y * scaled_size - scaled_size / 2,
        }
    }

    // const enum StateType {
    //     Default,
    //     Dragging,
    //     MovingSpace,
    //     Moving,
    // }

    // type KeyboardEventNames = 'ESCAPE' | 'SPACE'

    // type KeyboardEvents = {
    //     [K in KeyboardEventNames]?: (e: KeyboardEvent) => void
    // }

    // const state = createMachine<{
    //     [StateType.Default]: {
    //         value: KeyboardEvents
    //         to: StateType.Dragging | StateType.MovingSpace
    //     }
    //     [StateType.Dragging]: {
    //         input: {
    //             node: FG.Node
    //             e: PointerEvent
    //         }
    //         value: KeyboardEvents & { node: FG.Node }
    //         to: StateType.Default
    //     }
    //     [StateType.MovingSpace]: {
    //         value: KeyboardEvents
    //         to: StateType.Default | StateType.Moving
    //     }
    //     [StateType.Moving]: {
    //         input: PointerEvent
    //         value: KeyboardEvents
    //         to: StateType.Default | StateType.MovingSpace
    //     }
    // }>({
    //     initial: StateType.Default,
    //     states: {
    //         [StateType.Default](input, next) {
    //             return {
    //                 SPACE(e) {
    //                     e.preventDefault()
    //                     next(StateType.MovingSpace)
    //                 },
    //             }
    //         },
    //         [StateType.Dragging](data, next) {
    //             data.node.locked = true
    //             onCleanup(() => (data.node.locked = false))

    //             const pointer_id = data.e.pointerId

    //             function handleDrag(e: PointerEvent) {
    //                 if (e.pointerId !== pointer_id) return

    //                 e.preventDefault()
    //                 e.stopPropagation()

    //                 const pos = getEventPosition(e)

    //                 FG.changeNodePosition(force_graph.grid, data.node, pos.x, pos.y)
    //             }

    //             handleDrag(data.e)
    //             makeEventListener(document, 'pointermove', handleDrag)

    //             createEventListener(document, ['pointerup', 'pointercancel', 'pointerleave'], e => {
    //                 if (e.pointerId !== pointer_id) return
    //                 next(StateType.Default)
    //             })

    //             return {
    //                 node: data.node,
    //                 ESCAPE(e) {
    //                     e.preventDefault()
    //                     next(StateType.Default)
    //                 },
    //             }
    //         },
    //         [StateType.MovingSpace](data, next) {
    //             makeEventListener(document, 'pointerdown', e => {
    //                 if (e.button !== 0) return

    //                 e.preventDefault()

    //                 next(StateType.Moving, e)
    //             })

    //             makeEventListener(document, 'keyup', e => {
    //                 if (e.key === ' ') {
    //                     e.preventDefault()
    //                     next(StateType.Default)
    //                 }
    //             })

    //             return {
    //                 ESCAPE(e) {
    //                     e.preventDefault()
    //                     next(StateType.Default)
    //                 },
    //             }
    //         },
    //         [StateType.Moving](e, next) {
    //             const start = getEventPosition(e)
    //             const pointer_id = e.pointerId

    //             makeEventListener(document, 'pointermove', e => {
    //                 if (e.pointerId !== pointer_id) return

    //                 e.preventDefault()
    //                 e.stopPropagation()

    //                 const pos = getEventPosition(e)

    //                 S.mutate(position, p => {
    //                     p.x += pos.x - start.x
    //                     p.y += pos.y - start.y
    //                 })
    //             })

    //             createEventListener(document, ['pointerup', 'pointercancel', 'pointerleave'], e => {
    //                 if (e.pointerId !== pointer_id) return
    //                 next(StateType.MovingSpace)
    //             })

    //             makeEventListener(document, 'keyup', e => {
    //                 if (e.key === ' ') {
    //                     next(StateType.Default)
    //                 }
    //             })

    //             return {
    //                 ESCAPE(e) {
    //                     e.preventDefault()
    //                     next(StateType.Default)
    //                 },
    //             }
    //         },
    //     },
    // })

    // makeEventListener(document, 'keydown', e => {
    //     if (
    //         e.ctrlKey ||
    //         e.altKey ||
    //         e.metaKey ||
    //         e.shiftKey ||
    //         e.isComposing ||
    //         e.defaultPrevented ||
    //         e.target !== document.body
    //     )
    //         return

    //     switch (e.key) {
    //         case 'Escape': {
    //             state.value.ESCAPE?.(e)
    //             break
    //         }
    //         case ' ': {
    //             state.value.SPACE?.(e)
    //             break
    //         }
    //     }
    // })

    // const isDraggingNode = createSelector(
    //     state,
    //     (node: FG.Node, v) => v.type === StateType.Dragging && v.value.node === node,
    // )

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
                <CanvasForceGraph
                    graph={force_graph}
                    targetFPS={TARGET_FPS}
                    trackNodes={change_signal.read}
                />

                {/* <div
                    class="absolute inset-0"
                    style={{
                        transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`,
                    }}
                >
                    <SvgForceGraph
                        graph={force_graph}
                        active={state.type === StateType.Dragging}
                        targetFPS={TARGET_FPS}
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
                </div> */}
            </div>
        </div>
    )
}
