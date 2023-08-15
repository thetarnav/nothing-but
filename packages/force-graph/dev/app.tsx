import * as S from '@nothing-but/solid/signal'
import { event } from '@nothing-but/utils'
import { type Component } from 'solid-js'
import * as FG from '../src/index.js'
import { CanvasForceGraph } from './display-canvas.jsx'
import { getLAGraph } from './init.js'

const TARGET_FPS = 44
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

    let container!: HTMLDivElement
    return (
        <div class="min-h-110vh min-w-110vw center-child flex-col overflow-hidden">
            <div
                ref={el => {
                    container = el
                    event.preventMobileScrolling(container)
                }}
                class="relative w-90vmin h-90vmin m-auto bg-dark-9 relative overflow-hidden overscroll-none touch-none"
            >
                <CanvasForceGraph
                    graph={force_graph}
                    targetFPS={TARGET_FPS}
                    trackNodes={change_signal.read}
                />
            </div>
        </div>
    )
}
