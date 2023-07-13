import { type Component, onCleanup, type JSX } from 'solid-js'
import { graph, s } from '../../packages/core/src'
import clsx from 'clsx'
import { generateInitialGraph } from './init'
import { createEventListenerMap } from '@solid-primitives/event-listener'
import { createRootPool, RootPoolFactory } from '@solid-primitives/rootless'
import { resolveElements } from '@solid-primitives/refs'

export function ForceGraph(props: {
    graph: graph.Graph
    node: RootPoolFactory<graph.Node, JSX.Element>
}): JSX.Element {
    const useNodeEl = createRootPool(props.node)

    const nodeEls = resolveElements(() => props.graph.nodes.map(useNodeEl)).toArray

    const start = performance.now()

    const loop = () => {
        graph.updatePositionsOptimized(props.graph)

        const els = nodeEls()
        const nodes = props.graph.nodes

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]!
            const el = els[i]! as HTMLElement
            el.style.translate = `calc(${node.position.x + 50} * 0.8vw) calc(${
                50 - node.position.y
            } * 0.8vw) 0.0001px`
        }

        // if (performance.now() - start < 2000) {
        raf = requestAnimationFrame(loop)
        // }
    }
    let raf = requestAnimationFrame(loop)
    onCleanup(() => cancelAnimationFrame(raf))

    return <>{nodeEls()}</>
}

export const App: Component = () => {
    // const initialGraph = getInitialGraph()
    const force_graph = generateInitialGraph(1024)
    // const initialGraph = getLAGraph()

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

        const rect = container.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        const pos_x = x * 100 - 50
        const pos_y = 50 - y * 100

        if (pos_x === node.position.x && pos_y === node.position.y) return

        node.position.x = pos_x
        node.position.y = pos_y

        graph.correctNodeOrder(force_graph, node)
    }

    createEventListenerMap(document, {
        mouseup: e => setDragging(undefined),
        mouseleave: e => setDragging(undefined),
        mousemove: handleDragEvent,
    })

    let container!: HTMLDivElement
    return (
        <div ref={container} class="w-80vw h-80vw m-10vw bg-dark-9 relative overflow-hidden">
            <svg class="absolute w-full h-full">
                {/* <For each={signal.value.edges}>
                    {edge => (
                        <line
                            class="stroke-gray stroke-0.2%"
                            x1={`${(signal.value, edge[0].position.x) + 50}%`}
                            y1={`${50 - (signal.value, edge[0].position.y)}%`}
                            x2={`${(signal.value, edge[1].position.x) + 50}%`}
                            y2={`${50 - (signal.value, edge[1].position.y)}%`}
                        />
                    )}
                </For> */}
                {/* <For each={signal.value.nodes}>
                    {node => (
                        <line
                            class="stroke-violet stroke-0.2%"
                            x1={`${(signal.value, node.position.x) + 50}%`}
                            y1={`${50 - (signal.value, node.position.y)}%`}
                            x2={`${(signal.value, node.position.x + node.velocity.x * 20) + 50}%`}
                            y2={`${50 - (signal.value, node.position.y + node.velocity.y * 20)}%`}
                        />
                    )}
                </For> */}
            </svg>
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
    )
}
