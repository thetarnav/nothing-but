import { type Component, For, onCleanup } from 'solid-js'
import { graph, s } from '../../packages/core/src'
import clsx from 'clsx'
import { generateInitialGraph } from './init'

export const App: Component = () => {
    // const initialGraph = getInitialGraph()
    const force_graph = generateInitialGraph(256)
    // const initialGraph = getLAGraph()

    const signal = s.signal(force_graph)

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

        s.trigger(signal)
    }

    const start = performance.now()

    const loop = () => {
        graph.updateNodePositions(force_graph)

        s.trigger(signal)

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
                <For each={signal.value.edges}>
                    {edge => (
                        <line
                            class="stroke-gray stroke-0.2%"
                            x1={`${(signal.value, edge[0].position.x) + 50}%`}
                            y1={`${50 - (signal.value, edge[0].position.y)}%`}
                            x2={`${(signal.value, edge[1].position.x) + 50}%`}
                            y2={`${50 - (signal.value, edge[1].position.y)}%`}
                        />
                    )}
                </For>
                {/* <For each={signal.value.nodes}>
                    {node => (
                        <line
                            class="stroke-violet stroke-0.2%"
                            x1={`${(signal.value, node.position.x) + 50}%`}
                            y1={`${50 - (signal.value, node.position.y)}%`}
                            x2={`${(signal.value, node.position.x + node.velocity.x * 20) + 50}%`}
                            y2={`${50 - (signal.value, node.position.y + node.velocity.y * 20)}%`}
                        />
                    )}
                </For> */}
            </svg>
            <For each={signal.value.nodes}>
                {node => (
                    <div
                        class={clsx(
                            'absolute top-0 left-0 w-2% h-2% rounded-full -mt-1% -ml-1%',
                            isDragging(node) ? 'bg-cyan' : 'bg-red',
                        )}
                        style={{
                            translate: `calc(${
                                (signal.value, node.position.x) + 50
                            } * 0.8vw) calc(${
                                50 - (signal.value, node.position.y)
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
