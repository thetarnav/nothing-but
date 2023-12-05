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
        buf: new Float32Array(64),
        len: 1,
    }

    // for (let i = 0; i < source.buf.length; i += 1) {
    //     source.buf[i] = Math.random() * 200
    // }
    // source.len = source.buf.length

    const EASE_LENGTH = 1024
    const EASE_DENCITY = 64
    const X_SPACING = 0.2

    function yAtEaseIdx(ease_i: number, ease_dencity: number): number {
        const data_i = Math.floor(ease_i / ease_dencity)
        const p = utils.ease.in_out_cubic((ease_i % ease_dencity) / ease_dencity)
        const from = source.buf[data_i]!
        const to = source.buf[data_i + 1]!
        return from + (to - from) * p
    }

    const ANIM_DURATION = 400
    let anim_progress = 0 // 0 -> 1

    let anchor = -1 // follow the last point
    let delta_x = 0
    let scale = 1

    const unsubWheel = utils.event.listener(el, 'wheel', e => {
        scale = utils.num.clamp(scale + e.deltaY / 500, 0.2, 8)
        delta_x -= e.deltaX / 100 / scale
    })
    void s.onCleanup(unsubWheel)

    let last_time = 0
    const loop = utils.raf.makeAnimationLoop(time => {
        const is_data_full = source.len === source.buf.length

        const delta = time - last_time
        last_time = time

        anim_progress = Math.min(anim_progress + delta / ANIM_DURATION, 1)
        const max_progress = source.len - 2 + anim_progress
        const min_progress = is_data_full ? anim_progress : 0

        const ease_dencity = scale * EASE_DENCITY
        const view_points = Math.round(utils.num.clamp(max_progress * ease_dencity, 0, EASE_LENGTH))
        const view_progress = view_points / ease_dencity

        const anchor_progress = anchor < 0 ? max_progress : anchor
        const end_progress = utils.num.clamp(
            anchor_progress - delta_x,
            view_progress + min_progress,
            max_progress,
        )

        delta_x = 0
        anchor = end_progress >= max_progress ? -1 : end_progress

        const start_progress = Math.max(end_progress - view_progress, min_progress)

        const view_end = Math.ceil(end_progress * ease_dencity)
        const view_start = Math.ceil(start_progress * ease_dencity)

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
        ctx.moveTo(0, yAtEaseIdx(view_start, ease_dencity))
        for (let i = view_start; i < view_end; i += 1) {
            ctx.lineTo((i - view_start) * X_SPACING, yAtEaseIdx(i, ease_dencity))
        }
        ctx.stroke()

        /*
            reference points
        */
        ctx.lineWidth = 1
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        for (let i = 0; i < source.len; i += 1) {
            const x = i * ease_dencity * X_SPACING - view_start * X_SPACING
            const y = source.buf[i]!
            ctx.moveTo(x, y)
            ctx.arc(x, y, 2, 0, Math.PI * 2)
        }
        ctx.fill()

        /*
            update data
        */
        if (anim_progress === 1) {
            anim_progress = 0

            const new_value = Math.random() * 200

            if (is_data_full) {
                fixedPushRight(source.buf, new_value)

                if (anchor > 0) {
                    delta_x += 1 // ? maybe it's better to set anchor directly
                }
            } else {
                source.buf[source.len] = new_value
                source.len += 1
            }
        }
    })
    utils.raf.loopStart(loop)
    s.addCleanup(loop, utils.raf.loopClear)

    return <Shell>{el}</Shell>
}

void sweb.render(() => <App />, document.getElementById('root')!)
