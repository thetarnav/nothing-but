/*

TODO

- [x] Drag to pan
    - [ ] handle drag outside of canvas
    - [ ] momentum
    - [ ] fix glitches when dragging to the beginning or end
    - [ ] fix glitches with data-points moving
- [x] Scale to mouse position
- [ ] Reduce number of points when zoomed out


*/

import '../index.jsx' // setup

import {signal as s} from '@nothing-but/solid'
import * as utils from '@nothing-but/utils'
import * as solid from 'solid-js'
import * as sweb from 'solid-js/web'

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

interface ElementResizeState {
    /**
     * Canvas was resized since last check.
     * Set it to `false` to reset.
     */
    resized: boolean
    canvas: HTMLElement
    observer: ResizeObserver
    width: number
    height: number
}
function getCanvasDisplaySize(canvas: HTMLCanvasElement): {width: number; height: number} {
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio
    return {
        width: Math.round(rect.width * dpr),
        height: Math.round(rect.height * dpr),
    }
}
function makeElementResizeState(el: HTMLElement): ElementResizeState {
    const rect = el.getBoundingClientRect()

    const data: ElementResizeState = {
        resized: true,
        canvas: el,
        observer: new ResizeObserver(() => {
            const rect = el.getBoundingClientRect()
            const width = Math.round(rect.width)
            const height = Math.round(rect.height)

            if (data.width !== width || data.height !== height) {
                data.width = width
                data.height = height
                data.resized = true
            }
        }),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
    }
    data.observer.observe(el)

    return data
}
function cleanCanvasResizeObserver(data: ElementResizeState): void {
    data.observer.disconnect()
}
function createElementResizeState(el: HTMLElement): ElementResizeState {
    const state = makeElementResizeState(el)
    utils.lifecycle.onCleanup(() => cleanCanvasResizeObserver(state))
    return state
}

export const App: solid.Component = () => {
    const el = (<canvas class="absolute w-full h-full" />) as HTMLCanvasElement

    const ctx = el.getContext('2d')
    if (!ctx) throw new Error('2d context is not supported')

    const dpr = window.devicePixelRatio
    const ro = createElementResizeState(el)

    let wheel_delta_x = 0
    let wheel_delta_y = 0
    utils.event.createListener(el, 'wheel', e => {
        wheel_delta_x += e.deltaX
        wheel_delta_y += e.deltaY
    })

    let mouse_x = 0
    utils.event.createListener(el, 'mousemove', e => {
        mouse_x = e.offsetX
    })

    let mousedown = false
    utils.event.createListener(el, 'mousedown', () => {
        mousedown = true
    })

    utils.event.createListener(el, 'mouseup', () => {
        mousedown = false
    })

    /* input data */
    const source = {
        buf: new Float32Array(256),
        len: 1,
    }

    for (let i = 0; i < source.buf.length; i += 1) {
        source.buf[i] = Math.random() * 200
    }
    source.len = source.buf.length

    const EASE_DENCITY = 32 // ease points between data points
    const X_SPACING = 0.4 // px between points
    const MARGIN = 20 // px

    const yAtProgress = (progress: number): number => {
        const data_i = Math.floor(progress)
        const p = utils.ease.in_out_cubic(progress - data_i)
        const from = source.buf[data_i]!
        const to = source.buf[data_i + 1]!
        return from + (to - from) * p
    }

    const ANIM_DURATION = 400
    let anim_progress = 0 // 0 -> 1

    let anchor = -1 // follow the last point
    let scale = 1

    let last_mouse_progress = 0
    let last_time = 0
    let mousedown_handled = false

    const frame = (time: number): void => {
        const is_data_full = source.len === source.buf.length

        const delta = time - last_time
        last_time = time
        anim_progress = Math.min(anim_progress + delta / ANIM_DURATION, 1)

        const drawable_width = ro.width - MARGIN * 2
        const drawable_points = drawable_width / X_SPACING

        const mouse_p = (mouse_x - MARGIN) / drawable_width

        const len_progress = source.len - 1 + anim_progress
        const max_progress = len_progress - 1
        const min_progress = is_data_full ? anim_progress : 0

        const prev_scale = scale
        scale = utils.num.clamp(scale - wheel_delta_y / 500, 0.5, 8)
        const ease_dencity = scale * EASE_DENCITY

        const delta_progress = wheel_delta_x / 20 / scale
        wheel_delta_x = 0
        wheel_delta_y = 0

        const view_points = Math.round(
            utils.num.clamp(max_progress * ease_dencity, 0, drawable_points),
        )
        const view_progress = view_points / ease_dencity

        const anchor_progress = anchor < 0 ? len_progress + anchor : anchor
        const end_progress = utils.num.clamp(
            anchor_progress - delta_progress,
            view_progress + min_progress,
            max_progress,
        )
        anchor = end_progress >= max_progress - EASE_DENCITY / 8 ? -1 : end_progress

        /* correct for when both start and end are visible, when zoomed out */
        const start_progress = Math.max(end_progress - view_progress, min_progress)

        const mouse_progress = start_progress + mouse_p * (end_progress - start_progress)
        if (prev_scale !== scale) {
            anchor -= mouse_progress - last_mouse_progress
            frame(time) // need view pos after applied scale, and then to change it
            return
        }
        if (mousedown && !mousedown_handled) {
            mousedown_handled = true
            const new_anchor = anchor - mouse_progress + last_mouse_progress
            anchor = anchor < 0 ? Math.min(new_anchor, -1) : Math.max(new_anchor, 0)
            frame(time) // I've lost my way
            return
        }
        mousedown_handled = false
        last_mouse_progress = mouse_progress

        const view_end = Math.floor(end_progress * ease_dencity)
        const view_start = Math.floor(start_progress * ease_dencity)

        /*
            clear
            flip y
        */
        if (ro.resized) {
            ro.resized = false
            const ds = getCanvasDisplaySize(el)
            el.width = ds.width
            el.height = ds.height
        }
        ctx.resetTransform()
        ctx.clearRect(0, 0, el.width, el.height)
        ctx.setTransform(dpr, 0, 0, -dpr, 0, el.height - 200)

        /*
            draw ease line
        */
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#e50'
        ctx.beginPath()
        ctx.moveTo(MARGIN, yAtProgress(view_start / ease_dencity))
        for (let i = view_start; i < view_end; i += 1) {
            ctx.lineTo(MARGIN + (i - view_start) * X_SPACING, yAtProgress(i / ease_dencity))
        }
        ctx.stroke()

        /*
            update data
        */
        if (anim_progress === 1) {
            anim_progress = 0

            const new_value = Math.random() * 200

            if (is_data_full) {
                fixedPushRight(source.buf, new_value)

                if (anchor > 0) {
                    anchor -= 1
                    last_mouse_progress -= 1
                }
            } else {
                source.buf[source.len] = new_value
                source.len += 1
            }
        }
    }

    const loop = utils.raf.makeAnimationLoop(frame)
    utils.raf.loopStart(loop)
    s.addCleanup(loop, utils.raf.loopClear)

    return (
        <div class="min-h-100vh min-w-100vw">
            <div class="w-screen h-screen center-child flex-col">
                <div
                    ref={utils.event.preventMobileScrolling}
                    class="relative h-80vh w-90vw m-auto relative overflow-hidden overscroll-none touch-none b b-solid b-red rounded-md"
                >
                    {el}
                </div>
            </div>
        </div>
    )
}

void sweb.render(() => <App />, document.getElementById('root')!)
