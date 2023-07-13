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
export const REPULSION_DISTANCE = 20
export const ATTRACTION_STRENGTH = 0.02
export const ORIGIN_STRENGTH = 0.015
export const MIN_VELOCITY = 0.015

export function updatePositionsAccurate(graph: Graph): void {
    const { nodes, edges } = graph

    for (let i = 0; i < nodes.length; i++) {
        const { position, velocity } = nodes[i]!

        /*
            away from other nodes
        */
        for (let j = i + 1; j < nodes.length; j++) {
            const node_b = nodes[j]!

            let dx = position.x - node_b.position.x
            let dy = position.y - node_b.position.y
            const mod = REPULSION_STRENGTH / (dx * dx + dy * dy)
            dx *= mod
            dy *= mod

            velocity.x += dx
            velocity.y += dy
            node_b.velocity.x -= dx
            node_b.velocity.y -= dy
        }

        /*
            towards the center
        */
        velocity.x += position.x * -ORIGIN_STRENGTH
        velocity.y += position.y * -ORIGIN_STRENGTH
    }

    /*
        towards the edges
    */
    for (const [node_a, node_b] of edges) {
        const dx = (node_b.position.x - node_a.position.x) * ATTRACTION_STRENGTH
        const dy = (node_b.position.y - node_a.position.y) * ATTRACTION_STRENGTH

        node_a.velocity.x += dx
        node_a.velocity.y += dy
        node_b.velocity.x -= dx
        node_b.velocity.y -= dy
    }

    /*
        commit
    */
    for (const { velocity, position, locked } of nodes) {
        /*
            inertia
        */
        velocity.x *= INERTIA_STRENGTH
        velocity.y *= INERTIA_STRENGTH

        if (locked) continue

        const { x, y } = velocity,
            d = Math.sqrt(x * x + y * y)

        if (d > MIN_VELOCITY) {
            position.x += x
            position.y += y
        }
    }
}

export function updatePositionsOptimized(graph: Graph): void {
    const { x_order, edges } = graph

    for (let i = 0; i < x_order.length; i++) {
        const { velocity, position } = x_order[i]!

        /*
            towards the center
        */
        velocity.x += position.x * -ORIGIN_STRENGTH
        velocity.y += position.y * -ORIGIN_STRENGTH

        /*
            away from other nodes
        */
        for (let j = i + 1; j < x_order.length; j++) {
            const node_b = x_order[j]!

            const dx = position.x - node_b.position.x

            if (dx <= -REPULSION_DISTANCE) break

            const dy = position.y - node_b.position.y,
                d = Math.sqrt(dx * dx + dy * dy)

            if (d >= REPULSION_DISTANCE) continue

            const force = REPULSION_STRENGTH * (1 - d / REPULSION_DISTANCE),
                mx = (dx / d) * force,
                my = (dy / d) * force

            velocity.x += mx
            velocity.y += my
            node_b.velocity.x -= mx
            node_b.velocity.y -= my
        }
    }

    /*
        towards the edges
    */
    for (const [node_a, node_b] of edges) {
        const dx = (node_b.position.x - node_a.position.x) * ATTRACTION_STRENGTH
        const dy = (node_b.position.y - node_a.position.y) * ATTRACTION_STRENGTH

        node_a.velocity.x += dx
        node_a.velocity.y += dy
        node_b.velocity.x -= dx
        node_b.velocity.y -= dy
    }

    for (let i = 0; i < x_order.length; i++) {
        const { velocity, position, locked } = x_order[i]!

        /*
            inertia
        */
        velocity.x *= INERTIA_STRENGTH
        velocity.y *= INERTIA_STRENGTH

        /*
            commit
        */
        if (!locked) {
            const { x, y } = velocity,
                d = Math.sqrt(x * x + y * y)

            if (d > MIN_VELOCITY) {
                position.x += x
                position.y += y
            }
        }

        /*
            sort
        */
        for (let j = i - 1; j >= 0 && x_order[j]!.position.x > position.x; j--) {
            ;[x_order[j + 1], x_order[j]] = [x_order[j]!, x_order[j + 1]!]
        }
    }
}
