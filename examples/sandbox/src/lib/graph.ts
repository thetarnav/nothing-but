import { trig } from '.'

export class Node {
    position: trig.Vector
    edges: Edge[] = []

    constructor(position: trig.Vector) {
        this.position = position
    }
}

export function connect(a: Node, b: Node): Edge {
    const edge = new Edge(a, b)
    a.edges.push(edge)
    b.edges.push(edge)
    return edge
}

export function disconnect(a: Node, b: Node) {
    const a_edge_index = a.edges.findIndex(edge => edge.b === b)
    const b_edge_index = b.edges.findIndex(edge => edge.a === a)
    a.edges.splice(a_edge_index, 1)
    b.edges.splice(b_edge_index, 1)
}

export class Edge {
    a: Node
    b: Node

    constructor(a: Node, b: Node) {
        this.a = a
        this.b = b
    }

    get 0() {
        return this.a
    }
    get 1() {
        return this.b
    }

    *[Symbol.iterator]() {
        yield this.a
        yield this.b
    }
}

export function addNodeEdges(node: Node, seen: Set<Node>, edges: Edge[]): void {
    if (seen.has(node)) return

    for (const edge of node.edges) {
        if (seen.has(edge.b) || seen.has(edge.a)) continue
        edges.push(edge)
    }

    seen.add(node)
}
