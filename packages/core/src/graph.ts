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

/**
 * Corrects the order of a single node in the graph.
 */
export function correctNodeOrder(graph: Graph, node: Node): void {
    const { x_order } = graph

    const index = x_order.indexOf(node)

    if (index === -1) return

    let i = index - 1
    for (; i >= 0 && x_order[i]!.position.x > node.position.x; i--) {
        ;[x_order[i + 1], x_order[i]] = [x_order[i]!, x_order[i + 1]!]
    }

    if (i !== index - 1) return

    i = index + 1
    for (; i < x_order.length && x_order[i]!.position.x < node.position.x; i++) {
        ;[x_order[i - 1], x_order[i]] = [x_order[i]!, x_order[i - 1]!]
    }
}

export function checkOrder(graph: Graph): boolean {
    const { x_order } = graph

    for (let i = 0; i < x_order.length - 1; i++) {
        if (x_order[i]!.position.x > x_order[i + 1]!.position.x) {
            return false
        }
    }

    return true
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

        // trig.vec_add(node.velocity, math.randomFrom(-0.02, 0.02), math.randomFrom(-0.02, 0.02))

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

export function updateNodePositions2(graph: Graph): void {
    const { nodes, edges } = graph

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]!

        // trig.vec_add(node.velocity, math.randomFrom(-0.02, 0.02), math.randomFrom(-0.02, 0.02))

        /*
            away from other nodes
        */
        for (let j = i + 1; j < nodes.length; j++) {
            const node_b = nodes[j]!

            const dx = node.position.x - node_b.position.x,
                dy = node.position.y - node_b.position.y,
                d = Math.sqrt(dx * dx + dy * dy)

            if (d >= 20) continue

            const force = REPULSION_STRENGTH * (1 - d / 20),
                mx = (dx / d) * force,
                my = (dy / d) * force

            trig.vec_add(node.velocity, mx, my)
            trig.vec_add(node_b.velocity, -mx, -my)
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
        /*
            inertia
        */
        trig.vec_multiply(node.velocity, INERTIA_STRENGTH)

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

        /*
            towards the center
        */
        {
            const dx = node.position.x * -ORIGIN_STRENGTH
            const dy = node.position.y * -ORIGIN_STRENGTH

            trig.vec_add(node.velocity, dx, dy)
        }

        for (let j = i + 1; j < x_order.length; j++) {
            const node_b = x_order[j]!

            const dx = node.position.x - node_b.position.x

            if (dx <= -20) break

            const dy = node.position.y - node_b.position.y,
                d = Math.sqrt(dx * dx + dy * dy)

            if (d >= 20) continue

            const force = REPULSION_STRENGTH * (1 - d / 20),
                mx = (dx / d) * force,
                my = (dy / d) * force

            trig.vec_add(node.velocity, mx, my)
            trig.vec_add(node_b.velocity, -mx, -my)
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

    for (let i = 0; i < x_order.length; i++) {
        const node = x_order[i]!

        /*
            inertia
        */
        trig.vec_multiply(node.velocity, INERTIA_STRENGTH)

        /*
            commit
        */
        if (!node.locked) {
            const { x, y } = node.velocity,
                d = Math.sqrt(x * x + y * y)
            if (d > MIN_VELOCITY) {
                trig.vec_add(node.position, node.velocity)
            }
        }

        /*
            sort
        */
        for (let j = i - 1; j >= 0 && x_order[j]!.position.x > node.position.x; j--) {
            ;[x_order[j + 1], x_order[j]] = [x_order[j]!, x_order[j + 1]!]
        }
    }

    /*
        check order
    */
    // const is_ordered = checkOrder(graph)

    // if (!is_ordered) {
    //     throw new Error('node order is not correct')
    // }
}
