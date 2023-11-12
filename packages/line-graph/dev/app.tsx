import {Ev} from '@nothing-but/dom'
import * as solid from 'solid-js'

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

export const App: solid.Component = () => {
    const el = (<canvas class="absolute w-full h-full" />) as HTMLCanvasElement

    const ctx = el.getContext('2d')
    if (!ctx) throw new Error('no context')

    return <Shell>{el}</Shell>
}
