import { math, trig } from '.'

export class Graph {
    nodes: Node[] = []
    edges: Edge[] = []
    x_order: Node[] = []
}

export class Node {
    position: trig.Vec
    velocity: trig.Vec = trig.zero()
    edges: Edge[] = []
    locked = false

    constructor(position: trig.Vec) {
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

export function randomizeNodePositions(nodes: readonly Node[]): void {
    for (const node of nodes) {
        node.position = trig.vec(math.randomFrom(-50, 50), math.randomFrom(-50, 50))
    }
}

export function resetOrder(graph: Graph): void {
    graph.x_order = graph.nodes.slice().sort((a, b) => a.position.x - b.position.x)
    // graph.y_order = graph.nodes.slice().sort((a, b) => a.position.y - b.position.y)

    // for (let i = 0; i < graph.x_order.length; i++) {
    //     graph.x_order[i]!.i_x = i
    // }

    // for (let i = 0; i < graph.y_order.length; i++) {
    //     graph.y_order[i]!.i_y = i
    // }
}

export const INERTIA_STRENGTH = 0.8
export const REPULSION_STRENGTH = 0.25
export const ATTRACTION_STRENGTH = 0.02
export const ORIGIN_STRENGTH = 0.015
export const MIN_VELOCITY = 0.015

export function updateNodePositions(graph: Graph): void {
    const { nodes, edges } = graph

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]!

        /*
            inertia
        */
        trig.vec_multiply(node.velocity, INERTIA_STRENGTH)

        /*
            away from other nodes
        */
        for (let j = i + 1; j < nodes.length; j++) {
            const node_b = nodes[j]!

            let dx = node.position.x - node_b.position.x
            let dy = node.position.y - node_b.position.y
            const mod = REPULSION_STRENGTH / (dx * dx + dy * dy)
            dx *= mod
            dy *= mod

            trig.vec_add(node.velocity, dx, dy)
            trig.vec_add(node_b.velocity, -dx, -dy)
        }

        /*
            towards the center
        */
        {
            const dx = node.position.x * -ORIGIN_STRENGTH
            const dy = node.position.y * -ORIGIN_STRENGTH

            trig.vec_add(node.velocity, dx, dy)
        }
    }

    /*
        towards the edges
    */
    for (const [node_a, node_b] of edges) {
        const dx = (node_b.position.x - node_a.position.x) * ATTRACTION_STRENGTH
        const dy = (node_b.position.y - node_a.position.y) * ATTRACTION_STRENGTH

        trig.vec_add(node_a.velocity, dx, dy)
        trig.vec_add(node_b.velocity, -dx, -dy)
    }

    /*
        commit
    */
    for (const node of nodes) {
        if (node.locked) continue

        const { x, y } = node.velocity,
            d = Math.sqrt(x * x + y * y)

        if (d > MIN_VELOCITY) {
            trig.vec_add(node.position, node.velocity)
        }
    }
}

export function updateNodePositions3(graph: Graph): void {
    const { x_order, edges } = graph

    for (let i = 0; i < x_order.length; i++) {
        const node = x_order[i]!

        trig.vec_multiply(node.velocity, INERTIA_STRENGTH)

        const origin_force = trig.force(node.position, trig.ZERO)
        origin_force.distance *= ORIGIN_STRENGTH

        trig.vec_add(node.velocity, origin_force)

        for (let j = i - 1; j >= 0; j--) {
            const node_x = x_order[j]!

            if (node.position.x - node_x.position.x > 20) break

            const d = trig.vec_distance(node_x.position, node.position)

            const angle = trig.vec_angle(node_x.position, node.position)
            const force = trig.force_to_vec(REPULSION_STRENGTH / d, angle)

            trig.vec_add(node.velocity, force)
        }

        for (let j = i + 1; j < x_order.length; j++) {
            const node_x = x_order[j]!

            if (node_x.position.x - node.position.x > 20) break

            const d = trig.vec_distance(node_x.position, node.position)

            const angle = trig.vec_angle(node_x.position, node.position)
            const force = trig.force_to_vec(REPULSION_STRENGTH / d, angle)

            trig.vec_add(node.velocity, force)
        }
    }

    /*
        towards the edges
    */
    for (const [node_a, node_b] of edges) {
        let distance = trig.vec_distance(node_a.position, node_b.position)
        distance *= ATTRACTION_STRENGTH

        const angle = trig.vec_angle(node_a.position, node_b.position)
        const force = trig.force_to_vec(distance, angle)

        trig.vec_add(node_a.velocity, force)
        trig.vec_add(node_b.velocity, -force.x, -force.y)
    }

    commit: for (let i = 0; i < x_order.length; i++) {
        const node = x_order[i]!

        // if (node.locked) continue

        const d = trig.vec_distance(node.velocity, trig.ZERO)
        if (d > MIN_VELOCITY) {
            trig.vec_add(node.position, node.velocity)
        }

        for (let j = i - 1; j >= 0; j--) {
            const node_x = x_order[j]!

            if (node_x.position.x > node.position.x) {
                const right = x_order[j + 1]!
                x_order[j + 1] = node_x
                x_order[j] = right
            } else {
                continue commit
            }
        }
    }

    // /*
    //     check if the order is correct
    // */
    // for (let i = 1; i < x_order.length; i++) {
    //     if (x_order[i - 1]!.position.x > x_order[i]!.position.x) {
    //         console.log('order is wrong')
    //         debugger
    //         break
    //     }
    // }
}
