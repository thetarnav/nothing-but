import { math, trig, array } from '.'

export type GraphGrid = Record<number, Record<number, Node[]>>

export class Graph {
    nodes: Node[] = []
    edges: Edge[] = []
    x_order: Node[] = []
    x_grid: GraphGrid = {}
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

export const getNodeX = (node: Node): number => node.position.x

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

    graph.x_grid = {}

    for (const node of graph.nodes) {
        const idx_x = toGridIdx(node.position.x),
            idx_y = toGridIdx(node.position.y)
        addNodeToGrid(graph.x_grid, node, idx_x, idx_y)
    }
}

export function toGridIdx(x: number): number {
    return Math.floor(x / REPULSION_DISTANCE)
}

export function addNodeToGrid(grid: GraphGrid, node: Node, idx_x: number, idx_y: number): void {
    const x_map = grid[idx_x]

    if (x_map === undefined) {
        grid[idx_x] = { [idx_y]: [node] }
        return
    }

    const arr = x_map[idx_y]

    if (arr === undefined) {
        x_map[idx_y] = [node]
        return
    }

    const { x } = node.position

    let i = 0
    while (i < arr.length && arr[i]!.position.x < x) i++

    arr.splice(i, 0, node)
}

/**
 * Corrects the order of a single node in the graph.
 */
export function correctNodeOrder(graph: Graph, node: Node, prev_position: trig.Vec): void {
    {
        const { x_grid } = graph,
            prev_grid_x_idx = toGridIdx(prev_position.x),
            prev_grid_y_idx = toGridIdx(prev_position.y),
            arr = x_grid[prev_grid_x_idx]![prev_grid_y_idx]!

        arr.splice(arr.indexOf(node), 1)

        const grid_x_idx = toGridIdx(node.position.x),
            grid_y_idx = toGridIdx(node.position.y)

        addNodeToGrid(x_grid, node, grid_x_idx, grid_y_idx)
    }

    const { x_order } = graph,
        { x } = node.position,
        index = x_order.indexOf(node)

    if (index === -1) return

    let i = index - 1
    for (; i >= 0 && x_order[i]!.position.x > x; i--) {
        ;[x_order[i + 1], x_order[i]] = [x_order[i]!, x_order[i + 1]!]
    }

    if (i !== index - 1) return

    i = index + 1
    for (; i < x_order.length && x_order[i]!.position.x < x; i++) {
        ;[x_order[i - 1], x_order[i]] = [x_order[i]!, x_order[i - 1]!]
    }
}

export function checkOrder(arr: readonly Node[]): boolean {
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i]!.position.x > arr[i + 1]!.position.x) {
            return false
        }
    }

    return true
}

export const INERTIA_STRENGTH = 0.8,
    REPULSION_STRENGTH = 0.35,
    REPULSION_DISTANCE = 18,
    ATTRACTION_STRENGTH = 0.02,
    ORIGIN_STRENGTH = 0.015,
    MIN_VELOCITY = 0.015

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

        position.x += velocity.x
        position.y += velocity.y
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
            position.x += velocity.x
            position.y += velocity.y
        }

        /*
            sort
        */
        for (let j = i - 1; j >= 0 && x_order[j]!.position.x > position.x; j--) {
            ;[x_order[j + 1], x_order[j]] = [x_order[j]!, x_order[j + 1]!]
        }
    }
}

export function updatePositionsGrid(graph: Graph): void {
    const { nodes, edges, x_grid } = graph

    for (const node of nodes) {
        const {
            velocity,
            position: [x, y],
        } = node

        /*
            towards the center
        */
        velocity.x += x * -ORIGIN_STRENGTH
        velocity.y += y * -ORIGIN_STRENGTH

        /*
            away from other nodes
        */

        const x_idx = toGridIdx(x),
            y_idx = toGridIdx(y)

        let y_grid = x_grid[x_idx]

        for (let dy_idx = -1; dy_idx <= 1; dy_idx++) {
            //
            const arr = y_grid![y_idx + dy_idx]
            if (!arr) continue

            for (let i = arr.length - 1; i >= 0; i--) {
                const node_b = arr[i]!,
                    dx = x - node_b.position.x

                if (dx > 0) break

                const dy = y - node_b.position.y

                if (dx === 0 && dy >= 0) continue

                const d = Math.sqrt(dx * dx + dy * dy)

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

        y_grid = x_grid[x_idx + 1]
        if (!y_grid) continue

        for (let dy_idx = -1; dy_idx <= 1; dy_idx++) {
            //
            const arr = y_grid![y_idx + dy_idx]
            if (!arr) continue

            for (const node_b of arr) {
                const dx = x - node_b.position.x

                if (dx <= -REPULSION_DISTANCE) break

                const dy = y - node_b.position.y,
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

    for (const node of nodes) {
        const { velocity, position, locked } = node

        /*
            inertia
        */
        velocity.x *= INERTIA_STRENGTH
        velocity.y *= INERTIA_STRENGTH

        /*
            commit and sort
        */
        if (locked) continue

        const prev_x_idx = toGridIdx(position.x),
            prev_y_idx = toGridIdx(position.y),
            x = position.x + velocity.x,
            y = position.y + velocity.y,
            x_idx = toGridIdx(x),
            y_idx = toGridIdx(y),
            order = x_grid[prev_x_idx]![prev_y_idx]!,
            order_idx = order.indexOf(node)!

        if (x_idx !== prev_x_idx || y_idx !== prev_y_idx) {
            order.splice(order_idx, 1)

            position.x = x
            position.y = y

            addNodeToGrid(x_grid, node, x_idx, y_idx)
        } else {
            position.x = x
            position.y = y

            if (velocity.x < 0) {
                for (let i = order_idx - 1; i >= 0 && order[i]!.position.x > x; i--) {
                    ;[order[i + 1], order[i]] = [order[i]!, order[i + 1]!]
                }
            } else {
                for (let i = order_idx + 1; i < order.length && order[i]!.position.x < x; i++) {
                    ;[order[i - 1], order[i]] = [order[i]!, order[i - 1]!]
                }
            }
        }
    }
}
