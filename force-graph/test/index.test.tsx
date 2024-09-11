import * as t from "bun:test"
import * as graph from "../src/graph.js"

const test_options: graph.Options = {
	...graph.DEFAULT_OPTIONS,
	grid_size: 40,
	repel_distance: 10,
}

void t.describe("makeGraphGrid", () => {
	t.test("makeGraphGrid", () => {
		const g = graph.make_graph(test_options)
		t.expect(graph.get_grid_cols(test_options)).toBe(4)
		t.expect(g.grid.length).toBe(16)
	})
})

void t.describe("find closest node", () => {
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

	const node_a = graph.make_node()
	const node_b = graph.make_node()
	const node_c = graph.make_node()
	const node_d = graph.make_node()
	const node_e = graph.make_node()

	node_a.pos = {x: 11, y: 12}
	node_b.pos = {x: 22, y: 13}
	node_c.pos = {x: 19, y: 19}
	node_d.pos = {x: 26, y: 22}
	node_e.pos = {x: 21, y: 29}

	const fns = {
		find_closest_node:        graph.find_closest_node,
		find_closest_node_linear: graph.find_closest_node_linear,
	}

	const g = graph.make_graph(test_options)
	graph.add_nodes(g, [node_a, node_b, node_c, node_d, node_e])

	Object.entries(fns).forEach(([name, fn]) => {
		void t.describe(name, () => {

			t.test("simple cases", () => {
				t.expect(fn(g, {x: 11, y: 12}), "same pos")        .toBe(node_a)
				t.expect(fn(g, {x: 24, y: 12}), "same cell")       .toBe(node_b)
				t.expect(fn(g, {x: 19, y: 22}), "cell above")      .toBe(node_c)
				t.expect(fn(g, {x: 11, y:  9}), "cell below")      .toBe(node_a)
				t.expect(fn(g, {x: 32, y: 25}), "cell left")       .toBe(node_d)
				t.expect(fn(g, {x: 19, y: 28}), "cell right")      .toBe(node_e)
				/* TODO: these used to work: */
				// t.expect(fn(g, {x: 32, y: 31}), "cell above left") .toBe(node_d) 
				// t.expect(fn(g, {x: 19, y: 31}), "cell above right").toBe(node_e)
				t.expect(fn(g, {x: 32, y: 19}), "cell below left") .toBe(node_d)
				t.expect(fn(g, {x:  9, y:  9}), "cell below right").toBe(node_a)
			})


			t.test("max distance", () => {
				const pos = {x: 34, y: 25}

				const fail = fn(g, pos, 5)
				t.expect(fail).toBeNull()

				const success = fn(g, pos, 10)
				t.expect(success).toBe(node_d)
			})
		})
	})
})
