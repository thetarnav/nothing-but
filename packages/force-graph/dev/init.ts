import { math } from '@nothing-but/utils'
import * as FG from '../src/index.js'
import { graph_options } from './app.jsx'
import la_raw from './la.json'

export function getLAGraph() {
    const nodes: FG.Node[] = new Array(la_raw.length)

    const edges: FG.Edge[] = []

    const node_map = new Map<string, FG.Node>()
    for (let i = 0; i < la_raw.length; i++) {
        const raw = la_raw[i]!
        const node = FG.makeNode(raw.file)
        nodes[i] = node
        node_map.set(raw.file, node)
    }

    for (const raw of la_raw) {
        const node = node_map.get(raw.file)!

        for (const link of raw.links) {
            const link_node = node_map.get(link.file)

            if (!link_node || FG.getEdge(node, link_node)) continue

            const edge = FG.connect(node, link_node, 1 + link.count / 10)
            edges.push(edge)
        }
    }

    FG.randomizeNodePositions(nodes, graph_options)

    return FG.makeGraph(graph_options, nodes, edges)
}

export function generateInitialGraph(length: number = 256): FG.Graph {
    const nodes: FG.Node[] = Array.from({ length }, FG.makeNode)

    const edges: FG.Edge[] = []

    for (let i = 0; i < length; i++) {
        const node = nodes[i]!

        if (node.edges.length > 0 && Math.random() < 0.8) continue

        const b_index = math.random_int(length)
        let node_b = nodes[b_index]!

        if (node_b === node) {
            node_b = nodes[(b_index + 1) % length]!
        }

        edges.push(FG.connect(node, node_b))
    }

    FG.randomizeNodePositions(nodes, graph_options)

    return FG.makeGraph(graph_options, nodes, edges)
}
