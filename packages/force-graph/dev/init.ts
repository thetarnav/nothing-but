import {num} from '@nothing-but/utils'
import {graph} from '../src/index.js'
import {graph_options} from './app.jsx'
import la_raw from './la.json'
import la_2_raw from './la_2.json'

export function getLA2Graph(): graph.Graph {
    const entries = Object.entries(la_2_raw)
    const nodes: graph.Node[] = new Array(entries.length)
    const edges: graph.Edge[] = []
    const node_map = new Map<string, graph.Node>()

    /*
        Nodes
    */
    for (let i = 0; i < entries.length; i++) {
        const [key, raw] = entries[i]!

        const node = graph.zeroNode()
        node.key = key
        node.label = raw.prettyName
        node.mass = graph.nodeMassFromEdges(raw.connections.length)
        node.position.x = num.random_from(0, graph_options.grid_size)
        node.position.y = num.random_from(0, graph_options.grid_size)

        nodes[i] = node
        node_map.set(key, node)
    }

    /*
        Connections
    */
    for (const [key, raw] of entries) {
        const node = node_map.get(key)!

        for (const link_key of raw.connections) {
            const link_node = node_map.get(link_key)
            if (!link_node) continue

            const edge = graph.connect(node, link_node)
            edges.push(edge)
        }
    }

    return graph.makeGraph(graph_options, nodes, edges)
}

export function getLAGraph(): graph.Graph {
    const nodes: graph.Node[] = new Array(la_raw.length)

    const edges: graph.Edge[] = []

    const node_map = new Map<string, graph.Node>()
    for (let i = 0; i < la_raw.length; i++) {
        const raw = la_raw[i]!
        const node = graph.zeroNode()
        node.key = raw.file
        nodes[i] = node
        node_map.set(raw.file, node)
    }

    for (const raw of la_raw) {
        const node = node_map.get(raw.file)!

        for (const link of raw.links) {
            const link_node = node_map.get(link.file)

            if (!link_node || graph.getEdge(node, link_node)) continue

            const edge = graph.connect(node, link_node, 1 + link.count / 10)
            edges.push(edge)
        }
    }

    for (const node of nodes) {
        node.mass = graph.nodeMassFromEdges(node.edges.length)
        node.position.x = num.random_from(0, graph_options.grid_size)
        node.position.y = num.random_from(0, graph_options.grid_size)
    }

    return graph.makeGraph(graph_options, nodes, edges)
}

export function generateInitialGraph(length: number = 256): graph.Graph {
    const nodes: graph.Node[] = Array.from({length}, graph.zeroNode)

    const edges: graph.Edge[] = []

    for (let i = 0; i < length; i++) {
        const node = nodes[i]!

        if (node.edges.length > 0 && Math.random() < 0.8) continue

        const b_index = num.random_int(length)
        let node_b = nodes[b_index]!

        if (node_b === node) {
            node_b = nodes[(b_index + 1) % length]!
        }

        edges.push(graph.connect(node, node_b))
    }

    graph.randomizeNodePositions(nodes, graph_options.grid_size)

    return graph.makeGraph(graph_options, nodes, edges)
}
