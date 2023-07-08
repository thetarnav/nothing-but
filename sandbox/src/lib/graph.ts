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

        const velocity = trig.vec_difference(node.position, node.last_position)
        trig.vec_multiply(velocity, 0.97)

        for (const edge of node.edges) {
            const other_node = edge[0] === node ? edge[1] : edge[0],
                distance = trig.vec_distance(node.position, other_node.position),
                force = distance * 0.002,
                angle = trig.vec_angle(node.position, other_node.position),
                force_vector = trig.force_vec(force, angle)

            trig.vec_add(velocity, force_vector)
        }

        for (const other_node of nodes) {
            if (other_node === node) continue

            const distance = trig.vec_distance(node.position, other_node.position),
                force = 0.04 / distance,
                angle = trig.vec_angle(other_node.position, node.position),
                force_vector = trig.force_vec(force, angle)

            trig.vec_add(velocity, force_vector)
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
