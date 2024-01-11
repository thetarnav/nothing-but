import {resolveElements} from "@solid-primitives/refs"
import {createRootPool, type RootPoolFactory} from "@solid-primitives/rootless"
import {createEffect, createMemo, createSignal, onCleanup, onMount, type JSX} from "solid-js"
import {Anim, Graph} from "../src/index.js"

export function SvgForceGraph(props: {
	graph: Graph.Graph
	node: RootPoolFactory<Graph.Node, JSX.Element>
	active?: boolean
	targetFPS?: number
}): JSX.Element {
	const isActive = "active" in props ? () => props.active : () => false

	const useNodeEl = createRootPool(props.node)
	const nodeEls = resolveElements(() => props.graph.nodes.map(useNodeEl)).toArray

	const useLine = createRootPool(
		() => (<line class="stroke-cyan-7/25 stroke-0.1%" />) as SVGLineElement,
	)
	const lines = createMemo(() => props.graph.edges.map(useLine))

	const posToP = (xy: number, grid_size: number) => ((xy + grid_size / 2) / grid_size) * 100 + "%"

	function updateElements() {
		const els = nodeEls(),
			line_els = lines(),
			{nodes, edges, options} = props.graph,
			{grid_size} = options

		for (let i = 0; i < edges.length; i++) {
			const {a, b} = edges[i]!
			const line = line_els[i]!

			if (a.moved) {
				line.x1.baseVal.valueAsString = posToP(a.position.x, grid_size)
				line.y1.baseVal.valueAsString = posToP(a.position.y, grid_size)
			}

			if (b.moved) {
				line.x2.baseVal.valueAsString = posToP(b.position.x, grid_size)
				line.y2.baseVal.valueAsString = posToP(b.position.y, grid_size)
			}
		}

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i]!

			if (!node.moved) continue

			const {x, y} = node.position
			const el = els[i]! as HTMLElement

			el.style.left = posToP(x, grid_size)
			el.style.top = posToP(y, grid_size)

			node.moved = false
		}
	}

	onMount(() => {
		const animation = Anim.frameAnimation(props.graph, updateElements, props.targetFPS ?? 44)

		const init = createMemo(() => {
			props.graph // track graph prop

			const [init, setInit] = createSignal(true)
			const timeout = setTimeout(() => setInit(false), 2000)
			onCleanup(() => clearTimeout(timeout))

			return init
		})

		updateElements()

		createEffect(() => {
			if (isActive() || init()()) {
				Anim.start(animation)
			} else {
				Anim.pause(animation)
			}
		})

		onCleanup(() => {
			Anim.cleanup(animation)
		})
	})

	return (
		<>
			<svg class="absolute w-full h-full">{lines()}</svg>
			{nodeEls()}
		</>
	)
}

/* <div
                    class="absolute inset-0"
                    style={{
                        transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`,
                    }}
                >
                    <SvgForceGraph
                        graph={force_graph}
                        active={state.type === StateType.Dragging}
                        targetFPS={TARGET_FPS}
                        node={node => (
                            <div
                                class={clsx(
                                    'absolute w-0 h-0',
                                    'center-child leading-100% text-center select-none cursor-move',
                                    isDraggingNode(node()) ? 'text-cyan' : 'text-white',
                                )}
                                style={{
                                    'will-change': 'top, left',
                                    'font-size': `calc(0.45vmin + 0.5vmin * ${edgesMod(node())})`,
                                    '--un-text-opacity': 0.6 + (edgesMod(node()) / 10) * 4,
                                }}
                                on:pointerdown={e => {
                                    const state_val = state()

                                    if (e.button !== 0 || state_val.type !== StateType.Default) {
                                        return
                                    }

                                    state_val.to(StateType.Dragging, { node: node(), e })
                                }}
                            >
                                {(change_signal.value, node().key)}
                            </div>
                        )}
                    />
                </div> */
