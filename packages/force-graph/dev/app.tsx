import * as s from "@nothing-but/solid/signal"
import * as utils from "@nothing-but/utils"
import * as solid from "solid-js"
import * as fg from "../src/index.js"
import * as init from "./init.js"

export const graph_options: fg.graph.Options = {
	...fg.graph.DEFAULT_OPTIONS,
	inertia_strength: 0.3,
	origin_strength: 0.01,
	repel_distance: 22,
	repel_strength: 0.5,
}

export const App: solid.Component = () => {
	// const initialGraph = getInitialGraph()
	// const force_graph = generateInitialGraph(1024)
	const force_graph = init.getLA2Graph()

	const el = (<canvas class="absolute w-full h-full" />) as HTMLCanvasElement

	const ctx = el.getContext("2d")
	if (!ctx) throw new Error("no context")

	const canvas_state = fg.canvas.canvasState({
		...fg.canvas.DEFAULT_OPTIONS,
		ctx: ctx,
		graph: force_graph,
		init_scale: 2,
	})

	const frame_iter_limit = utils.raf.frameIterationsLimit()

	let alpha = 0 // 0 - 1
	let bump_end = utils.raf.bump(0)

	const loop = utils.raf.makeAnimationLoop(time => {
		const iterations = utils.raf.calcIterations(frame_iter_limit, time)
		const is_active = gestures.mode.type === fg.canvas.Mode.DraggingNode || time < bump_end

		for (let i = Math.min(iterations, 2); i >= 0; i--) {
			alpha = utils.raf.updateAlpha(alpha, is_active)
			fg.graph.simulate(force_graph, alpha)
		}

		fg.canvas.drawCanvas(canvas_state)
	})
	utils.raf.loopStart(loop)
	s.addCleanup(loop, utils.raf.loopClear)

	const ro = new ResizeObserver(() => {
		const changed = utils.canvas.resizeCanvasToDisplaySize(el)
		if (changed) {
			fg.canvas.updateTranslate(canvas_state,
				canvas_state.translate.x,
				canvas_state.translate.y,
			)
		}
	})
	ro.observe(el)
	void s.onCleanup(() => ro.disconnect())

	const gestures = fg.canvas.canvasGestures({
		canvas: canvas_state,
		onGesture(e) {
			// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
			switch (e.type) {
			case fg.canvas.GestureEventType.NodeDrag: {
				fg.graph.set_position(canvas_state.graph, e.node, e.pos)
				break
			}
			case fg.canvas.GestureEventType.NodeClick: {
				// eslint-disable-next-line no-console
				console.log("click", e.node)
				break
			}
			}
		},
	})
	s.addCleanup(gestures, fg.canvas.cleanupCanvasGestures)

	return <>
		<Shell>{el}</Shell>
		<button
			class="absolute top-0 right-0"
			onClick={() => (bump_end = utils.raf.bump(bump_end))}
		>
			bump
		</button>
	</>
}

const Shell: solid.FlowComponent = props => {
	return (
		<div class="min-h-110vh min-w-110vw">
			<div class="w-screen h-screen center-child flex-col">
				<div
					ref={utils.event.preventMobileScrolling}
					class="relative aspect-3/4 sm:aspect-4/3 w-90vmin m-auto relative overflow-hidden overscroll-none touch-none b b-solid b-red rounded-md"
				>
					{props.children}
				</div>
			</div>
		</div>
	)
}
