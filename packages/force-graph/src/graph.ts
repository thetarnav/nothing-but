import {Num, T, Trig} from '@nothing-but/utils'

export interface Options {
    /**
     * Percent of velocity to retain each frame.
     *
     * ```ts
     * velocity *= inertia_strength
     * ```
     */
    readonly inertia_strength: number
    /**
     * Strength of nodes pushing each other away.
     *
     * ```ts
     * force = repel_strength * (1 - distance / repel_distance)
     * velocity += delta / distance * force
     * ```
     */
    readonly repel_strength: number
    /**
     * Distance at which nodes start to repel each other.
     *
     * @see {@link repel_strength}
     */
    readonly repel_distance: number
    /**
     * Strength of the connection between nodes.
     *
     * ```ts
     * velocity += delta * link_strength / n_edges
     * ```
     */
    readonly link_strength: number
    /**
     * Pull towards the origin.
     *
     * ```ts
     * velocity += origin_position - node_position * origin_strength
     * ```
     */
    readonly origin_strength: number
    /**
     * Minimum velocity to move a node.
     */
    readonly min_move: number
    /**
     * Size of the grid used for spatial lookup.
     * Node positions will be clamped to this size.
     */
    readonly grid_size: number
}

export const default_options = {
    inertia_strength: 0.7,
    repel_strength: 0.4,
    repel_distance: 20,
    link_strength: 0.02,
    origin_strength: 0.012,
    min_move: 0.001,
    grid_size: 200,
} as const satisfies Options

export function graphOptions(options?: Partial<Options>): Options {
    return {...default_options, ...options}
}

/**
 * Spatial grid for looking up surrounding nodes by their position.
 *
 * The first index is the matrix cell calculated from the x and y position of the node.
 *
 * The second index is the index of the node in the call array, sorted by x position.
 */
export interface Grid {
    cells: Node[][]
    size: number
    cell_size: number
    axis_cells: number
}

export function graphGrid(options: Options): Grid {
    const size = options.grid_size,
        axis_cells = Math.ceil(size / 2 / options.repel_distance) * 2,
        n_cells = axis_cells * axis_cells

    return {
        cells: Array.from({length: n_cells}, () => []),
        axis_cells,
        cell_size: options.repel_distance,
        size,
    }
}

/**
 * **Note:** This function does not clamp the position to the grid.
 */
export function toGridIdx(grid: Grid, pos: T.Position): number {
    const {axis_cells, cell_size} = grid,
        xi = Math.floor(pos.x / cell_size),
        yi = Math.floor(pos.y / cell_size)
    return xi + yi * axis_cells
}

export function addNodeToGrid(
    grid: Grid,
    node: Node,
    idx: number = toGridIdx(grid, node.position),
): void {
    const order = grid.cells[idx]!,
        {x} = node.position

    let i = 0
    while (i < order.length && order[i]!.position.x < x) i++

    order.splice(i, 0, node)
}

export function addNodesToGrid(grid: Grid, nodes: readonly Node[]): void {
    for (const node of nodes) {
        addNodeToGrid(grid, node)
    }
}

export function resetGraphGrid(grid: Grid, nodes: readonly []): void {
    for (const order of grid.cells) {
        order.length = 0
    }

    addNodesToGrid(grid, nodes)
}

export interface Graph {
    nodes: Node[]
    edges: Edge[]
    grid: Grid
    options: Options
}

export function makeGraph(options: Options, nodes: Node[] = [], edges: Edge[] = []): Graph {
    const grid = graphGrid(options)
    addNodesToGrid(grid, nodes)

    return {nodes, edges, grid, options}
}

export type Node = {
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
    /**
     * Label to display on the node when rendering. Set it to an empty string to hide the label.
     */
    label: string
    /**
     * Current position of the node.
     */
    position: T.Position
    /**
     * Current node velocity, will be added to the position each frame.
     */
    velocity: T.Position
    edges: Edge[]
    /**
     * Do not change the position of this node.
     */
    anchor: boolean
    /**
     * Has the node moved since the last frame?
     *
     * This value is not changed back to `false` automatically. Change it manually if you handled the movement.
     */
    moved: boolean
    mass: number
}

/**
 * get a zero initialized node
 * @example
 * ```ts
 * const node = zeroNode()
 * node.label = 'hello'
 * node.key = 1
 * ```
 */
