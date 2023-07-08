import { trig } from '.'

export class Node {
    position: trig.Vector
    last_position: trig.Vector
    edges: Edge[] = []
    locked = false

    constructor(position: trig.Vector) {
        this.position = position
        this.last_position = position
    }
}

export function connect(a: Node, b: Node): Edge {
    const edge: Edge = [a, b]
    a.edges.push(edge)
    b.edges.push(edge)
    return edge
}

export function disconnect(a: Node, b: Node) {
    const a_edge_index = a.edges.findIndex(edge => edge[1] === b)
    const b_edge_index = b.edges.findIndex(edge => edge[0] === a)
    a.edges.splice(a_edge_index, 1)
    b.edges.splice(b_edge_index, 1)
}

export type Edge = [Node, Node]

export function addNodeEdges(node: Node, seen: Set<Node>, edges: Edge[]): void {
    if (seen.has(node)) return

    for (const edge of node.edges) {
        if (seen.has(edge[0]) || seen.has(edge[1])) continue
        edges.push(edge)
    }

    seen.add(node)
}

export function updateNodePositions(nodes: Node[]): void {
    const new_positions = new Map<Node, trig.Vector>()

    for (const node of nodes) {
        if (node.locked) {
            new_positions.set(node, node.position)
            continue
        }

        /*
            inertia
        */
        const velocity = trig.vec_difference(node.position, node.last_position)
        trig.vec_multiply(velocity, 0.97)

        /*
            towards the edges
        */
        for (const edge of node.edges) {
            const node_b = edge[0] === node ? edge[1] : edge[0]

            const force = trig.force(node.position, node_b.position)
            force.distance *= 0.002

            trig.vec_add(velocity, force)
        }

        /*
            away from other nodes
        */
        for (const node_b of nodes) {
            if (node_b === node) continue

            const force = trig.force(node_b.position, node.position)
            force.distance = 0.04 / force.distance

            trig.vec_add(velocity, force)
        }

        /*
            towards the center
        */
        {
            const force = trig.force(node.position, trig.ZERO)
            force.distance *= 0.0005

            trig.vec_add(velocity, force)
        }

        const new_position = trig.vec_sum(node.position, velocity)
        new_positions.set(node, new_position)
    }

    for (const [node, new_position] of new_positions) {
        const d = trig.vec_distance(node.position, new_position)
        node.last_position = node.position
        if (d < 0.01) continue
        node.position = new_position
    }
}
