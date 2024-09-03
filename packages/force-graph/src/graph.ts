import {num, T, trig, array} from "@nothing-but/utils"

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
	 * velocity += (delta / distance) * force
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
	 * velocity += (delta * link_strength) / n_edges
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
	/** Minimum velocity to move a node. */
	readonly min_move: number
	/** Size of the grid used for spatial lookup. Node positions will be clamped to this size. */
	readonly grid_size: number
}

export const DEFAULT_OPTIONS: Options = {
	inertia_strength: 0.7,
	repel_strength:   0.4,
	repel_distance:   20,
	link_strength:    0.02,
	origin_strength:  0.012,
	min_move:         0.001,
	grid_size:        200,
}

export type Graph = {
	options: Options
	nodes:   Node[]
	edges:   Edge[]
	/**
	 Spatial grid for looking up surrounding nodes by their position.

	 The first index is the matrix cell calculated from the x and y position of the node.

	 The second index is the index of the node in the call array,
	 sorted by x position. Low to High.
	*/
	grid:    Node[][]
	max_pos: number
}

export type Edge = {
	a: Node, b: Node
	strength: number
}

export type Node = {
	/**
	 User data key.
	 Use it to identify the node in the graph, and match it with additional data.
	 Otherwise, you can use object references to match nodes.
	*/
	key:    string | number | undefined
	/** Label to display on the node when rendering. Set it to an empty string to hide the label. */
	label:  string
	/** Current position of the node. */
	pos:    T.Position
	/** Current node velocity, will be added to the position each frame. */
	vel:    T.Position
	mass:   number
	/** Do not change the position of this node. */
	anchor: boolean
	/**
	 Has the node moved since the last frame?

	 This value is not changed back to `false` automatically. Change it manually if you handled
	 the movement.
	*/
	moved:  boolean
}

/**
 get a zero initialized node

 @example
 ```ts
 const node = make_node()
 node.label = "hello"
 node.key = 1
 ```
*/
export function make_node(): Node {
	return {
		key:    undefined,
		label:  "",
		pos:    {x: 0, y: 0},
		vel:    {x: 0, y: 0},
		mass:   1,
		anchor: false,
		moved:  false,
	}
}

export function make_graph(options: Options): Graph {
	let cols = get_grid_cols(options)
	let grid = Array.from({length: cols*cols}, () => [])

	return {
		nodes:   [],
		edges:   [],
		grid:    grid,
		options: options,
		max_pos: num.find_open_upper_bound(options.grid_size),
	}
}

export function node_mass_from_edges(edges_length: number): number {
	return Math.log2(edges_length + 2)
}

export function get_grid_cols(options: Options): number {
	return Math.ceil(options.grid_size / 2 / options.repel_distance) * 2
}

/** **Note:** This function does not clamp the position to the grid. */
export function pos_to_grid_idx(options: Options, pos: T.Position): number {
	let xi = Math.floor(pos.x / options.repel_distance)
	let yi = Math.floor(pos.y / options.repel_distance)
	return xi + yi * get_grid_cols(options)
}

export function add_node(g: Graph, node: Node): void {
	g.nodes.push(node)
	add_node_to_grid(g, node)
}
export function add_nodes(g: Graph, nodes: readonly Node[]): void {
	for (let node of nodes) {
		add_node(g, node)
	}
}

export function add_node_to_grid(
	g: Graph, node: Node,
	cell_idx: number = pos_to_grid_idx(g.options, node.pos),
): void {
	let cell = g.grid[cell_idx]
	let i    = 0
	while (i < cell.length && cell[i].pos.x < node.pos.x) {
		i++
	}
	cell.splice(i, 0, node)
}

export function clear_nodes(g: Graph): void {
	g.nodes.length = 0
	g.edges.length = 0
	for (let cell of g.grid) {
		cell.length = 0
	}
}

export function add_nodes_to_grid(g: Graph, nodes: readonly Node[]): void {
	for (const node of nodes) {
		add_node_to_grid(g, node)
	}
}

export function get_edge_idx(g: Graph, a: Node, b: Node): number {
	for (let i = 0; i < g.edges.length; i++) {
		let edge = g.edges[i]
		if ((edge.a === a && edge.b === b) ||
		    (edge.a === b && edge.b === a)) {
			return i
		}
	}
	return -1
}

export function get_edge(g: Graph, a: Node, b: Node): Edge | undefined {
	let idx = get_edge_idx(g, a, b)
	if (idx != -1) {
		return g.edges[idx]
	}
}

export function get_node_edges(g: Graph, node: Node): Edge[] {
	let edges: Edge[] = []
	for (let edge of g.edges) {
		if (edge.a === node || edge.b === node) {
			edges.push(edge)
		}
	}
	return edges
}

