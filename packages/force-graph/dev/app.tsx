import { signal as s } from '@nothing-but/solid'
import { createEventListenerMap } from '@solid-primitives/event-listener'
import { resolveElements } from '@solid-primitives/refs'
import { RootPoolFactory, createRootPool } from '@solid-primitives/rootless'
import clsx from 'clsx'
import { createMemo, onCleanup, type Component, type JSX } from 'solid-js'
import * as graph from '../src'
import { getLAGraph } from './init'

export function ForceGraph(props: {
    graph: graph.Graph
    node: RootPoolFactory<graph.Node, JSX.Element>
}): JSX.Element {
    const useNodeEl = createRootPool(props.node)
    const nodeEls = resolveElements(() => props.graph.nodes.map(useNodeEl)).toArray

    const useLine = createRootPool(
        () => (<line class="stroke-gray/50 stroke-0.2%" />) as SVGLineElement,
    )
    const lines = createMemo(() => props.graph.edges.map(useLine))

    const start = performance.now()

    /*
        save previous positions to avoid unnecessary DOM updates
    */

    let last_timestamp = 0
    const loop = (timestamp: DOMHighResTimeStamp) => {
        // console.log('FRAME', timestamp)

        // const delta = timestamp - last_timestamp
        // const fps = 1000 / delta
        // last_timestamp = timestamp

        // console.log('FRAME', fps)

        graph.simulateGraph(props.graph)

        const els = nodeEls(),
            line_els = lines(),
            { nodes, edges } = props.graph

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]!

            if (!node.moved) continue

            const { x, y } = node.position
            const el = els[i]! as HTMLElement

            el.style.translate = `calc(${x + 50} * 0.8vmin) calc(${y + 50} * 0.8vmin)`
        }

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

        // if (performance.now() - start < 3000) {
        raf = requestAnimationFrame(loop)
        // }
    }
    let raf = requestAnimationFrame(loop)
    onCleanup(() => cancelAnimationFrame(raf))

    // setInterval(() => {
    //     // console.log('INTERVAL')
    //     graph.updatePositionsOptimized(props.graph)
    // })

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

    const dragging = s.signal<graph.Node>()

    const isDragging = s.selector(dragging)

    function setDragging(node: graph.Node | undefined) {
        if (node === undefined) {
            const node = dragging.value
            if (node === undefined) return
            node.locked = false
            s.set(dragging, undefined)
            return
        }
        node.locked = true
        s.set(dragging, node)
    }

    function handleDragEvent(e: MouseEvent) {
        const node = dragging.value
        if (node === undefined) return

        e.preventDefault()

        const rect = container.getBoundingClientRect(),
            x = (e.clientX - rect.left) / rect.width,
            y = (e.clientY - rect.top) / rect.height,
            pos_x = x * 100 - 50,
            pos_y = y * 100 - 50

        graph.changeNodePosition(force_graph.grid, node, pos_x, pos_y)
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
                class="w-80vmin h-80vmin m-auto bg-dark-9 relative overflow-hidden"
            >
                <ForceGraph
                    graph={force_graph}
                    node={node => (
                        <div
                            class={clsx(
                                'absolute top-0 left-0 w-2% h-2% rounded-full -mt-1% -ml-1%',
                                isDragging(node()) ? 'bg-cyan' : 'bg-red',
                            )}
                            style="will-change: translate"
                            onMouseDown={e => {
                                if (dragging.value !== undefined) return

                                setDragging(node())

                                handleDragEvent(e)
                            }}
                        ></div>
                    )}
                />
            </div>
        </div>
    )
}