export const zeroNode = (): Node => {
    return {
        key: undefined,
        label: '',
        position: {x: 0, y: 0},
        velocity: {x: 0, y: 0},
        edges: [],
        anchor: false,
        moved: false,
        mass: 1,
    }
}

export type Edge = {
    a: Node
    b: Node
    strength: number
}

export const getEdge = (a: Node, b: Node): Edge | undefined => {
    for (const edge of a.edges) {
        if (edge.a === b || edge.b === b) return edge
    }
}

/**
 * Connects two nodes and returns the new edge.
 *
 * **It doesn't check if the nodes are already connected.**
 * Use {@link getEdge} to check before connecting.
 */
export function connect(a: Node, b: Node, strength = 1): Edge {
    const edge: Edge = {a, b, strength}
    a.edges.push(edge)
    b.edges.push(edge)
    return edge
}

export function disconnect(a: Node, b: Node): void {
    for (let i = 0; i < a.edges.length; i++) {
        const edge = a.edges[i]!
        if (edge.a === b || edge.b === b) {
            a.edges.splice(i, 1)
            for (let j = 0; j < b.edges.length; j++) {
                if (edge === b.edges[j]) {
                    b.edges.splice(j, 1)
                    return
                }
            }
        }
    }
}

export function nodeMassFromEdges(edges_length: number): number {
    return Math.log2(edges_length + 2)
}

/**
 * Returns the closest node to the given position.
 *
 * The search is done linearly, so it scales O(n) with the number of nodes.
 *
 * It does a simple search, witout assuming anything about the gird.
 */
export function findClosestNodeLinear(
    nodes: readonly Node[],
    pos: T.Position,
    max_dist: number = Infinity,
): Node | undefined {
    let closest: Node | undefined
    let closest_dist = max_dist

    for (const node of nodes) {
        const dist = Trig.distance(node.position, pos)
        if (dist < closest_dist) {
            closest = node
            closest_dist = dist
        }
    }

    return closest
}

/**
 * Returns the closest node to the given position.
 *
 * The search is done using a grid, so it scales O(log n) with the number of nodes.
 *
 * The implementation assumes that the max_dist is smaller than the cell size.
 * So it will only return nodes very close to the position.
 *
 * Position outside of the graph will return `undefined`.
 */
export function findClosestNode(
    graph: Graph,
    pos: T.Position,
    max_dist: number = Infinity,
): Node | undefined {
    const {x, y} = pos,
        {grid} = graph

    if (x < 0 || x > grid.size || y < 0 || y > grid.size) return

    const pos_idx = toGridIdx(grid, pos),
        x_axis_idx = pos_idx % grid.axis_cells,
        y_axis_idx = Math.floor(pos_idx / grid.axis_cells)

    /*
        1 | -1, depending on which side of the cell the position is on
    */
    const idx_delta = Trig.map(
        pos,
        n => Math.floor(Num.remainder(n / grid.cell_size, 1) + 0.5) * 2 - 1,
    )

    /*
        clamp the index to the grid -> 1 | 0 | -1
    */
    idx_delta.x = Num.clamp(idx_delta.x, -x_axis_idx, grid.axis_cells - 1 - x_axis_idx)
    idx_delta.y = Num.clamp(idx_delta.y, -y_axis_idx, grid.axis_cells - 1 - y_axis_idx)

    let closest_dist = max_dist
    let closest: Node | undefined

    /*
        check the 4 cells around the position
        including the cell the position is in
    */
    for (let xi = 0; xi <= 1; xi++) {
        const dxi = idx_delta.x * xi

        for (let yi = 0; yi <= 1; yi++) {
            const idx = pos_idx + dxi + grid.axis_cells * (idx_delta.y * yi),
                order = grid.cells[idx]!

            if (dxi == -1) {
                /*
                    right to left
                */
                for (let i = order.length - 1; i >= 0; i--) {
                    const node = order[i]!
                    if (x - node.position.x > closest_dist) break

                    const dist = Trig.distance(pos, node.position)
                    if (dist < closest_dist) {
                        closest_dist = dist
                        closest = node
                    }
                }
            } else {
                /*
                    left to right
                */
                for (const node of order) {
                    if (x - node.position.x > closest_dist) continue
                    if (node.position.x - x > closest_dist) break

                    const dist = Trig.distance(pos, node.position)
                    if (dist < closest_dist) {
                        closest_dist = dist
                        closest = node
                    }
                }
            }
        }
    }

    return closest
}

