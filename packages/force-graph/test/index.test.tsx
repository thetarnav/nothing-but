import {Position} from "@nothing-but/utils/types"
import * as vi from "vitest"
import * as fg from "../src/index.js"

const test_options: fg.graph.Options = {
	...fg.graph.DEFAULT_OPTIONS,
	grid_size: 40,
	repel_distance: 10,
}

void vi.describe("makeGraphGrid", () => {
	vi.test("makeGraphGrid", () => {
		const grid = fg.graph.graphGrid(test_options)
		vi.expect(grid.axis_cells).toBe(4)
		vi.expect(grid.cells.length).toBe(16)
		vi.expect(grid.cell_size).toBe(10)
		vi.expect(grid.size).toBe(40)
	})
})

void vi.describe("find closest node", () => {
	/*
        0    10    20    30    40
        ------------------------- 0
        |     |     |     |     |
        |     |     |     |     |
        |     |     |     |     |
        ------------------------- 10
        |     | a   |b    |     |
        |     |     |     |     |
        |     |    c|     |     |
        ------------------------- 20
        |     |     |     |     |
        |     |     |  d  |     |
        |     |     |e    |     |
        ------------------------- 30
        |     |     |     |     |
        |     |     |     |     |
        |     |     |     |     |
        ------------------------- 40
        0    10    20    30    40
    */

	const node_a = fg.graph.zeroNode()
	const node_b = fg.graph.zeroNode()
	const node_c = fg.graph.zeroNode()
	const node_d = fg.graph.zeroNode()
	const node_e = fg.graph.zeroNode()

	node_a.position = {x: 11, y: 12}
	node_b.position = {x: 22, y: 13}
	node_c.position = {x: 19, y: 19}
	node_d.position = {x: 26, y: 22}
	node_e.position = {x: 21, y: 29}

	const fns = {
		findClosestNode: fg.graph.findClosestNode,
		findClosestNodeLinear(
			graph: fg.graph.Graph,
			pos: Position,
			max_dist?: number,
		): fg.graph.Node | undefined {
			return fg.graph.findClosestNodeLinear(graph.nodes, pos, max_dist)
		},
	}

	const graph = fg.graph.makeGraph(test_options, [node_a, node_b, node_c, node_d, node_e])

	Object.entries(fns).forEach(([name, fn]) => {
		void vi.describe(name, () => {
			vi.test("same pos", () => {
				const closest = fn(graph, {x: 11, y: 12})
				vi.expect(closest).toBe(node_a)
			})

			vi.test("same cell", () => {
				const closest = fn(graph, {x: 24, y: 12})
				vi.expect(closest).toBe(node_b)
			})

			vi.test("cell above", () => {
				const closest = fn(graph, {x: 19, y: 22})
				vi.expect(closest).toBe(node_c)
			})

			vi.test("cell below", () => {
				const closest = fn(graph, {x: 11, y: 9})
				vi.expect(closest).toBe(node_a)
			})

			vi.test("cell left", () => {
				const closest = fn(graph, {x: 32, y: 25})
				vi.expect(closest).toBe(node_d)
			})

			vi.test("cell right", () => {
				const closest = fn(graph, {x: 19, y: 28})
				vi.expect(closest).toBe(node_e)
			})

			vi.test("cell above left", () => {
				const closest = fn(graph, {x: 32, y: 31})
				vi.expect(closest).toBe(node_d)
			})

			vi.test("cell above right", () => {
				const closest = fn(graph, {x: 19, y: 31})
				vi.expect(closest).toBe(node_e)
			})

			vi.test("cell below left", () => {
				const closest = fn(graph, {x: 32, y: 19})
				vi.expect(closest).toBe(node_d)
			})

			vi.test("cell below right", () => {
				const closest = fn(graph, {x: 9, y: 9})
				vi.expect(closest).toBe(node_a)
			})

			vi.test("max distance", () => {
				const pos = {x: 34, y: 25}

				const fail = fn(graph, pos, 5)
				vi.expect(fail).toBeUndefined()

				const success = fn(graph, pos, 10)
				vi.expect(success).toBe(node_d)
			})
		})
	})
})
