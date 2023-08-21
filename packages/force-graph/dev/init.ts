import { math } from '@nothing-but/utils'
import * as fg from '../src/index.js'
import { graph_options } from './app.jsx'
import la_raw from './la.json'

export function getLAGraph() {
    const nodes: fg.Node[] = new Array(la_raw.length)

    const edges: fg.Edge[] = []

    const node_map = new Map<string, fg.Node>()
    for (let i = 0; i < la_raw.length; i++) {
        const raw = la_raw[i]!
        const node = fg.makeNode(raw.file)
        nodes[i] = node
        node_map.set(raw.file, node)
    }

    for (const raw of la_raw) {
        const node = node_map.get(raw.file)!

        for (const link of raw.links) {
            const link_node = node_map.get(link.file)

            if (!link_node || fg.getEdge(node, link_node)) continue

            const edge = fg.connect(node, link_node, 1 + link.count / 10)
            edges.push(edge)
        }
    }

    for (const node of nodes) {
        node.mass = fg.nodeMassFromEdges(node.edges.length)
        node.position.x = math.random_from(0, graph_options.grid_size)
        node.position.y = math.random_from(0, graph_options.grid_size)
    }

    return fg.makeGraph(graph_options, nodes, edges)
}

export function generateInitialGraph(length: number = 256): fg.Graph {
    const nodes: fg.Node[] = Array.from({ length }, fg.makeNode)

    const edges: fg.Edge[] = []

    for (let i = 0; i < length; i++) {
        const node = nodes[i]!

        if (node.edges.length > 0 && Math.random() < 0.8) continue

        const b_index = math.random_int(length)
        let node_b = nodes[b_index]!

        if (node_b === node) {
            node_b = nodes[(b_index + 1) % length]!
        }

        edges.push(fg.connect(node, node_b))
    }

    fg.randomizeNodePositions(nodes, graph_options.grid_size)

    return fg.makeGraph(graph_options, nodes, edges)
}
