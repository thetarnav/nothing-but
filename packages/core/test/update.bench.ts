import { describe, bench } from 'vitest'
import { array, graph, math, trig } from '../src'

function generateExampleGraph(length: number): graph.Graph {
    const nodes: graph.Node[] = Array.from(
        { length },
        () => new graph.Node(trig.vec(math.randomFrom(-50, 50), math.randomFrom(-50, 50))),
    )
    const edges: graph.Edge[] = []

    for (let i = 0; i < length; i++) {
        if (i % 3 === 0) continue

        const node = nodes[i]!
        const node_b = nodes[(i + 1) % length]!

        edges.push(graph.connect(node, node_b))
    }

    const new_graph = new graph.Graph()

    new_graph.nodes = nodes
    new_graph.edges = edges

    graph.resetOrder(new_graph)

    return new_graph
}

const fns = {
    // Accurate: graph.updatePositionsAccurate,
    Optimized: graph.updatePositionsOptimized,
    Grid: graph.updatePositionsGrid,
}

;[
    // 64,
    // 256,
    // 512,
    1024, 2048, 4096,
].forEach(n => {
    describe(`update ${n} nodes`, () => {
        for (const [name, fn] of Object.entries(fns)) {
            const graph = generateExampleGraph(n)

            bench(name, () => {
                for (let i = 0; i < 36; i++) fn(graph)
            })
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
