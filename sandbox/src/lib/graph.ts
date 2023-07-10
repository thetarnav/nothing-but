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
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]!

        if (node.locked) {
            node.velocity = trig.zero()
            continue
        }

        /*
            inertia
        */
        trig.vec_multiply(node.velocity, 0.8)

        // trig.vec_add(
        //     node.velocity,
        //     trig.vec(math.randomFrom(-0.5, 0.5), math.randomFrom(-0.5, 0.5)),
        // )

        /*
            away from other nodes
        */
        for (let j = i + 1; j < nodes.length; j++) {
            const node_b = nodes[j]!

            let d = trig.vec_distance(node_b.position, node.position)

            if (d === 0) {
                node.position.x += math.random(2) - 1
                node.position.y += math.random(2) - 1
                d = trig.vec_distance(node_b.position, node.position)
            }

            const angle = trig.vec_angle(node_b.position, node.position)
            const force = trig.force_to_vec(0.25 / d, angle)

            trig.vec_add(node.velocity, force)
            trig.vec_add(node_b.velocity, -force.x, -force.y)
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
    }

    for (const node of nodes) {
        const d = trig.vec_distance(node.velocity, trig.ZERO)
        if (d > 0.015) {
            trig.vec_add(node.position, node.velocity)
        }
    }
}
