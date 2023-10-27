import {Ev} from '@nothing-but/dom'
import * as S from '@nothing-but/solid/signal'
import * as solid from 'solid-js'
import * as fg from '../src/index.js'
import * as init from './init.js'

function Shell(props: {children: solid.JSX.Element}): solid.JSX.Element {
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

export const graph_options = fg.graph.graphOptions({
    inertia_strength: 0.3,
    origin_strength: 0.01,
    repel_distance: 22,
    repel_strength: 0.5,
})

export const App: solid.Component = () => {
    // const initialGraph = getInitialGraph()
    // const force_graph = generateInitialGraph(1024)
    const force_graph = init.getLA2Graph()

    const change_signal = S.signal()

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

    const animation = fg.anim.frameAnimation({
        ...fg.anim.DEFAULT_OPTIONS,
        onIteration(alpha) {
            fg.graph.simulate(force_graph, alpha)
        },
        onFrame() {
            fg.canvas.drawCanvas(canvas_state)
        },
    })
    fg.anim.bump(animation)
    solid.onCleanup(() => fg.anim.cleanup(animation))

    const ro = fg.canvas.resizeObserver(el, size => {
        fg.canvas.updateCanvasSize(canvas_state, size)
        fg.anim.requestFrame(animation)
    })
    solid.onCleanup(() => ro.disconnect())

    const gestures = fg.canvas.canvasGestures({
        canvas: canvas_state,
        onTranslate() {
            fg.anim.requestFrame(animation)
        },
        onNodeClick(node) {
            console.log('click', node)
        },
        onNodeHover(node) {
            canvas_state.hovered_node = node
        },
        onNodeDrag(node, pos) {
            fg.graph.changeNodePosition(canvas_state.options.graph.grid, node, pos.x, pos.y)
            fg.anim.requestFrame(animation)
        },
        onModeChange(mode) {
            if (mode === fg.canvas.Mode.DraggingNode) {
                fg.anim.start(animation)
            } else {
                fg.anim.pause(animation)
            }
        },
    })
    solid.onCleanup(() => fg.canvas.cleanupCanvasGestures(gestures))

    return <Shell>{el}</Shell>
}
