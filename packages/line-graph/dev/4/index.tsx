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

type ArrayLike<T> = {
    readonly length: number
    [index: number]: T
}
type ReadonlyArrayLike<T> = {
    readonly length: number
    readonly [index: number]: T
}
type NumArray = ArrayLike<number>
type ReadonlyNumArray = ReadonlyArrayLike<number>

function fixedPushRight<T>(arr: ArrayLike<T>, value: T): void {
    const end = arr.length - 1
    for (let i = 0; i < end; i += 1) {
        arr[i] = arr[i + 1]!
    }
    arr[end] = value
}
function fixedPushLeft<T>(arr: ArrayLike<T>, value: T): void {
    for (let i = arr.length - 1; i > 0; i -= 1) {
        arr[i] = arr[i - 1]!
    }
    arr[0] = value
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
        data: new Float32Array(2048),
        length: 1,
    }

    const EASE_LENGTH = 1024
    const EASE_DENCITY = 64
    const X_SPACING = 0.2

    function yAtEaseIdx(ease_i: number): number {
        const data_i = Math.floor(ease_i / EASE_DENCITY)
        const p = utils.ease.in_out_cubic((ease_i % EASE_DENCITY) / EASE_DENCITY)
        const from = source.data[data_i]!
        const to = source.data[data_i + 1]!
        return from + (to - from) * p
    }

    const ANIM_DURATION = 500
    let anim_progress = 0 // 0 -> 1

    let last_time = 0
    const loop = utils.raf.makeAnimationLoop(time => {
        const delta = time - last_time
        last_time = time

        anim_progress = Math.min(anim_progress + delta / ANIM_DURATION, 1)

        const ease_end = (source.length - 2 + anim_progress) * EASE_DENCITY
        const ease_start = Math.max(ease_end - EASE_LENGTH + EASE_DENCITY, 0)
        const ease_points = ease_end - ease_start

        /*
            clear
            flip y
        */
        ctx.resetTransform()
        ctx.clearRect(0, 0, el.width, el.height)
        ctx.setTransform(1, 0, 0, -1, 300, el.height - 200)

        /*
            draw ease line
        */
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#e50'
        ctx.beginPath()
        ctx.moveTo(0, yAtEaseIdx(ease_start))
        for (let i = 1; i < ease_points; i += 1) {
            ctx.lineTo(i * X_SPACING, yAtEaseIdx(ease_start + i))
        }
        ctx.stroke()

        /*
            reference points
        */
        ctx.lineWidth = 1
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        for (let i = 0; i < source.length; i += 1) {
            const x = i * EASE_DENCITY * X_SPACING - ease_start * X_SPACING
            const y = source.data[i]!
            ctx.moveTo(x, y)
            ctx.arc(x, y, 2, 0, Math.PI * 2)
        }
        ctx.fill()

        /*
            update data
        */
        if (anim_progress === 1) {
            const new_value = Math.random() * 200

            if (source.length === source.data.length) {
                fixedPushRight(source.data, new_value)
            } else {
                source.data[source.length] = new_value
                source.length += 1
            }

            anim_progress = 0
        }
    })
    utils.raf.loopStart(loop)
    s.addCleanup(loop, utils.raf.loopClear)

    return <Shell>{el}</Shell>
}

void sweb.render(() => <App />, document.getElementById('root')!)
