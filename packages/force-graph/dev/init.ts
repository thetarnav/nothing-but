import { math, trig } from '@nothing-but/utils'
import * as graph from '../src'
import la_raw from './la.json'

export function getLAGraph() {
    const nodes: graph.Node[] = la_raw.map(
        () => new graph.Node(trig.vector(math.random_from(-50, 50), math.random_from(-50, 50))),
    )

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

export function getInitialGraph() {
    const nodes: graph.Node[] = [
        new graph.Node(trig.vector(0, 0)), // 0
        new graph.Node(trig.vector(0, 20)), // 1
        new graph.Node(trig.vector(20, 0)), // 2
        new graph.Node(trig.vector(-20, -15)), // 3
        new graph.Node(trig.vector(35, -10)), // 4
        new graph.Node(trig.vector(15, 40)), // 5
        new graph.Node(trig.vector(-30, 30)), // 6

        new graph.Node(trig.vector(-20, 20)), // 7
        new graph.Node(trig.vector(-25, -5)), // 8
        new graph.Node(trig.vector(-30, 10)), // 9

        new graph.Node(trig.vector(-15, -25)), // 10

        new graph.Node(trig.vector(25, -25)), // 11
        new graph.Node(trig.vector(20, -25)), // 12
        new graph.Node(trig.vector(20, -20)), // 13
        new graph.Node(trig.vector(25, -20)), // 14
        new graph.Node(trig.vector(30, -20)), // 15
        new graph.Node(trig.vector(30, -25)), // 16
        new graph.Node(trig.vector(30, -30)), // 17
        new graph.Node(trig.vector(25, -30)), // 18
    ]

    const edges: graph.Edge[] = [
        graph.connect(nodes[0]!, nodes[1]!),
        graph.connect(nodes[0]!, nodes[2]!),
        graph.connect(nodes[0]!, nodes[3]!),
        graph.connect(nodes[2]!, nodes[4]!),
        graph.connect(nodes[1]!, nodes[5]!),
        graph.connect(nodes[1]!, nodes[6]!),
        graph.connect(nodes[4]!, nodes[5]!),

        graph.connect(nodes[7]!, nodes[8]!),
        graph.connect(nodes[7]!, nodes[9]!),

        graph.connect(nodes[7]!, nodes[12]!),

        graph.connect(nodes[11]!, nodes[12]!),
        graph.connect(nodes[11]!, nodes[13]!),
        graph.connect(nodes[11]!, nodes[14]!),
        graph.connect(nodes[11]!, nodes[15]!),
        graph.connect(nodes[11]!, nodes[16]!),
        graph.connect(nodes[11]!, nodes[17]!),
        graph.connect(nodes[11]!, nodes[18]!),
    ]

    return { nodes, edges }
}

export function generateInitialGraph(length: number = 256): graph.Graph {
    const nodes: graph.Node[] = Array.from(
        { length },
        () => new graph.Node(trig.vector(math.random_from(-50, 50), math.random_from(-50, 50))),
    )
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
