import { Position } from '@nothing-but/utils/types'
import { describe, expect, test } from 'vitest'
import {
    Graph,
    Node,
    Options,
    default_options,
    findClosestNode,
    findClosestNodeLinear,
    makeGraph,
    makeGraphGrid,
    makeNode,
} from '../src/index.js'

const test_options: Options = {
    ...default_options,
    grid_size: 40,
    repel_distance: 10,
}

describe('makeGraphGrid', () => {
    test('makeGraphGrid', () => {
        const grid = makeGraphGrid(test_options)
        expect(grid.axis_cells).toBe(4)
        expect(grid.cells.length).toBe(16)
        expect(grid.cell_size).toBe(10)
        expect(grid.size).toBe(40)
    })
})

describe('find closest node', () => {
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

    const node_a = makeNode('a')
    const node_b = makeNode('b')
    const node_c = makeNode('c')
    const node_d = makeNode('d')
    const node_e = makeNode('e')

    node_a.position = { x: 11, y: 12 }
    node_b.position = { x: 22, y: 13 }
    node_c.position = { x: 19, y: 19 }
    node_d.position = { x: 26, y: 22 }
    node_e.position = { x: 21, y: 29 }

    const graph = makeGraph(test_options, [node_a, node_b, node_c, node_d, node_e])

    const fns = {
        findClosestNode,
        findClosestNodeLinear(graph: Graph, pos: Position, max_dist?: number): Node | undefined {
            return findClosestNodeLinear(graph.nodes, pos, max_dist)
        },
    }

    Object.entries(fns).forEach(([name, fn]) => {
        describe(name, () => {
            test('same pos', () => {
                const closest = fn(graph, { x: 11, y: 12 })
                expect(closest).toBe(node_a)
            })

            test('same cell', () => {
                const closest = fn(graph, { x: 24, y: 12 })
                expect(closest).toBe(node_b)
            })

            test('cell above', () => {
                const closest = fn(graph, { x: 19, y: 22 })
                expect(closest).toBe(node_c)
            })

            test('cell below', () => {
                const closest = fn(graph, { x: 11, y: 9 })
                expect(closest).toBe(node_a)
            })

            test('cell left', () => {
                const closest = fn(graph, { x: 32, y: 25 })
                expect(closest).toBe(node_d)
            })

            test('cell right', () => {
                const closest = fn(graph, { x: 19, y: 28 })
                expect(closest).toBe(node_e)
            })

            test('cell above left', () => {
                const closest = fn(graph, { x: 32, y: 31 })
                expect(closest).toBe(node_d)
            })

            test('cell above right', () => {
                const closest = fn(graph, { x: 19, y: 31 })
                expect(closest).toBe(node_e)
            })

            test('cell below left', () => {
                const closest = fn(graph, { x: 32, y: 19 })
                expect(closest).toBe(node_d)
            })

            test('cell below right', () => {
                const closest = fn(graph, { x: 9, y: 9 })
                expect(closest).toBe(node_a)
            })

            test('max distance', () => {
                const pos = { x: 34, y: 25 }

                const fail = fn(graph, pos, 5)
                expect(fail).toBeUndefined()

                const success = fn(graph, pos, 10)
                expect(success).toBe(node_d)
            })
        })
    })
})
