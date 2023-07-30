import { math, trig } from '@nothing-but/utils'

export interface GraphOptions {
    inertia_strength: number
    repulsion_strength: number
    repulsion_distance: number
    attraction_strength: number
    origin_strength: number
    min_move: number
    grid_size: number
}

export const default_options: GraphOptions = {
    inertia_strength: 0.7,
    repulsion_strength: 0.4,
    repulsion_distance: 20,
    attraction_strength: 0.02,
    origin_strength: 0.012,
    min_move: 0.001,
    grid_size: 200,
}

export function makeGraphOptions(options?: Partial<GraphOptions>): GraphOptions {
    return { ...default_options, ...options }
}

/**
 * Spatial grid for looking up surrounding nodes by their position.
 *
 * The first index is the matrix cell calculated from the x and y position of the node.
 *
 * The second index is the index of the node in the call array, sorted by x position.
 */
export interface GraphGrid {
    cells: Node[][]
    radius: number
    cell_size: number
    axis_cells: number
    n_cells: number
}

export function makeGraphGrid(options: GraphOptions): GraphGrid {
    const grid_radius = options.grid_size / 2,
        axis_cells = Math.ceil(grid_radius / options.repulsion_distance) * 2,
        n_cells = axis_cells * axis_cells

    return {
        cells: Array.from({ length: n_cells }, () => []),
        axis_cells,
        n_cells,
        cell_size: options.repulsion_distance,
        radius: grid_radius,
    }
}

export function toGridIdx(grid: GraphGrid, pos: trig.Vector): number {
    const { radius, axis_cells, cell_size } = grid,
        xi = Math.floor((pos.x + radius) / cell_size),
        yi = Math.floor((pos.y + radius) / cell_size)
    return xi + yi * axis_cells
}
// const get_node_x = (node: Node): number => node.position.x

export function addNodeToGrid(
    grid: GraphGrid,
    node: Node,
    idx: number = toGridIdx(grid, node.position),
): void {
    const order = grid.cells[idx]!,
        { x } = node.position

    let i = 0
    while (i < order.length && order[i]!.position.x < x) i++

    order.splice(i, 0, node)
}

export function addNodesToGrid(grid: GraphGrid, nodes: readonly Node[]): void {
    for (const node of nodes) {
        addNodeToGrid(grid, node)
    }
}

export function resetGraphGrid(grid: GraphGrid, nodes: readonly []): void {
    for (const order of grid.cells) {
        order.length = 0
    }

    addNodesToGrid(grid, nodes)
}

export interface Graph {
    nodes: Node[]
    edges: Edge[]
    grid: GraphGrid
    options: GraphOptions
}

export function makeGraph(options: GraphOptions, nodes: Node[] = [], edges: Edge[] = []): Graph {
    const grid = makeGraphGrid(options)
    addNodesToGrid(grid, nodes)

    return { nodes, edges, grid, options }
}

export class Node {
    /**
     * User data key
     *
     * @default undefined
     *
     * Use it to identify the node in the graph, and match it with additional data.
     *
     * Otherwise, you can use object references to match nodes.
     */
    key: string | number | undefined
    position: trig.Vector = trig.zero()
    velocity: trig.Vector = trig.zero()
    edges: Edge[] = []
    locked = false
    moved = false
}

export function node(key?: string | number | undefined): Node {
    const node = new Node()
    node.key = key
    return node
}

export type Edge = [Node, Node]

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

export function randomizeNodePositions(nodes: readonly Node[], options: GraphOptions): void {
    const { grid_size } = options
    const grid_radius = grid_size / 2

    for (const node of nodes) {
        node.position = trig.vector(
            math.random_from(-grid_radius, grid_radius),
            math.random_from(-grid_radius, grid_radius),
        )
    }
}

export function changeNodePosition(grid: GraphGrid, node: Node, x: number, y: number): void {
    const prev_idx = toGridIdx(grid, node.position)
    const prev_x = node.position.x

    node.position.x = math.clamp(x, -grid.radius, grid.radius - 1)
    node.position.y = math.clamp(y, -grid.radius, grid.radius - 1)
    node.moved = true

    const idx = toGridIdx(grid, node.position)
    const order = grid.cells[prev_idx]!
    const order_idx = order.indexOf(node)

    if (idx !== prev_idx) {
        order.splice(order_idx, 1)

        addNodeToGrid(grid, node, idx)
    } else {
        if (x - prev_x < 0) {
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

export function pushNodesAway(
    a: Node,
    b: Node,
    dx: number,
    dy: number,
    options: GraphOptions,
): void {
    const d = Math.sqrt(dx * dx + dy * dy)

    if (d >= options.repulsion_distance) return

    const force = options.repulsion_strength * (1 - d / options.repulsion_distance),
        mx = (dx / d) * force,
        my = (dy / d) * force

    a.velocity.x += mx
    a.velocity.y += my
    b.velocity.x -= mx
    b.velocity.y -= my
}

export function simulateGraph(graph: Graph): void {
    const { nodes, edges, grid, options } = graph

    for (const node of nodes) {
        const { velocity, position } = node,
            { x, y } = position

        /*
            towards the origin
        */
        velocity.x -= x * options.origin_strength
        velocity.y -= y * options.origin_strength

        /*
            away from other nodes
            look only at the nodes right to the current node
            and apply the force to both nodes
        */
        const idx = toGridIdx(grid, position),
            dy_min = idx >= grid.axis_cells ? -1 : 0,
            dy_max = idx < grid.n_cells - grid.axis_cells ? 1 : 0,
            at_right_edge = idx % grid.axis_cells === grid.axis_cells - 1

        for (let dy_idx = dy_min; dy_idx <= dy_max; dy_idx++) {
            const _idx = idx + dy_idx * grid.axis_cells

            /*
                from the right cell edge to the node
            */
            let order = grid.cells[_idx]!

            for (let i = order.length - 1; i >= 0; i--) {
                const node_b = order[i]!,
                    dx = x - node_b.position.x

                if (dx > 0) break

                const dy = y - node_b.position.y

                if (dx === 0 && dy >= 0) continue

                pushNodesAway(node, node_b, dx, dy, options)
            }

            /*
                from the left edge of neighboring right cell to the end of repulsion distance
            */
            if (at_right_edge) continue

            order = grid.cells[_idx + 1]!

            for (const node_b of order) {
                const dx = x - node_b.position.x

                if (dx <= -options.repulsion_distance) break

                const dy = y - node_b.position.y

                pushNodesAway(node, node_b, dx, dy, options)
            }
        }
    }

    /*
        towards the edges
        the more edges a node has, the more velocity it accumulates
        so the velocity is divided by the number of edges
    */
    for (const [node_a, node_b] of edges) {
        const dx = (node_b.position.x - node_a.position.x) * options.attraction_strength
        const dy = (node_b.position.y - node_a.position.y) * options.attraction_strength

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
            commit and sort
        */
        if (!locked) {
            if (velocity.x * velocity.x + velocity.y * velocity.y > options.min_move) {
                changeNodePosition(grid, node, position.x + velocity.x, position.y + velocity.y)
            }
        }

        /*
            inertia
        */
        velocity.x *= options.inertia_strength
        velocity.y *= options.inertia_strength
    }
}