export function randomizeNodePositions(nodes: readonly Node[], grid_size: number): void {
    const margin = grid_size / 4
    for (const node of nodes) {
        node.position.x = Num.random_from(margin, grid_size - margin)
        node.position.y = Num.random_from(margin, grid_size - margin)
        node.moved = true
    }
}

export function changeNodePosition(grid: Grid, node: Node, x: number, y: number): void {
    const prev_idx = toGridIdx(grid, node.position)
    const prev_x = node.position.x

    node.position.x = Num.clamp(x, 0, grid.size)
    node.position.y = Num.clamp(y, 0, grid.size)
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
    options: Options,
    alpha: number,
): void {
    const d = Math.sqrt(dx * dx + dy * dy)

    if (d >= options.repel_distance) return

    const force = options.repel_strength * (1 - d / options.repel_distance) * alpha,
        mx = (dx / d) * force,
        my = (dy / d) * force

    a.velocity.x += (mx / a.mass) * b.mass
    a.velocity.y += (my / a.mass) * b.mass
    b.velocity.x -= (mx / b.mass) * a.mass
    b.velocity.y -= (my / b.mass) * a.mass
}

/**
 * Simulates the graph for one frame.
 *
 * Updates the velocity, position and moved flag of each node.
 *
 * @param graph The graph to simulate {@link Graph}
 * @param alpha The simulation speed multiplier. Default is 1. Use this to slow down or speed up the simulation with time.
 */
export function simulate(graph: Graph, alpha: number = 1): void {
    const {nodes, edges, grid, options} = graph

    for (const node of nodes) {
        const {velocity, position} = node,
            {x, y} = position

        /*
            towards the origin
        */
        velocity.x += ((grid.size / 2 - x) * options.origin_strength * alpha) / node.mass
        velocity.y += ((grid.size / 2 - y) * options.origin_strength * alpha) / node.mass

        /*
            away from other nodes
            look only at the nodes right to the current node
            and apply the force to both nodes
        */
        const node_idx = toGridIdx(grid, position),
            dy_min = node_idx >= grid.axis_cells ? -1 : 0,
            dy_max = node_idx < grid.cells.length - grid.axis_cells ? 1 : 0,
            at_right_edge = node_idx % grid.axis_cells === grid.axis_cells - 1

        for (let dy_idx = dy_min; dy_idx <= dy_max; dy_idx++) {
            const idx = node_idx + dy_idx * grid.axis_cells

            /*
                from the right cell edge to the node
            */
            let order = grid.cells[idx]!

            for (let i = order.length - 1; i >= 0; i--) {
                const node_b = order[i]!,
                    dx = x - node_b.position.x

                if (dx > 0) break

                const dy = y - node_b.position.y

                if (dx === 0 && dy >= 0) continue

                pushNodesAway(node, node_b, dx, dy, options, alpha)
            }

            /*
                from the left edge of neighboring right cell to the end of repel distance
            */
            if (at_right_edge) continue

            order = grid.cells[idx + 1]!

            for (const node_b of order) {
                const dx = x - node_b.position.x

                if (dx <= -options.repel_distance) break

                const dy = y - node_b.position.y

                pushNodesAway(node, node_b, dx, dy, options, alpha)
            }
        }
    }

    /*
        towards the edges
        the more edges a node has, the more velocity it accumulates
        so the velocity is divided by the number of edges
    */
    for (const {a, b, strength} of edges) {
        const dx = (b.position.x - a.position.x) * options.link_strength * strength * alpha
        const dy = (b.position.y - a.position.y) * options.link_strength * strength * alpha

        a.velocity.x += dx / a.mass / a.mass
        a.velocity.y += dy / a.mass / a.mass
        b.velocity.x -= dx / b.mass / b.mass
        b.velocity.y -= dy / b.mass / b.mass
    }

    for (const node of nodes) {
        const {velocity, position} = node

        /*
            commit and sort
        */
        if (!node.anchor) {
            if (velocity.x * velocity.x + velocity.y * velocity.y > options.min_move) {
                changeNodePosition(grid, node, position.x + velocity.x, position.y + velocity.y)
            }
        }

        /*
            inertia
        */
        velocity.x *= options.inertia_strength * alpha
        velocity.y *= options.inertia_strength * alpha
    }
}
