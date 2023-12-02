import {signal as s} from '@nothing-but/solid'
import * as utils from '@nothing-but/utils'
import * as solid from 'solid-js'
import * as sweb from 'solid-js/web'

const Shell: solid.FlowComponent = props => {
    return (
        <div class="min-h-100vh min-w-100vw">
            <div class="w-screen h-screen center-child flex-col">
                <div
                    ref={utils.event.preventMobileScrolling}
                    class="relative h-80vh w-90vw m-auto relative overflow-hidden overscroll-none touch-none b b-solid b-red rounded-md"
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
    if (!ctx) throw new Error('2d context is not supported')

    /*
    Update the canvas's size to match the size it's displayed.
    */
    const ro = utils.canvas.makeCanvasResizeObserver(el)
    s.addCleanup(ro, utils.canvas.cleanCanvasResizeObserver)

    /* input data */
    const source = {
        points: new Float32Array(2048),
        length: 1,
        start: -1, // -1 follow end of array
    }

    const interval = setInterval(() => {
        source.points[source.length] = Math.random() * 200
        source.length += 1
    }, 1000)
    s.addCleanup(interval, clearInterval)

    const loop = utils.raf.makeAnimationLoop(() => {
        /*
            clear
            flip y
        */
        ctx.resetTransform()
        ctx.clearRect(0, 0, el.width, el.height)
        ctx.setTransform(1, 0, 0, -1, 200, el.height - 200)

        const points_count = Math.min(source.length, 64)

        const start = source.start > 0 ? source.start : source.length - points_count
        const end = start + points_count

        const points = source.points.slice(start, end)

        const x_spacing = 12

        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#e50'
        ctx.beginPath()
        let prev_y = points[0]!
        ctx.moveTo(0, prev_y)
        for (let i = 0; i < points_count; i += 1) {
            const x = (i + 1) * x_spacing
            const y = points[i]!
            // prettier-ignore
            ctx.bezierCurveTo(
                x - x_spacing * .6, prev_y,
                x - x_spacing * .4, y,
                x,                  y,
            )
            prev_y = y
        }
        ctx.stroke()
    })
    utils.raf.loopStart(loop)
    s.addCleanup(loop, utils.raf.loopClear)

    return <Shell>{el}</Shell>
}

void sweb.render(() => <App />, document.getElementById('root')!)