/**
 * Connects two nodes and returns the new edge.
 *
 * **It doesn't check if the nodes are already connected.** Use {@link get_edge} to check before
 * connecting.
 */
export function connect(g: Graph, a: Node, b: Node, strength = 1): Edge {
	let edge: Edge = {a, b, strength}
	g.edges.push(edge)
	return edge
}

export function disconnect(g: Graph, a: Node, b: Node): void {
	let idx = get_edge_idx(g, a, b)
	if (idx != -1) {
		array.unordered_remove(g.edges, idx)
	}
}

/**
 * Returns the closest node to the given position.
 *
 * The search is done linearly, so it scales O(n) with the number of nodes.
 *
 * It does a simple search, witout assuming anything about the gird.
 */
export function find_closest_node_linear(
	g: Graph, pos: T.Position,
	max_dist: number = Infinity,
): Node | null {
	let closest_node: Node | null = null
	let closest_dist = max_dist

	for (let node of g.nodes) {
		let dist = trig.distance(node.pos, pos)
		if (dist < closest_dist) {
			closest_node = node
			closest_dist = dist
		}
	}

	return closest_node
}

/**
 * Returns the closest node to the given position.
 *
 * The search is done using a grid, so it scales O(log n) with the number of nodes.
 *
 * The implementation assumes that the max_dist is smaller than the cell size. So it will only
 * return nodes very close to the position.
 *
 * Position outside of the graph will return `undefined`.
 */
export function find_closest_node(
	g: Graph, pos: T.Position,
	max_dist: number = Infinity,
): Node | null {
	let {x, y} = pos

	if (x < 0 || x > g.options.grid_size || y < 0 || y > g.options.grid_size) {
		return null
	}

	let grid_cols  = get_grid_cols(g.options)
	let pos_idx    = pos_to_grid_idx(g.options, pos)
	let x_axis_idx = pos_idx % grid_cols
	let y_axis_idx = Math.floor(pos_idx / grid_cols)

	/*
		1 | -1, depending on which side of the cell the position is on
	*/
	let idx_dx = Math.floor(num.remainder(x/g.options.repel_strength, 1) + 0.5) * 2 - 1
	let idx_dy = Math.floor(num.remainder(y/g.options.repel_strength, 1) + 0.5) * 2 - 1

	/*
		clamp the index to the grid -> 1 | 0 | -1
	*/
	idx_dx = num.clamp(idx_dx, -x_axis_idx, grid_cols -1 -x_axis_idx)
	idx_dy = num.clamp(idx_dy, -y_axis_idx, grid_cols -1 -y_axis_idx)

	let closest_dist = max_dist
	let closest_node: Node | null = null

	/*
		check the 4 cells around the position
		including the cell the position is in
	*/
	for (let xi = 0; xi <= 1; xi++) {
		let dxi = idx_dx * xi

		for (let yi = 0; yi <= 1; yi++) {
			let idx = pos_idx + dxi + grid_cols * idx_dy * yi
			let order = g.grid[idx]

			if (dxi == -1) {
				/*
					right to left
				*/
				for (let i = order.length - 1; i >= 0; i--) {
					let node = order[i]
					if (x - node.pos.x > closest_dist) break

					let dist = trig.distance(pos, node.pos)
					if (dist < closest_dist) {
						closest_dist = dist
						closest_node = node
					}
				}
			} else {
				/*
					left to right
				*/
				for (let node of order) {
					if (x - node.pos.x > closest_dist) continue
					if (node.pos.x - x > closest_dist) break

					let dist = trig.distance(pos, node.pos)
					if (dist < closest_dist) {
						closest_dist = dist
						closest_node = node
					}
				}
			}
		}
	}

	return closest_node
}

export function randomize_positions(g: Graph): void {
	let margin = g.options.grid_size / 4
	for (let node of g.nodes) {
		node.pos.x = num.random_from(margin, g.options.grid_size - margin)
		node.pos.y = num.random_from(margin, g.options.grid_size - margin)
		node.moved = true
	}
}

export function spread_positions(g: Graph): void {

	let margin    = g.options.grid_size / 4
	let max_width = g.options.grid_size - margin*2
	let cols      = get_grid_cols(g.options)

	for (let i = 0; i < g.nodes.length; i++) {
		let x = margin + i%cols/cols                 * max_width
		let y = margin + Math.ceil(i/cols)%cols/cols * max_width
		set_position_xy(g, g.nodes[i], x, y)
	}
}

export function set_position(g: Graph, node: Node, pos: T.Position): void {
	set_position_xy(g, node, pos.x, pos.y)
}

