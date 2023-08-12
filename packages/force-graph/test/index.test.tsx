import { describe, expect, test } from 'vitest'
import {
    Options,
    addNodesToGrid,
    default_options,
    findClosestNode,
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
        expect(grid.radius).toBe(20)
    })
})

describe('findClosestNode', () => {
    const graph = makeGraph(test_options)

    /*
        -20  -10    0    10    20
        ------------------------- -20
        |     |     |     |     |
        |     |     |     |     |
        |     |     |     |     |
        ------------------------- -10
        |     | a   |b    |     |
        |     |     |     |     |
        |     |    c|     |     |
        ------------------------- 0
        |     |     |     |     |
        |     |     |  d  |     |
        |     |     |e    |     |
        ------------------------- 10
        |     |     |     |     |
        |     |     |     |     |
        |     |     |     |     |
        ------------------------- 20
        -20  -10    0    10    20
    */

    const node_a = makeNode('a')
    const node_b = makeNode('b')
    const node_c = makeNode('c')
    const node_d = makeNode('d')
    const node_e = makeNode('e')

    node_a.position = { x: -9, y: -8 }
    node_b.position = { x: 2, y: -7 }
    node_c.position = { x: -1, y: -1 }
    node_d.position = { x: 6, y: 2 }
    node_e.position = { x: 1, y: 9 }

    addNodesToGrid(graph.grid, [node_a, node_b, node_c, node_d, node_e])

    test('same pos', () => {
        const closest = findClosestNode(graph, { x: -9, y: -8 })
        expect(closest).toBe(node_a)
    })

    test('same cell', () => {
        const closest = findClosestNode(graph, { x: 4, y: -8 })
        expect(closest).toBe(node_b)
    })

    test('cell above', () => {
        const closest = findClosestNode(graph, { x: -1, y: 2 })
        expect(closest).toBe(node_c)
    })

    test('cell below', () => {
        const closest = findClosestNode(graph, { x: -9, y: -11 })
        expect(closest).toBe(node_a)
    })

    test('cell left', () => {
        const closest = findClosestNode(graph, { x: 12, y: 5 })
        expect(closest).toBe(node_d)
    })

    test('cell right', () => {
        const closest = findClosestNode(graph, { x: -1, y: 8 })
        expect(closest).toBe(node_e)
    })

    test('cell above left', () => {
        const closest = findClosestNode(graph, { x: 12, y: 11 })
        expect(closest).toBe(node_d)
    })

    test('cell above right', () => {
        const closest = findClosestNode(graph, { x: -1, y: 11 })
        expect(closest).toBe(node_e)
    })

    test('cell below left', () => {
        const closest = findClosestNode(graph, { x: 12, y: -1 })
        expect(closest).toBe(node_d)
    })

    test('cell below right', () => {
        const closest = findClosestNode(graph, { x: -11, y: -11 })
        expect(closest).toBe(node_a)
    })

    test('max distance', () => {
        const pos = { x: 14, y: 5 }

        const fail = findClosestNode(graph, pos, 5)
        expect(fail).toBeUndefined()

        const success = findClosestNode(graph, pos, 10)
        expect(success).toBe(node_d)
    })
})
