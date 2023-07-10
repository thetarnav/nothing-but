import { type Component, For, onCleanup } from 'solid-js'
import { graph, math, s, trig } from './lib'
import clsx from 'clsx'
import la_raw from './la.json'

function getLAGraph() {
    const nodes: graph.Node[] = la_raw.map(
        () => new graph.Node(trig.vec(math.randomIntFrom(-50, 50), math.randomIntFrom(-50, 50))),
    )

    const edges: graph.Edge[] = []

    for (let i = 0; i < la_raw.length; i++) {
        const node = nodes[i]!
        const raw = la_raw[i]!

        for (const raw_b of raw.links) {
            const b_name = raw_b.file

            const b_index = la_raw.findIndex(raw => raw.file === b_name)

            if (b_index === -1) continue

            const node_b = nodes[b_index]!

            edges.push(graph.connect(node, node_b))
        }
    }

    return { nodes, edges }
}

function getInitialGraph() {
    const nodes: graph.Node[] = [
        new graph.Node(trig.vec(0, 0)), // 0
        new graph.Node(trig.vec(0, 20)), // 1
        new graph.Node(trig.vec(20, 0)), // 2
        new graph.Node(trig.vec(-20, -15)), // 3
        new graph.Node(trig.vec(35, -10)), // 4
        new graph.Node(trig.vec(15, 40)), // 5
        new graph.Node(trig.vec(-30, 30)), // 6

        new graph.Node(trig.vec(-20, 20)), // 7
        new graph.Node(trig.vec(-25, -5)), // 8
        new graph.Node(trig.vec(-30, 10)), // 9

        new graph.Node(trig.vec(-15, -25)), // 10

        new graph.Node(trig.vec(25, -25)), // 11
        new graph.Node(trig.vec(20, -25)), // 12
        new graph.Node(trig.vec(20, -20)), // 13
        new graph.Node(trig.vec(25, -20)), // 14
        new graph.Node(trig.vec(30, -20)), // 15
        new graph.Node(trig.vec(30, -25)), // 16
        new graph.Node(trig.vec(30, -30)), // 17
        new graph.Node(trig.vec(25, -30)), // 18
    ]

    const edges: graph.Edge[] = [
        graph.connect(nodes[0]!, nodes[1]!),
        graph.connect(nodes[0]!, nodes[2]!),
        graph.connect(nodes[0]!, nodes[3]!),
        graph.connect(nodes[2]!, nodes[4]!),
        graph.connect(nodes[1]!, nodes[5]!),
        graph.connect(nodes[1]!, nodes[6]!),
        graph.connect(nodes[4]!, nodes[5]!),

        graph.connect(nodes[7]!, nodes[8]!),
        graph.connect(nodes[7]!, nodes[9]!),

        graph.connect(nodes[7]!, nodes[12]!),

        graph.connect(nodes[11]!, nodes[12]!),
        graph.connect(nodes[11]!, nodes[13]!),
        graph.connect(nodes[11]!, nodes[14]!),
        graph.connect(nodes[11]!, nodes[15]!),
        graph.connect(nodes[11]!, nodes[16]!),
        graph.connect(nodes[11]!, nodes[17]!),
        graph.connect(nodes[11]!, nodes[18]!),
    ]

    return { nodes, edges }
}

function generateInitialGraph(length: number = 256) {
    const nodes: graph.Node[] = Array.from({ length }, () => new graph.Node(trig.zero()))
    const edges: graph.Edge[] = []

    for (let i = 0; i < length; i++) {
        const node = nodes[i]!

        if (node.edges.length > 0 && Math.random() < 0.8) continue

        let b_index = math.randomInt(length)
        let node_b = nodes[b_index]!

        if (node_b === node) {
            node_b = nodes[(b_index + 1) % length]!
        }

        edges.push(graph.connect(node, node_b))
    }

    return { nodes, edges }
}

export const App: Component = () => {
    // const initialGraph = getInitialGraph()
    const initialGraph = generateInitialGraph(512)
    // const initialGraph = getLAGraph()

    const nodes = s.signal(initialGraph.nodes)
    const edges = s.signal(initialGraph.edges)

    const dragging = s.signal<graph.Node>()
    let container!: HTMLDivElement

    const isDragging = s.selector(dragging)

    function setDragging(node: graph.Node | undefined) {
        if (node === undefined) {
            const node = dragging.value
            if (node === undefined) return
            node.locked = false
            s.set(dragging, undefined)
            return
        }
        node.locked = true
        s.set(dragging, node)
    }

    function handleDragEvent(e: MouseEvent) {
        const node = dragging.value
        if (node === undefined) return

        e.preventDefault()

        const rect = container.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        const pos_x = x * 100 - 50
        const pos_y = 50 - y * 100

        if (
            (pos_x === node.position.x && pos_y === node.position.y) ||
            pos_x < -50 ||
            pos_x > 50 ||
            pos_y < -50 ||
            pos_y > 50
        )
            return

        node.position.x = pos_x
        node.position.y = pos_y

        s.trigger(nodes)
    }

    const start = performance.now()

    const loop = () => {
        s.mutate(nodes, nodes => {
            graph.updateNodePositions(nodes)
        })

        // if (performance.now() - start < 2000) {
        raf = requestAnimationFrame(loop)
        // }
    }
    let raf = requestAnimationFrame(loop)
    onCleanup(() => cancelAnimationFrame(raf))

    return (
        <div
            ref={container}
            class="w-80vw h-80vw m-10vw bg-dark-9 relative overflow-hidden"
            onMouseUp={e => setDragging(undefined)}
            onMouseLeave={e => setDragging(undefined)}
            onMouseMove={handleDragEvent}
        >
            <svg class="absolute w-full h-full">
                {/* <For each={edges.value}>
                    {edge => (
                        <line
                            class="stroke-gray stroke-0.2%"
                            x1={`${(nodes.value, edges.value, edge[0].position.x) + 50}%`}
                            y1={`${50 - (nodes.value, edges.value, edge[0].position.y)}%`}
                            x2={`${(nodes.value, edges.value, edge[1].position.x) + 50}%`}
                            y2={`${50 - (nodes.value, edges.value, edge[1].position.y)}%`}
                        />
                    )}
                </For> */}
                {/* <For each={nodes.value}>
                    {node => (
                        <line
                            class="stroke-violet stroke-0.2%"
                            x1={`${(nodes.value, node.position.x) + 50}%`}
                            y1={`${50 - (nodes.value, node.position.y)}%`}
                            x2={`${(nodes.value, node.position.x + node.velocity.x * 20) + 50}%`}
                            y2={`${50 - (nodes.value, node.position.y + node.velocity.y * 20)}%`}
                        />
                    )}
                </For> */}
            </svg>
            <For each={nodes.value}>
                {node => (
                    <div
                        class={clsx(
                            'absolute top-0 left-0 w-2% h-2% rounded-full -mt-1% -ml-1%',
                            isDragging(node) ? 'bg-cyan' : 'bg-red',
                        )}
                        style={{
                            translate: `calc(${(nodes.value, node.position.x) + 50} * 0.8vw) calc(${
                                50 - (nodes.value, node.position.y)
                            } * 0.8vw) 0.0001px`,
                            'will-change': 'translate',
                        }}
                        onMouseDown={e => {
                            if (dragging.value !== undefined) return

                            setDragging(node)

                            handleDragEvent(e)
                        }}
                    ></div>
                )}
            </For>
        </div>
    )
}
