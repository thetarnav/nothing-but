import { bench, describe } from 'vitest'
import * as FG from '../src/index.js'
// import * as graph2 from '../src/index2'

function generateExampleGraph(mod: typeof FG, length: number): FG.Graph {
    const nodes: FG.Node[] = Array.from({ length }, FG.makeNode)

    const edges: FG.Edge[] = []

    for (let i = 0; i < length; i++) {
        if (i % 3 === 0) continue

        const node = nodes[i]!
        const node_b = nodes[(i + 1) % length]!

        edges.push(mod.connect(node, node_b))
    }

    FG.randomizeNodePositions(nodes, FG.default_options)

    return FG.makeGraph(FG.default_options, nodes, edges)
}

const fns = {
    // Accurate: graph.updatePositionsAccurate,
    // Optimized: graph.updatePositionsOptimized,
    1: {
        fn: FG.simulateGraph,
        mod: FG,
    },
    // 2: {
    //     fn: graph2.updatePositions,
    //     mod: graph2,
    // },
}

;[
    // 64,
    // 256,
    // 512,
    1024, 2048, 4096,
    // 6144,
].forEach(n => {
    describe(`update ${n} nodes`, () => {
        for (const [name, { fn, mod }] of Object.entries(fns)) {
            const graph = generateExampleGraph(mod, n)

            bench(
                name,
                () => {
                    for (let i = 0; i < 36; i++) {
                        fn(graph)
                    }
                },
                { iterations: 14 },
            )
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
