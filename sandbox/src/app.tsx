import { type Component, For, onCleanup } from 'solid-js'
import { graph, s, trig } from './lib'
import clsx from 'clsx'

export const App: Component = () => {
    const nodes = s.signal<graph.Node[]>([
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
    ])

    const edges = s.signal<graph.Edge[]>([
        graph.connect(nodes.value[0]!, nodes.value[1]!),
        graph.connect(nodes.value[0]!, nodes.value[2]!),
        graph.connect(nodes.value[0]!, nodes.value[3]!),
        graph.connect(nodes.value[2]!, nodes.value[4]!),
        graph.connect(nodes.value[1]!, nodes.value[5]!),
        graph.connect(nodes.value[1]!, nodes.value[6]!),
        graph.connect(nodes.value[4]!, nodes.value[5]!),

        graph.connect(nodes.value[7]!, nodes.value[8]!),
        graph.connect(nodes.value[7]!, nodes.value[9]!),

        graph.connect(nodes.value[7]!, nodes.value[12]!),

        graph.connect(nodes.value[11]!, nodes.value[12]!),
        graph.connect(nodes.value[11]!, nodes.value[13]!),
        graph.connect(nodes.value[11]!, nodes.value[14]!),
        graph.connect(nodes.value[11]!, nodes.value[15]!),
        graph.connect(nodes.value[11]!, nodes.value[16]!),
        graph.connect(nodes.value[11]!, nodes.value[17]!),
        graph.connect(nodes.value[11]!, nodes.value[18]!),
    ])

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

    const loop = () => {
        s.mutate(nodes, nodes => {
            graph.updateNodePositions(nodes)
        })

        raf = requestAnimationFrame(loop)
    }
    let raf = requestAnimationFrame(loop)
    onCleanup(() => cancelAnimationFrame(raf))

    return (
        <div
            ref={container}
            class="w-80vw h-80vw m-10vw bg-dark-9 relative"
            onMouseUp={e => setDragging(undefined)}
            onMouseLeave={e => setDragging(undefined)}
            onMouseMove={handleDragEvent}
        >
            <svg class="absolute w-full h-full">
                <For each={edges.value}>
                    {edge => (
                        <line
                            class="stroke-cyan stroke-0.2%"
                            x1={`${(nodes.value, edges.value, edge[0].position.x) + 50}%`}
                            y1={`${50 - (nodes.value, edges.value, edge[0].position.y)}%`}
                            x2={`${(nodes.value, edges.value, edge[1].position.x) + 50}%`}
                            y2={`${50 - (nodes.value, edges.value, edge[1].position.y)}%`}
                        />
                    )}
                </For>
            </svg>
            <For each={nodes.value}>
                {node => (
                    <div
                        class={clsx(
                            'absolute w-5 h-5 rounded-full -mt-2.5 -ml-2.5',
                            isDragging(node) ? 'bg-cyan' : 'bg-red',
                        )}
                        style={{
                            left: `${(nodes.value, node.position.x) + 50}%`,
                            top: `${50 - (nodes.value, node.position.y)}%`,
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
