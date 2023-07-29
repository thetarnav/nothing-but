import { math, trig } from '@nothing-but/utils'
import * as graph from '../src'
import la_raw from './la.json'

export function getLAGraph() {
    const nodes: graph.Node[] = la_raw.map(() => new graph.Node(trig.vector(0, 0)))

    graph.randomizeNodePositions(nodes)

    const edges: graph.Edge[] = []

    const node_map = new Map<string, graph.Node>()
    for (let i = 0; i < la_raw.length; i++) {
        const node = nodes[i]!
        const raw = la_raw[i]!
        node_map.set(raw.file, node)
    }

    for (const raw of la_raw) {
        const node = node_map.get(raw.file)!

        for (const link of raw.links) {
            const link_node = node_map.get(link.file)

            if (!link_node || graph.getEdge(node, link_node)) continue

            const edge = graph.connect(node, link_node)
            edges.push(edge)
        }
    }

    const new_graph = new graph.Graph()

    new_graph.nodes = nodes
    new_graph.edges = edges

    graph.resetOrder(new_graph)

    return new_graph
}

export function generateInitialGraph(length: number = 256): graph.Graph {
    const nodes: graph.Node[] = Array.from({ length }, () => new graph.Node(trig.vector(0, 0)))

    graph.randomizeNodePositions(nodes)

    const edges: graph.Edge[] = []

    for (let i = 0; i < length; i++) {
        const node = nodes[i]!

        if (node.edges.length > 0 && Math.random() < 0.8) continue

        const b_index = math.random_int(length)
        let node_b = nodes[b_index]!

        if (node_b === node) {
            node_b = nodes[(b_index + 1) % length]!
        }

        edges.push(graph.connect(node, node_b))
    }

    const new_graph = new graph.Graph()

    new_graph.nodes = nodes
    new_graph.edges = edges

    graph.resetOrder(new_graph)

    return new_graph
}