export function set_position_xy(g: Graph, node: Node, x: number, y: number): void {
	let prev_idx = pos_to_grid_idx(g.options, node.pos)
	let prev_x   = node.pos.x

	node.pos.x = num.clamp(x, 0, g.max_pos)
	node.pos.y = num.clamp(y, 0, g.max_pos)
	node.moved = true

	let idx   = pos_to_grid_idx(g.options, node.pos)
	let cell  = g.grid[prev_idx]
	let order = cell.indexOf(node)

	if (idx !== prev_idx) {
		cell.splice(order, 1)
		add_node_to_grid(g, node, idx)
	} else {
		/*
		1  3  5 (2) 9
		1  3  2<>5  9
		1  2<>3  5  9
		*/
		if (x - prev_x < 0) {
			for (let i = order-1; i >= 0 && cell[i].pos.x > x; i--) {
				[cell[i+1], cell[i]] = [cell[i], cell[i+1]]
			}
		} else {
			for (let i = order+1; i < cell.length && cell[i].pos.x < x; i++) {
				[cell[i-1], cell[i]] = [cell[i], cell[i-1]]
			}
		}
	}
}

export function push_nodes_away(
	g: Graph,
	a: Node, b: Node,
	dx: number, dy: number,
	alpha: number,
): void {
	let d = Math.sqrt(dx*dx + dy*dy)

	if (d >= g.options.repel_distance) return

	let f  = g.options.repel_strength * (1 - d / g.options.repel_distance) * alpha
	let mx = dx/d * f
	let my = dy/d * f

	a.vel.x += mx/a.mass * b.mass
	a.vel.y += my/a.mass * b.mass
	b.vel.x -= mx/b.mass * a.mass
	b.vel.y -= my/b.mass * a.mass
}

/**
 Simulates the graph for one frame.

 Updates the velocity, position and moved flag of each node.

 @param g The graph to simulate {@link Graph}
 @param alpha The simulation speed multiplier. Default is 1. Use this to slow down or speed up the
   simulation with time.
*/
export function simulate(g: Graph, alpha: number = 1): void {
	let {nodes, edges, grid, options} = g

	let grid_cols = get_grid_cols(g.options)

	for (let node of nodes) {
		let {vel, pos} = node
		let {x, y} = pos

		/*
			towards the origin
		*/
		vel.x += (options.grid_size/2 - x) * options.origin_strength * alpha / node.mass
		vel.y += (options.grid_size/2 - y) * options.origin_strength * alpha / node.mass

		/*
			away from other nodes
			look only at the nodes right to the current node
			and apply the force to both nodes
		*/
		let node_idx      = pos_to_grid_idx(options, pos)
		let dy_min        = -(node_idx >= grid_cols)
		let dy_max        = +(node_idx < grid.length - grid_cols)
		let at_right_edge = node_idx % grid_cols === grid_cols-1

		for (let dy_idx = dy_min; dy_idx <= dy_max; dy_idx++) {

			let idx = node_idx + dy_idx * grid_cols

			/*
				from the right cell edge to the node
			*/
			let order = grid[idx]

			for (let i = order.length - 1; i >= 0; i--) {
				let node_b = order[i]
				let dx = x - node_b.pos.x

				if (dx > 0) break

				let dy = y - node_b.pos.y

				if (dx === 0 && dy >= 0) continue

				push_nodes_away(g, node, node_b, dx, dy, alpha)
			}

			/*
				from the left edge of neighboring right cell to the end of repel distance
			*/
			if (at_right_edge) continue

			order = grid[idx+1]

			for (let node_b of order) {
				let dx = x - node_b.pos.x

				if (dx <= -options.repel_distance) break

				let dy = y - node_b.pos.y

				push_nodes_away(g, node, node_b, dx, dy, alpha)
			}
		}
	}

	/*
		towards the edges
		the more edges a node has, the more velocity it accumulates
		so the velocity is divided by the number of edges
	*/
	for (let {a, b, strength} of edges) {
		let dx = (b.pos.x - a.pos.x) * options.link_strength * strength * alpha
		let dy = (b.pos.y - a.pos.y) * options.link_strength * strength * alpha

		a.vel.x += dx / a.mass / a.mass
		a.vel.y += dy / a.mass / a.mass
		b.vel.x -= dx / b.mass / b.mass
		b.vel.y -= dy / b.mass / b.mass
	}

	for (let node of nodes) {
		let {vel, pos} = node

		/*
			commit and sort
		*/
		if (!node.anchor) {
			if (vel.x*vel.x + vel.y*vel.y > options.min_move) {
				set_position_xy(g, node, pos.x+vel.x, pos.y+vel.y)
			}
		}

		/*
			inertia
		*/
		vel.x *= options.inertia_strength * alpha
		vel.y *= options.inertia_strength * alpha
	}
}
