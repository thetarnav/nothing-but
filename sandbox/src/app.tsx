import { type Component, onCleanup, type JSX, createMemo } from 'solid-js'
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

    const useLine = createRootPool(
        () => (<line class="stroke-gray stroke-0.2%" />) as SVGLineElement,
    )
    const lines = createMemo(() => props.graph.edges.map(useLine))

    const start = performance.now()

    const loop = () => {
        graph.updatePositionsOptimized(props.graph)

        const els = nodeEls(),
            { nodes, edges } = props.graph

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]!,
                el = els[i]! as HTMLElement

            el.style.translate = `calc(${node.position.x + 50} * 0.8vw) calc(${
                50 - node.position.y
            } * 0.8vw)`
        }

        for (let i = 0; i < edges.length; i++) {
            const [node_a, node_b] = edges[i]!,
                line = lines()[i]!

            line.x1.baseVal.valueAsString = `${node_a.position.x + 50}%`
            line.y1.baseVal.valueAsString = `${50 - node_a.position.y}%`
            line.x2.baseVal.valueAsString = `${node_b.position.x + 50}%`
            line.y2.baseVal.valueAsString = `${50 - node_b.position.y}%`
        }

        if (performance.now() - start < 2000) {
            raf = requestAnimationFrame(loop)
        }
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
