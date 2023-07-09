import { math, trig } from '.'

export class Node {
    position: trig.Vector
    velocity: trig.Vector = trig.zero()
    edges: Edge[] = []
    locked = false

    constructor(position: trig.Vector) {
        this.position = position
    }
}

export type Edge = [Node, Node]

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
        /*
            inertia
        */
        trig.vec_multiply(node.velocity, 0.8)

        if (node.locked) {
            new_positions.set(node, node.position)
            node.velocity = trig.zero()
            continue
        }

        /*
            away from other nodes
        */
        for (const node_b of nodes) {
            if (node_b === node) continue

            let d = trig.vec_distance(node_b.position, node.position)

            if (d === 0) {
                node.position.x += math.random(2) - 1
                node.position.y += math.random(2) - 1
                d = trig.vec_distance(node_b.position, node.position)
            }

            const angle = trig.vec_angle(node_b.position, node.position)
            const force = trig.force_to_vec(0.25 / d, angle)
            trig.vec_add(node.velocity, force)
        }

        /*
            towards the edges
        */
        for (const edge of node.edges) {
            const node_b = edge[0] === node ? edge[1] : edge[0]

            const force = trig.force(node.position, node_b.position)
            force.distance *= 0.02

            trig.vec_add(node.velocity, force)
        }

        /*
            towards the center
        */
        {
            const force = trig.force(node.position, trig.ZERO)
            force.distance *= 0.015

            trig.vec_add(node.velocity, force)
        }

        const new_position = trig.vec_sum(node.position, node.velocity)
        new_positions.set(node, new_position)
    }

    for (const [node, new_position] of new_positions) {
        const d = trig.vec_distance(node.position, new_position)
        if (d > 0.013) {
            node.position = new_position
        }
    }
}
