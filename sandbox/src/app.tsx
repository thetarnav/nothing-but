import { type Component, onCleanup, type JSX, createMemo } from 'solid-js'
import { graph, s } from '../../packages/core/src'
import clsx from 'clsx'
import { generateInitialGraph } from './init'
import { createEventListenerMap } from '@solid-primitives/event-listener'
import { createRootPool, RootPoolFactory } from '@solid-primitives/rootless'
import { resolveElements } from '@solid-primitives/refs'

const MIN_MOVE = 0.001

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

    /*
        save previous positions to avoid unnecessary DOM updates
    */
    const prev_nodes_x: number[] = []
    const prev_nodes_y: number[] = []

    const prev_edges_x: number[] = []
    const prev_edges_y: number[] = []

    const loop = () => {
        graph.updatePositionsOptimized(props.graph)

        const els = nodeEls(),
            line_els = lines(),
            { nodes, edges } = props.graph

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]!,
                prev_x = prev_nodes_x[i],
                prev_y = prev_nodes_y[i]

            if (prev_x !== undefined) {
                const dx = node.position.x - prev_x
                const dy = node.position.y - prev_y!

                if (dx * dx + dy * dy <= MIN_MOVE) continue
            }

            prev_nodes_x[i] = node.position.x
            prev_nodes_y[i] = node.position.y

            const el = els[i]! as HTMLElement

            el.style.translate = `calc(${node.position.x + 50} * 0.8vw) calc(${
                50 - node.position.y
            } * 0.8vw)`
        }

        prev_nodes_x.length = nodes.length
        prev_nodes_y.length = nodes.length

        for (let i = 0; i < edges.length; i++) {
            const [node_a, node_b] = edges[i]!,
                prev_a_x = prev_edges_x[i * 2],
                prev_a_y = prev_edges_y[i * 2],
                prev_b_x = prev_edges_x[i * 2 + 1],
                prev_b_y = prev_edges_y[i * 2 + 1]

            if (prev_a_x !== undefined) {
                const dx_a = node_a.position.x - prev_a_x,
                    dy_a = node_a.position.y - prev_a_y!,
                    dx_b = node_b.position.x - prev_b_x!,
                    dy_b = node_b.position.y - prev_b_y!

                if (dx_a * dx_a + dy_a * dy_a <= MIN_MOVE && dx_b * dx_b + dy_b * dy_b <= MIN_MOVE)
                    continue
            }

            prev_edges_x[i * 2] = node_a.position.x
            prev_edges_y[i * 2] = node_a.position.y
            prev_edges_x[i * 2 + 1] = node_b.position.x
            prev_edges_y[i * 2 + 1] = node_b.position.y

            const line = line_els[i]!

            line.x1.baseVal.valueAsString = `${node_a.position.x + 50}%`
            line.y1.baseVal.valueAsString = `${50 - node_a.position.y}%`
            line.x2.baseVal.valueAsString = `${node_b.position.x + 50}%`
            line.y2.baseVal.valueAsString = `${50 - node_b.position.y}%`
        }

        prev_edges_x.length = edges.length * 2
        prev_edges_y.length = edges.length * 2

        // if (performance.now() - start < 3000) {
        raf = requestAnimationFrame(loop)
        // }
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
