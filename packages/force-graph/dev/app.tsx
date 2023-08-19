import * as S from '@nothing-but/solid/signal'
import { event } from '@nothing-but/utils'
import { JSX, type Component } from 'solid-js'
import { createCanvasForceGraph, default_canvas_options } from '../src/canvas.js'
import * as FG from '../src/index.js'
import { getLAGraph } from './init.js'

function Shell(props: { children: JSX.Element }): JSX.Element {
    return (
        <div class="min-h-110vh min-w-110vw">
            <div class="w-screen h-screen center-child flex-col">
                <div
                    ref={event.preventMobileScrolling}
                    class="relative aspect-3/4 sm:aspect-4/3 w-90vmin m-auto relative overflow-hidden overscroll-none touch-none b b-solid b-red rounded-md"
                >
                    {props.children}
                </div>
            </div>
        </div>
    )
}

export const graph_options = FG.makeGraphOptions({
    inertia_strength: 0.3,
    link_strength: 0.012,
    origin_strength: 0.01,
    repel_distance: 22,
    repel_strength: 0.5,
})

export const App: Component = () => {
    // const initialGraph = getInitialGraph()
    // const force_graph = generateInitialGraph(1024)
    const force_graph = getLAGraph()

    const change_signal = S.signal()

    const canvas = (<canvas class="absolute w-full h-full" />) as HTMLCanvasElement

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no context')

    const canvas_state = createCanvasForceGraph({
        ...default_canvas_options,
        el: canvas,
        ctx,
        graph: force_graph,
        // init_grid_pos: {
        //     x: force_graph.grid.size / 2,
        //     y: force_graph.grid.size / 2,
        // },
        init_scale: 2,
        trackNodes: () => true,
        onNodeClick: node => {
            console.log('click', node)
        },
    })

    return <Shell>{canvas}</Shell>
}
