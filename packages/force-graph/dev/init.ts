import { math, trig } from '@nothing-but/utils'
import * as graph from '../src'
import la_raw from './la.json'

export function getLAGraph() {
    const nodes: graph.Node[] = la_raw.map(() => new graph.Node(trig.vector(0, 0)))

    graph.randomizeNodePositions(nodes)

    const edges: graph.Edge[] = []

    for (let i = 0; i < la_raw.length; i++) {
        const node = nodes[i]!
        const raw = la_raw[i]!

        for (const raw_b of raw.links) {
            const b_name = raw_b.file

            const b_index = la_raw.findIndex(raw => raw.file === b_name)

            if (b_index === -1) continue

            const node_b = nodes[b_index]!

            edges.push(graph.connect(node, node_b))
        }
    }

    return { nodes, edges }
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
