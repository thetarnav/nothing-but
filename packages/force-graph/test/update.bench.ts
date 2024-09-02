import * as vi from 'vitest'
import * as graph from '../src/graph.js'
import * as graph2 from '../src/graph2.js'
// import * as graph2 from '../src/index2'

const fns: Record<string, {
	make:     (len: number) => unknown,
	simulate: (graph: unknown) => void,
}> = {
	// Accurate: graph.updatePositionsAccurate,
	// Optimized: graph.updatePositionsOptimized,
	"og": {
		make(len) {
			const nodes: graph.Node[] = Array.from({length: len}, graph.zeroNode)
			const edges: graph.Edge[] = []

			for (let i = 0; i < len; i++) {
				if (i % 3 === 0) continue

				const node_a = nodes[i]!
				const node_b = nodes[(i+1) % len]!

				edges.push(graph.connect(node_a, node_b))
			}

			const options = graph.DEFAULT_OPTIONS

			// graph.randomizeNodePositions(nodes, options.grid_size)

			return graph.makeGraph(options, nodes, edges)
		},
		simulate(g) {
			graph.simulate(g as graph.Graph)
		},
	},
	"new": {
		make(len) {
			let g = graph2.makeGraph(
				graph2.DEFAULT_OPTIONS,
				Array.from({length: len}, graph2.zeroNode),
			)

			for (let i = 0; i < len; i++) {
				if (i % 3 === 0) continue

				graph2.connect_idx(g, i, (i+1) % len)
			}

			return g
		},
		simulate(g) {
			graph2.simulate(g as graph2.Graph)
		},
	}
	// 2: {
	//     fn: graph2.updatePositions,
	//     mod: graph2,
	// },
}

;[
	// 64,
	// 256,
	// 512,
	// 1024,
	2048,
	// 4096,
	// 6144,
].forEach(n => {
	vi.describe(`update ${n} nodes`, () => {
		for (const [name, api] of Object.entries(fns)) {
			const g = api.make(n)

			vi.bench(name, () => {
				for (let i = 0; i < 36; i++) {
					api.simulate(g)
				}
			}, {iterations: 14})
		}
	})
})

// const distance = (a: trig.Vec, b: trig.Vec) => {
//     const dx = a.x - b.x
//     const dy = a.y - b.y
//     return Math.sqrt(dx * dx + dy * dy)
// }

// const distance2 = (a: trig.Vec, b: trig.Vec) => ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5

// const distance3 = (a: trig.Vec, b: trig.Vec) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

// const distance_fns = {
//     distance,
//     distance2,
//     distance3,
// }

// describe('distance', () => {
//     const list = Array.from({ length: 1000 }, () =>
//         trig.vec(math.randomFrom(-50, 50), math.randomFrom(-50, 50)),
//     )

//     for (const [name, fn] of Object.entries(distance_fns)) {
//         bench(name, () => {
//             for (let i = 0; i < list.length - 1; i++) {
//                 fn(list[i]!, list[i + 1]!)
//             }
//         })
//     }
// })
