import { createSignal, type Component, For, createSelector, createEffect } from 'solid-js'
import { graph, trig } from './lib'
import clsx from 'clsx'

export const App: Component = () => {
    const nodes: graph.GraphNode[] = [
        new graph.GraphNode(new trig.Vector(0, 0)),
        new graph.GraphNode(new trig.Vector(5, 0)),
        new graph.GraphNode(new trig.Vector(35, -10)),
    ]

    const [_track, trigger] = createSignal(undefined, { equals: false })
    const track = <T,>(v: T) => (_track(), v)

    const [dragging, setDragging] = createSignal<graph.GraphNode>()
    let container!: HTMLDivElement

    const isDragging = createSelector(dragging)

    return (
        <div
            ref={container}
            class="w-80vw h-80vw m-10vw bg-dark-9 relative"
            onMouseUp={e => {
                e.preventDefault()
                setDragging()
            }}
            onMouseLeave={e => {
                e.preventDefault()
                setDragging()
            }}
            onMouseMove={e => {
                e.preventDefault()

                const draggingNode = dragging()

                if (draggingNode === undefined) return

                const rect = container.getBoundingClientRect()
                const x = (e.clientX - rect.left) / rect.width
                const y = (e.clientY - rect.top) / rect.height
                draggingNode.position.x = x * 100 - 50
                draggingNode.position.y = 50 - y * 100

                trigger()
            }}
        >
            <For each={track(nodes)}>
                {node => (
                    <div
                        class={clsx(
                            'absolute w-5 h-5 rounded-full -mt-2.5 -ml-2.5',
                            isDragging(node) ? 'bg-cyan' : 'bg-red',
                        )}
                        style={{
                            left: `${track(node.position.x) + 50}%`,
                            top: `${50 - track(node.position.y)}%`,
                        }}
                        onMouseDown={e => {
                            if (dragging() !== undefined) return
                            e.preventDefault()
                            setDragging(node)
                        }}
                    ></div>
                )}
            </For>
        </div>
    )
}
