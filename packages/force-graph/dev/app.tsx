import * as S from '@nothing-but/solid/signal'
import { createEventListenerMap } from '@solid-primitives/event-listener'
import { resolveElements } from '@solid-primitives/refs'
import { RootPoolFactory, createRootPool } from '@solid-primitives/rootless'
import clsx from 'clsx'
import { createMemo, onCleanup, type Component, type JSX } from 'solid-js'
import * as FG from '../src'
import { getLAGraph } from './init'

export const graph_options = FG.makeGraphOptions({
    inertia_strength: 0,
})

export function ForceGraph(props: {
    graph: FG.Graph
    node: RootPoolFactory<FG.Node, JSX.Element>
}): JSX.Element {
    const useNodeEl = createRootPool(props.node)
    const nodeEls = resolveElements(() => props.graph.nodes.map(useNodeEl)).toArray

    const useLine = createRootPool(
        () => (<line class="stroke-gray-6/40 stroke-0.2%" />) as SVGLineElement,
    )
    const lines = createMemo(() => props.graph.edges.map(useLine))

    const TARGET_FPS = 44
    const TARGET_MS = 1000 / TARGET_FPS
    let last_timestamp = performance.now()

    const loop = (timestamp: DOMHighResTimeStamp) => {
        const delta_time = timestamp - last_timestamp
        let times = Math.floor(delta_time / TARGET_MS)
        last_timestamp += times * TARGET_MS

        if (times === 0) {
            raf = requestAnimationFrame(loop)
            return
        }

        times = Math.min(times, 2)
        for (let i = 0; i < times; i++) {
            FG.simulateGraph(props.graph)
        }

        const els = nodeEls(),
            line_els = lines(),
            { nodes, edges } = props.graph

        for (let i = 0; i < edges.length; i++) {
            const [node_a, node_b] = edges[i]!
            const line = line_els[i]!

            if (node_a.moved) {
                line.x1.baseVal.valueAsString = node_a.position.x + 50 + '%'
                line.y1.baseVal.valueAsString = node_a.position.y + 50 + '%'
            }

            if (node_b.moved) {
                line.x2.baseVal.valueAsString = node_b.position.x + 50 + '%'
                line.y2.baseVal.valueAsString = node_b.position.y + 50 + '%'
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

        raf = requestAnimationFrame(loop)
    }
    let raf = requestAnimationFrame(loop)
    onCleanup(() => cancelAnimationFrame(raf))

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

    const dragging = S.signal<FG.Node>()

    const isDragging = S.selector(dragging)

    function setDragging(node: FG.Node | undefined) {
        if (node === undefined) {
            const node = dragging.value
            if (node === undefined) return
            node.locked = false
            S.set(dragging, undefined)
            return
        }
        node.locked = true
        S.set(dragging, node)
    }

    function handleDragEvent(e: MouseEvent) {
        const node = dragging.value
        if (node === undefined) return

        e.preventDefault()

        const rect = container.getBoundingClientRect(),
            p_x = (e.clientX - rect.left) / rect.width,
            p_y = (e.clientY - rect.top) / rect.height,
            pos_x = p_x * 100 - 50,
            pos_y = p_y * 100 - 50

        FG.changeNodePosition(force_graph.grid, node, pos_x, pos_y)
    }

    createEventListenerMap(document, {
        mouseup: _ => setDragging(undefined),
        mouseleave: _ => setDragging(undefined),
        mousemove: handleDragEvent,
    })

    let container!: HTMLDivElement
    return (
        <div class="w-screen h-110vh center-child overflow-hidden">
            <div
                ref={container}
                class="w-90vmin h-90vmin m-auto bg-dark-9 relative overflow-hidden"
            >
                <ForceGraph
                    graph={force_graph}
                    node={node => (
                        <div
                            class={clsx(
                                'absolute top-0 left-0 w-0 h-0',
                                'center-child text-2 leading-1.5 text-center select-none',
                                isDragging(node()) ? 'text-cyan' : 'text-red',
                            )}
                            style="will-change: translate"
                            onMouseDown={e => {
                                if (dragging.value !== undefined) return

                                setDragging(node())

                                handleDragEvent(e)
                            }}
                        >
                            {node().key}
                        </div>
                    )}
                />
            </div>
        </div>
    )
}
