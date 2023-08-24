import {Ev} from '@nothing-but/dom'
import * as S from '@nothing-but/solid/signal'
import {type Component, type JSX} from 'solid-js'
import {Anim, Canvas, Graph} from '../src/index.js'
import {getLAGraph} from './init.js'

function Shell(props: {children: JSX.Element}): JSX.Element {
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

export const graph_options = Graph.graphOptions({
    inertia_strength: 0.3,
    origin_strength: 0.01,
    repel_distance: 22,
    repel_strength: 0.5,
})

export const App: Component = () => {
    // const initialGraph = getInitialGraph()
    // const force_graph = generateInitialGraph(1024)
    const graph = getLAGraph()

    const change_signal = S.signal()

    const el = (<canvas class="absolute w-full h-full" />) as HTMLCanvasElement

    const ctx = el.getContext('2d')
    if (!ctx) throw new Error('no context')

    const canvas = Canvas.canvasState({
        ...Canvas.default_options,
        el,
        ctx,
        graph,
        init_scale: 2,
        onNodeClick: node => {
            console.log('click', node)
        },
    })

    const removeObserver = Canvas.canvasResizeObserver(el, size => {
        Canvas.updateCanvasSize(canvas, size)
    })

    const animation = Anim.frameAnimation({
        ...Anim.default_options,
        onIteration(alpha) {
            Graph.simulate(graph, alpha)
        },
        onFrame() {
            Canvas.drawCanvas(canvas)
        },
    })

    Anim.start(animation)

    // const canvas_state = createCanvasForceGraph({
    //     ...default_canvas_options,
    //     el: canvas,
    //     ctx,
    //     graph: force_graph,
    //     // init_grid_pos: {
    //     //     x: force_graph.grid.size / 2,
    //     //     y: force_graph.grid.size / 2,
    //     // },
    //     init_scale: 2,
    //     onNodeClick: node => {
    //         console.log('click', node)
    //     },
    // })

    return <Shell>{el}</Shell>
}
