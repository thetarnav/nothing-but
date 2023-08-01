import { math } from '@nothing-but/utils'
import { Position } from '@nothing-but/utils/types'

export interface Options {
    /**
     * Percent of velocity to retain each frame.
     *
     * ```ts
     * velocity *= inertia_strength
     * ```
     */
    inertia_strength: number
    /**
     * Strength of nodes pushing each other away.
     *
     * ```ts
     * force = repel_strength * (1 - distance / repel_distance)
     * velocity += delta / distance * force
     * ```
     */
    repel_strength: number
    /**
     * Distance at which nodes start to repel each other.
     *
     * @see {@link repel_strength}
     */
    repel_distance: number
    /**
     * Strength of the connection between nodes.
     *
     * ```ts
     * velocity += delta * link_strength / n_edges
     * ```
     */
    link_strength: number
    /**
     * Pull towards the origin.
     *
     * ```ts
     * velocity -= node_position * origin_strength
     * ```
     */
    origin_strength: number
    /**
     * Minimum velocity to move a node.
     */
    min_move: number
    /**
     * Size of the grid used for spatial lookup.
     * Node positions will be clamped to this size.
     */
    grid_size: number
}

export const default_options: Options = {
    inertia_strength: 0.7,
    repel_strength: 0.4,
    repel_distance: 20,
    link_strength: 0.02,
    origin_strength: 0.012,
    min_move: 0.001,
    grid_size: 200,
}

export function makeGraphOptions(options?: Partial<Options>): Options {
    return { ...default_options, ...options }
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
    radius: number
    cell_size: number
    axis_cells: number
    n_cells: number
}

export function makeGraphGrid(options: Options): Grid {
    const grid_radius = options.grid_size / 2,
        axis_cells = Math.ceil(grid_radius / options.repel_distance) * 2,
        n_cells = axis_cells * axis_cells

    return {
        cells: Array.from({ length: n_cells }, () => []),
        axis_cells,
        n_cells,
        cell_size: options.repel_distance,
        radius: grid_radius,
    }
}

export function toGridIdx(grid: Grid, pos: Position): number {
    const { radius, axis_cells, cell_size } = grid,
        xi = Math.floor((pos.x + radius) / cell_size),
        yi = Math.floor((pos.y + radius) / cell_size)
    return xi + yi * axis_cells
}
// const get_node_x = (node: Node): number => node.position.x

export function addNodeToGrid(
    grid: Grid,
    node: Node,
    idx: number = toGridIdx(grid, node.position),
): void {
    const order = grid.cells[idx]!,
        { x } = node.position

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
    const grid = makeGraphGrid(options)
    addNodesToGrid(grid, nodes)

    return { nodes, edges, grid, options }
}

export interface Node {
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
    position: Position
    velocity: Position
    edges: Edge[]
    /**
     * Do not change the position of this node.
     */
    locked: boolean
    /**
     * Has the node moved since the last frame?
     *
     * This value is not changed back to `false` automatically. Change it manually if you handled the movement.
     */
    moved: boolean
}

export function makeNode(key?: string | number | undefined): Node {
    return {
        key,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        edges: [],
        locked: false,
        moved: false,
    }
}

export interface Edge {
    a: Node
    b: Node
    strength: number
}

export function getEdge(a: Node, b: Node): Edge | undefined {
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
    const edge: Edge = { a, b, strength }
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

export function randomizeNodePositions(nodes: readonly Node[], options: Options): void {
    const { grid_size } = options
    const radius = grid_size / 4

    for (const node of nodes) {
        node.position.x = math.random_from(-radius, radius)
        node.position.y = math.random_from(-radius, radius)
        node.moved = true
    }
}

export function changeNodePosition(grid: Grid, node: Node, x: number, y: number): void {
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
    options: Options,
    alpha: number,
): void {
    const d = Math.sqrt(dx * dx + dy * dy)

    if (d >= options.repel_distance) return

    const force = options.repel_strength * (1 - d / options.repel_distance) * alpha,
        mx = (dx / d) * force,
        my = (dy / d) * force

    a.velocity.x += mx
    a.velocity.y += my
    b.velocity.x -= mx
    b.velocity.y -= my
}

/**
 * Simulates the graph for one frame.
 *
 * Updates the velocity, position and moved flag of each node.
 *
 * @param graph The graph to simulate {@link Graph}
 * @param alpha The simulation speed multiplier. Default is 1. Use this to slow down or speed up the simulation with time.
 */
export function simulateGraph(graph: Graph, alpha: number = 1): void {
    const { nodes, edges, grid, options } = graph

    for (const node of nodes) {
        const { velocity, position } = node,
            { x, y } = position

        /*
            towards the origin
        */
        velocity.x -= x * options.origin_strength * alpha
        velocity.y -= y * options.origin_strength * alpha

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

                pushNodesAway(node, node_b, dx, dy, options, alpha)
            }

            /*
                from the left edge of neighboring right cell to the end of repel distance
            */
            if (at_right_edge) continue

            order = grid.cells[_idx + 1]!

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
    for (const { a, b, strength } of edges) {
        const dx = (b.position.x - a.position.x) * options.link_strength * strength * alpha
        const dy = (b.position.y - a.position.y) * options.link_strength * strength * alpha

        const a_edges_mod = (a.edges.length + 2) / 3
        const b_edges_mod = (b.edges.length + 2) / 3

        a.velocity.x += dx / a_edges_mod
        a.velocity.y += dy / a_edges_mod
        b.velocity.x -= dx / b_edges_mod
        b.velocity.y -= dy / b_edges_mod
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
        velocity.x *= options.inertia_strength * alpha
        velocity.y *= options.inertia_strength * alpha
    }
}

export interface FrameAnimation {
    last_timestamp: number
    alpha: number
    target_ms: number // TODO: move to options
    active: boolean
    frame_id: number
    graph: Graph
    callback: VoidFunction
}

export function makeFrameAnimation(
    graph: Graph,
    callback: VoidFunction,
    target_fps: number = 44,
): FrameAnimation {
    return {
        last_timestamp: performance.now(),
        alpha: 0,
        target_ms: 1000 / target_fps,
        active: false,
        frame_id: 0,
        graph,
        callback,
    }
}

export function frame(animation: FrameAnimation, timestamp: DOMHighResTimeStamp) {
    const { graph, active, target_ms } = animation

    const delta_time = timestamp - animation.last_timestamp
    let times = Math.floor(delta_time / target_ms)
    animation.last_timestamp += times * target_ms

    if (times === 0) {
        animation.frame_id = requestAnimationFrame(timestamp => frame(animation, timestamp))
        return
    }

    times = Math.min(times, 2) // TODO: configurable
    for (let i = 0; i < times; i++) {
        // TODO: configurable
        animation.alpha = math.lerp(animation.alpha, active ? 1 : 0, active ? 0.03 : 0.005)

        if (animation.alpha < 0.001) {
            stopFrameAnimation(animation)
            return
        }

        simulateGraph(graph, animation.alpha)
    }

    animation.callback()

    animation.frame_id = requestAnimationFrame(timestamp => frame(animation, timestamp))
}

export function startFrameAnimation(animation: FrameAnimation): void {
    if (animation.active) return

    animation.active = true
    animation.last_timestamp = performance.now()
    animation.frame_id = requestAnimationFrame(timestamp => frame(animation, timestamp))
}

export function pauseFrameAnimation(animation: FrameAnimation): void {
    animation.active = false
}

export function stopFrameAnimation(animation: FrameAnimation): void {
    animation.alpha = 0
    animation.active = false
    cancelAnimationFrame(animation.frame_id)
}
