import {Ev} from '@nothing-but/dom'
import * as s from '@nothing-but/solid/signal'
import * as solid from 'solid-js'
import * as fg from '../src/index.js'
import * as init from './init.js'

const Shell: solid.FlowComponent = props => {
    return (
        <div class="min-h-110vh min-w-110vw">
            <div class="w-screen h-screen center-child flex-col">
                <div
                    ref={Ev.preventMobileScrolling}
                    class="relative aspect-3/4 sm:aspect-4/3 w-90vmin m-auto relative overflow-hidden overscroll-none touch-none b b-solid b-red rounded-md"
                >
                    {props.children}
                </div>
            </div>
        </div>
    )
}

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

    const ctx = el.getContext('2d')
    if (!ctx) throw new Error('no context')

    const canvas_state = fg.canvas.canvasState({
        ...fg.canvas.DEFAULT_OPTIONS,
        el: el,
        ctx: ctx,
        graph: force_graph,
        init_scale: 2,
    })

    const frame_iter_limit = fg.anim.frameIterationsLimit()

    let is_active = false
    let alpha = 0 // 0 - 1
    let bump_end = fg.anim.bump(0)

    const loop = fg.anim.animationLoop(time => {
        const iterations = fg.anim.calcIterations(frame_iter_limit, time)

        for (let i = Math.min(iterations, 2); i >= 0; i--) {
            alpha = fg.anim.updateAlpha(alpha, is_active || time < bump_end)
            fg.graph.simulate(force_graph, alpha)
        }

        fg.canvas.drawCanvas(canvas_state)
    })
    fg.anim.loopStart(loop)
    s.addCleanup(loop, fg.anim.loopClear)

    const ro = fg.canvas.resizeObserver(el, size => {
        fg.canvas.updateCanvasSize(canvas_state, size)
    })
    void s.onCleanup(() => ro.disconnect())

    const gestures = fg.canvas.canvasGestures({
        canvas: canvas_state,
        onTranslate() {
            /**/
        },
        onNodeClick(node) {
            // eslint-disable-next-line no-console
            console.log('click', node)
        },
        onNodeHover(node) {
            canvas_state.hovered_node = node
        },
        onNodeDrag(node, pos) {
            fg.graph.changeNodePosition(canvas_state.options.graph.grid, node, pos.x, pos.y)
            bump_end = fg.anim.bump(bump_end)
        },
        onModeChange(mode) {
            is_active = mode === fg.canvas.Mode.DraggingNode
        },
    })
    s.addCleanup(gestures, fg.canvas.cleanupCanvasGestures)

    return <Shell>{el}</Shell>
}
