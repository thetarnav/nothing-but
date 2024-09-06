import {num} from "@nothing-but/utils"
import {graph} from "../src/index.js"
import {graph_options} from "./app.jsx"
import la_raw from "./la.json"
import la_2_raw from "./la_2.json"

export function getLA2Graph(): graph.Graph {
	const entries  = Object.entries(la_2_raw)
	const node_map = new Map<string, graph.Node>()

	let g = graph.make_graph(graph_options)

	/*
        Nodes
    */
	for (const [key, raw] of entries) {

		const node = graph.make_node()
		node.key   = key
		node.label = raw.prettyName

		graph.add_node(g, node)
		node_map.set(key, node)
	}

	/*
        Connections
    */
	for (const [key, raw] of entries) {
		const node = node_map.get(key)!

		for (const link_key of raw.connections) {
			const link_node = node_map.get(link_key)
			if (link_node) {
				graph.connect(g, node, link_node)
			}
		}
	}

	for (const node of g.nodes) {
		let edges = graph.get_node_edges(g, node)
		node.mass = graph.node_mass_from_edges(edges.length)
	}

	return g
}

export function getLAGraph(): graph.Graph {

	let g = graph.make_graph(graph_options)
	const node_map = new Map<string, graph.Node>()

	for (let raw of la_raw) {

		const node = graph.make_node()
		node.key   = raw.file

		graph.add_node(g, node)
		node_map.set(raw.file, node)
	}

	for (let raw of la_raw) {
		let node = node_map.get(raw.file)!

		for (let link of raw.links) {
			let link_node = node_map.get(link.file)

			if (link_node && graph.get_edge_idx(g, node, link_node) !== -1) {
				graph.connect(g, node, link_node, 1 + link.count/10)
			}
		}
	}

	for (const node of g.nodes) {
		let edges = graph.get_node_edges(g, node)
		node.mass = graph.node_mass_from_edges(edges.length)
	}

	return g
}

export function generateInitialGraph(length: number = 256): graph.Graph {

	let g = graph.make_graph(graph_options)

	for (let i = 0; i < length; i++) {
		let node = graph.make_node()
		graph.add_node(g, node)
	}

	for (let i = 0; i < length; i++) {
		let node  = g.nodes[i]
		let edges = graph.get_node_edges(g, node)

		if (edges.length > 0 && Math.random() < 0.8) continue

		const b_index = num.random_int(length)
		let node_b = g.nodes[b_index]

		if (node_b === node) {
			node_b = g.nodes[(b_index+1) % length]
		}

		graph.connect(g, node, node_b)
	}

	return g
}
