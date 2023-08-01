import * as S from '@nothing-but/solid/signal'
import { event, math } from '@nothing-but/utils'
import { Position } from '@nothing-but/utils/types'
import { makeEventListener } from '@solid-primitives/event-listener'
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
        () => (<line class="stroke-cyan-7/25 stroke-0.2%" />) as SVGLineElement,
    )
    const lines = createMemo(() => props.graph.edges.map(useLine))

    function updateElements() {
        const els = nodeEls(),
            line_els = lines(),
            { nodes, edges } = props.graph

        for (let i = 0; i < edges.length; i++) {
            const { a, b } = edges[i]!
            const line = line_els[i]!

            if (a.moved) {
                line.x1.baseVal.valueAsString = a.position.x + 50 + '%'
                line.y1.baseVal.valueAsString = a.position.y + 50 + '%'
            }

            if (b.moved) {
                line.x2.baseVal.valueAsString = b.position.x + 50 + '%'
                line.y2.baseVal.valueAsString = b.position.y + 50 + '%'
            }
        }

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]!

            if (!node.moved) continue

            const { x, y } = node.position
            const el = els[i]! as HTMLElement

            el.style.translate = `calc(${x + 50} * 0.90vmin) calc(${y + 50} * 0.90vmin)`

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

export const App: Component = () => {
    // const initialGraph = getInitialGraph()
    // const force_graph = generateInitialGraph(1024)
    const force_graph = getLAGraph()

    const change_signal = S.signal()

    interface Dragging {
        node: FG.Node
        start: Position
        pointer_id: number
    }

    const dragging_state = S.signal<Dragging>()

    const isDraggingNode = S.selector(dragging_state, (node: FG.Node, v) => !!v && v.node === node)

    function setDragging(value: Dragging | undefined) {
        if (value === undefined) {
            const prev = dragging_state.value
            if (prev === undefined) return
            prev.node.locked = false
            S.set(dragging_state, undefined)
            return
        }
        value.node.locked = true
        S.set(dragging_state, value)
    }

    function handlePointerMove(dragging_state: Dragging, e: PointerEvent) {
        if (e.pointerId !== dragging_state.pointer_id) return

        e.preventDefault()
        e.stopPropagation()

        const rect = container.getBoundingClientRect(),
            p_x = (e.clientX - rect.left) / rect.width,
            p_y = (e.clientY - rect.top) / rect.height,
            pos_x = p_x * 100 - 50,
            pos_y = p_y * 100 - 50

        FG.changeNodePosition(force_graph.grid, dragging_state.node, pos_x, pos_y)
    }

    function handleNodePointerDown(e: PointerEvent, node: FG.Node) {
        if (e.button !== 0 || dragging_state.value !== undefined) return

        const dragging: Dragging = {
            node,
            start: { x: e.clientX, y: e.clientY },
            pointer_id: e.pointerId,
        }

        setDragging(dragging)

        handlePointerMove(dragging, e)
    }

    function handlePointerCancel(dragging_state: Dragging, e: PointerEvent) {
        if (e.pointerId !== dragging_state.pointer_id) return
        setDragging(undefined)
    }

    createEffect(() => {
        const dragging = dragging_state.value
        if (dragging === undefined) return

        makeEventListener(document, 'pointermove', e => handlePointerMove(dragging, e))

        makeEventListener(document, 'pointerup', e => handlePointerCancel(dragging, e))
        makeEventListener(document, 'pointercancel', e => handlePointerCancel(dragging, e))
        makeEventListener(document, 'pointerleave', e => handlePointerCancel(dragging, e))
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
                class="w-90vmin h-90vmin m-auto bg-dark-9 relative overflow-hidden overscroll-none touch-none"
            >
                <ForceGraph
                    graph={force_graph}
                    active={dragging_state.value !== undefined}
                    node={node => (
                        <div
                            class={clsx(
                                'absolute top-0 left-0 w-0 h-0',
                                'center-child leading-100% text-center select-none cursor-move',
                                isDraggingNode(node()) ? 'text-cyan' : 'text-white',
                            )}
                            style={{
                                'will-change': 'translate',
                                'font-size': `calc(0.9vmin + 1vmin * ${edgesMod(node())})`,
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
    )
}
