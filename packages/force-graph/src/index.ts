import { math, trig } from '@nothing-but/utils'

/**
 * Spatial grid looking up surrounding nodes by their position.
 *
 * The first index is the matrix cell calculated from the x and y position of the node.
 *
 * The second index is the index of the node in the call array, sorted by x position.
 */
export type GraphGrid = Node[][]

export class Graph {
    nodes: Node[] = []
    edges: Edge[] = []
    grid: GraphGrid = []
}

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

export const INERTIA_STRENGTH = 0.75,
    REPULSION_STRENGTH = 0.35,
    REPULSION_DISTANCE = 18,
    ATTRACTION_STRENGTH = 0.02,
    ORIGIN_STRENGTH = 0.012,
    MIN_VELOCITY = 0.015,
    MIN_MOVE = 0.001,
    GRID_RADIUS = 100

const radius_cells = Math.ceil(GRID_RADIUS / REPULSION_DISTANCE),
    axis_cells = radius_cells * 2,
    n_cells = axis_cells * axis_cells

const to_grid_idx = (pos: trig.Vector): number => {
    const xi = Math.floor(pos.x / REPULSION_DISTANCE) + radius_cells
    const yi = Math.floor(pos.y / REPULSION_DISTANCE) + radius_cells
    return xi + yi * axis_cells
}
// const get_node_x = (node: Node): number => node.position.x

export function getEdge(a: Node, b: Node): Edge | undefined {
    for (const edge of a.edges) {
        if (edge[0] === b || edge[1] === b) return edge
    }
}

/**
 * Connects two nodes and returns the new edge.
 *
 * **It doesn't check if the nodes are already connected.**
 * Use {@link getEdge} to check before connecting.
 */
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

export function randomizeNodePositions(nodes: readonly Node[]): void {
    for (const node of nodes) {
        node.position = trig.vector(math.random_from(-50, 50), math.random_from(-50, 50))
    }
}

export function resetOrder(graph: Graph): void {
    graph.grid = Array.from({ length: n_cells }, () => [])

    for (const node of graph.nodes) {
        const idx = to_grid_idx(node.position)
        addNodeToGrid(graph.grid, node, idx)
    }
}

export function addNodeToGrid(grid: GraphGrid, node: Node, idx: number): void {
    const order = grid[idx]!,
        { x } = node.position

    let i = 0
    while (i < order.length && order[i]!.position.x < x) i++

    order.splice(i, 0, node)
}

/**
 * Corrects the order of a single node in the graph.
 */
export function correctNodeOrder(graph: Graph, node: Node, prev_position: trig.Vector): void {
    const { grid: x_grid } = graph,
        prev_grid_idx = to_grid_idx(prev_position),
        order = x_grid[prev_grid_idx]!

    order.splice(order.indexOf(node), 1)

    const grid_idx = to_grid_idx(node.position)

    addNodeToGrid(x_grid, node, grid_idx)
}

export function pushNodesAway(a: Node, b: Node, dx: number, dy: number): void {
    const d = Math.sqrt(dx * dx + dy * dy)

    if (d >= REPULSION_DISTANCE) return

    const force = REPULSION_STRENGTH * (1 - d / REPULSION_DISTANCE),
        mx = (dx / d) * force,
        my = (dy / d) * force

    a.velocity.x += mx
    a.velocity.y += my
    b.velocity.x -= mx
    b.velocity.y -= my
}

export function updatePositions(graph: Graph): void {
    const { nodes, edges, grid } = graph

    for (const node of nodes) {
        const { velocity, position } = node,
            { x, y } = position

        /*
            towards the origin
        */
        velocity.x -= x * ORIGIN_STRENGTH
        velocity.y -= y * ORIGIN_STRENGTH

        /*
            away from other nodes
            look only at the nodes right to the current node
            and apply the force to both nodes
        */
        const idx = to_grid_idx(position),
            dy_min = idx >= axis_cells ? -1 : 0,
            dy_max = idx < n_cells - axis_cells ? 1 : 0,
            at_right_edge = idx % axis_cells === axis_cells - 1

        for (let dy_idx = dy_min; dy_idx <= dy_max; dy_idx++) {
            const _idx = idx + dy_idx * axis_cells

            /*
                from the right cell edge to the node
            */
            let order = grid[_idx]!

            for (let i = order.length - 1; i >= 0; i--) {
                const node_b = order[i]!,
                    dx = x - node_b.position.x

                if (dx > 0) break

                const dy = y - node_b.position.y

                if (dx === 0 && dy >= 0) continue

                pushNodesAway(node, node_b, dx, dy)
            }

            /*
                from the left edge of neighboring right cell to the end of repulsion distance
            */
            if (at_right_edge) continue

            order = grid[_idx + 1]!

            for (const node_b of order) {
                const dx = x - node_b.position.x

                if (dx <= -REPULSION_DISTANCE) break

                const dy = y - node_b.position.y

                pushNodesAway(node, node_b, dx, dy)
            }
        }
    }

    /*
        towards the edges
        the more edges a node has, the more velocity it accumulates
        so the velocity is divided by the number of edges
    */
    for (const [node_a, node_b] of edges) {
        const dx = (node_b.position.x - node_a.position.x) * ATTRACTION_STRENGTH
        const dy = (node_b.position.y - node_a.position.y) * ATTRACTION_STRENGTH

        const a_mod = (node_a.edges.length + 2) / 3
        const b_mod = (node_b.edges.length + 2) / 3

        node_a.velocity.x += dx / a_mod
        node_a.velocity.y += dy / a_mod
        node_b.velocity.x -= dx / b_mod
        node_b.velocity.y -= dy / b_mod
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
        if (locked || velocity.x * velocity.x + velocity.y * velocity.y <= MIN_MOVE) continue

        const prev_idx = to_grid_idx(position)

        position.x = math.clamp(position.x + velocity.x, -GRID_RADIUS, GRID_RADIUS)
        position.y = math.clamp(position.y + velocity.y, -GRID_RADIUS, GRID_RADIUS)

        const idx = to_grid_idx(position)
        const order = grid[prev_idx]!
        const order_idx = order.indexOf(node)

        if (idx !== prev_idx) {
            order.splice(order_idx, 1)

            addNodeToGrid(grid, node, idx)
        } else {
            if (velocity.x < 0) {
                for (let i = order_idx - 1; i >= 0 && order[i]!.position.x > position.x; i--) {
                    ;[order[i + 1], order[i]] = [order[i]!, order[i + 1]!]
                }
            } else {
                for (
                    let i = order_idx + 1;
                    i < order.length && order[i]!.position.x < position.x;
                    i++
                ) {
                    ;[order[i - 1], order[i]] = [order[i]!, order[i - 1]!]
                }
            }
        }
    }
}
