import { createSignal, type Component, For, createSelector } from 'solid-js'
import { graph, s, trig } from './lib'
import clsx from 'clsx'

export const App: Component = () => {
    const nodes = s.signal<graph.Node[]>([
        new graph.Node(trig.vec(0, 0)),
        new graph.Node(trig.vec(0, 20)),
        new graph.Node(trig.vec(20, 0)),
        new graph.Node(trig.vec(-20, -15)),
        new graph.Node(trig.vec(35, -10)),
        new graph.Node(trig.vec(15, 40)),
    ])

    const trackNodes = <T,>(v: T) => (nodes.get(), v)

    const edges = s.signal<graph.Edge[]>([
        graph.connect(nodes.value[0]!, nodes.value[1]!),
        graph.connect(nodes.value[0]!, nodes.value[2]!),
        graph.connect(nodes.value[0]!, nodes.value[3]!),
        graph.connect(nodes.value[2]!, nodes.value[4]!),
        graph.connect(nodes.value[1]!, nodes.value[5]!),
    ])

    const dragging = s.signal<graph.Node>()
    let container!: HTMLDivElement

    const isDragging = s.selector(dragging)

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

    return (
        <div
            ref={container}
            class="w-80vw h-80vw m-10vw bg-dark-9 relative"
            onMouseUp={e => s.set(dragging, undefined)}
            onMouseLeave={e => s.set(dragging, undefined)}
            onMouseMove={handleDragEvent}
        >
            <svg class="absolute w-full h-full">
                <For each={edges.value}>
                    {edge => (
                        <line
                            class="stroke-current stroke-cyan"
                            x1={`${(nodes.value, edges.value, edge.a.position.x) + 50}%`}
                            y1={`${50 - (nodes.value, edges.value, edge.a.position.y)}%`}
                            x2={`${(nodes.value, edges.value, edge.b.position.x) + 50}%`}
                            y2={`${50 - (nodes.value, edges.value, edge.b.position.y)}%`}
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

                            s.set(dragging, node)

                            handleDragEvent(e)
                        }}
                    ></div>
                )}
            </For>
        </div>
    )
}
