/*

Smooth dragging

- [ ] multiple pointers
- [x] initial smooth move to center
- [x] momentum
- [x] predict pointer position

*/

import {signal as s} from "@nothing-but/solid"
import * as utils from "@nothing-but/utils"
import * as solid from "solid-js"
import * as sweb from "solid-js/web"

interface ArrayLike<T> {
    readonly length: number
    [index: number]: T
}
interface ReadonlyArrayLike<T> {
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
function getCanvasDisplaySize(canvas: HTMLCanvasElement): utils.T.Position {
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio
    return {
        x: Math.round(rect.width * dpr),
        y: Math.round(rect.height * dpr),
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

// type DragPosition = {
//     x: number
//     y: number
//     down: boolean
// }

// function handlePointerDownEvent(gesture: DragPosition, e: PointerEvent): void {
//     gesture.down = true
//     gesture.x = e.offsetX
//     gesture.y = e.offsetY
// }

// type Cleanup = () => void

// function addDragListeners(target: HTMLElement, gesture: DragPosition): Cleanup {
//     const unsub1 = utils.event.listener(target, "pointerdown", e => {})
//     const unsub2 = utils.event.listener(document, "pointermove", e => {})
//     const unsub3 = utils.event.listener(document, "pointerup", e => {})
//     const unsub4 = utils.event.listener(document, "pointercancel", e => {})
//     const unsub5 = utils.event.listener(document, "contextmenu", e => {})
//     return () => {
//         unsub1()
//         unsub2()
//         unsub3()
//         unsub4()
//         unsub5()
//     }
// }

export const App: solid.Component = () => {
    const el = (<canvas class="absolute w-full h-full" />) as HTMLCanvasElement

    const ctx = el.getContext("2d")
    if (!ctx) throw new Error("2d context is not supported")

    const dpr = window.devicePixelRatio
    const ro = createElementResizeState(el)

    let last_rect_x = 0
    let last_rect_y = 0

    let box_x = 100
    let box_y = 100
    let momentum_x = 0
    let momentum_y = 0

    let pointer_x = box_x
    let pointer_y = box_y
    let last_pointer_x = box_x
    let last_pointer_y = box_y

    let pointer_down = false

    const BOX_SIZE = 40
    const HALF_BOX_SIZE = BOX_SIZE / 2

    const INERTIA_STRENGTH = 0.3
    const DECAY_STRENGTH = 0.5

    function updatePointer(x: number, y: number): void {
        pointer_x = x
        pointer_y = y
    }
    function updateLastRect(rect: DOMRect): void {
        last_rect_x = rect.x
        last_rect_y = rect.y
    }
    function handlePointerUp(): void {
        pointer_down = false
        last_pointer_x = pointer_x
        last_pointer_y = pointer_y
    }

    utils.event.createListener(el, "pointerdown", e => {
        e.preventDefault()

        const x = e.offsetX
        const y = e.offsetY
        if (
            x < box_x - HALF_BOX_SIZE ||
            x > box_x + HALF_BOX_SIZE ||
            y < box_y - HALF_BOX_SIZE ||
            y > box_y + HALF_BOX_SIZE
        ) {
            return
        }

        updatePointer(x, y)
        updateLastRect(el.getBoundingClientRect())
        pointer_down = true
    })
    utils.event.createListener(document, "pointermove", e => {
        if (!pointer_down) return
        const rect = el.getBoundingClientRect()
        updatePointer(e.clientX - rect.left, e.clientY - rect.top)
        updateLastRect(rect)
    })
    utils.event.createListener(document, "scroll", () => {
        if (!pointer_down) return
        const rect = el.getBoundingClientRect()
        updatePointer(pointer_x + last_rect_x - rect.x, pointer_y + last_rect_y - rect.y)
        updateLastRect(rect)
    })
    utils.event.createListener(document, "pointerup", handlePointerUp)
    utils.event.createListener(document, "pointercancel", handlePointerUp)
    utils.event.createListener(document, "contextmenu", handlePointerUp)

    let last_pointer_angle = 0
    let last_pointer_delta = 0

    const frame = (): void => {
        const pointer_delta_x = pointer_x - last_pointer_x
        const pointer_delta_y = pointer_y - last_pointer_y

        const pointer_delta = Math.sqrt(pointer_delta_x ** 2 + pointer_delta_y ** 2)
        const speed_change = Math.min(last_pointer_delta / pointer_delta, 1.2) || 0

        const pointer_angle = Math.atan2(pointer_delta_y, pointer_delta_x)
        const pointer_angle_delta =
            Math.sign(pointer_angle) === Math.sign(last_pointer_angle)
                ? pointer_angle - last_pointer_angle
                : pointer_angle + last_pointer_angle
        const guessed_angle = pointer_angle + pointer_angle_delta * speed_change

        last_pointer_y = pointer_y
        last_pointer_x = pointer_x
        last_pointer_delta = pointer_delta
        last_pointer_angle = pointer_angle

        const guessed_pointer_x = pointer_x + Math.cos(guessed_angle) * pointer_delta
        const guessed_pointer_y = pointer_y + Math.sin(guessed_angle) * pointer_delta

        momentum_x *= 0.6
        momentum_y *= 0.6
        momentum_x += (guessed_pointer_x - box_x) * 0.2
        momentum_y += (guessed_pointer_y - box_y) * 0.2
        box_x += momentum_x
        box_y += momentum_y

        /* resize */
        if (ro.resized) {
            ro.resized = false
            const ds = getCanvasDisplaySize(el)
            el.width = ds.x
            el.height = ds.y
        }
        /* clear */
        ctx.resetTransform()
        ctx.clearRect(0, 0, el.width, el.height)
        /* scale to device pixel ratio, so 1 ctx unit is 1 px */
        ctx.scale(dpr, dpr)

        /*
        draw a box
        */
        ctx.fillStyle = "gray"
        ctx.fillRect(box_x - HALF_BOX_SIZE, box_y - HALF_BOX_SIZE, BOX_SIZE, BOX_SIZE)

        /*
        momentum indicator
        */
        ctx.strokeStyle = "blue"
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(box_x, box_y)
        ctx.lineTo(box_x - momentum_x, box_y - momentum_y)
        ctx.stroke()

        // ctx.fillStyle = "gray"
        // ctx.beginPath()
        // ctx.arc(box_x, box_y, 4, 0, Math.PI * 2)
        // ctx.fill()
        // ctx.strokeStyle = "gray"
        // ctx.lineWidth = 1
        // ctx.beginPath()
        // ctx.moveTo(pointer_x, pointer_y)
        // ctx.lineTo(box_x, box_y)
        // ctx.stroke()

        // ctx.fillStyle = "pink"
        // ctx.beginPath()
        // ctx.arc(old_guessed_pointer_x, old_guessed_pointer_y, 4, 0, Math.PI * 2)
        // ctx.fill()
        // ctx.strokeStyle = "pink"
        // ctx.lineWidth = 1
        // ctx.beginPath()
        // ctx.moveTo(pointer_x, pointer_y)
        // ctx.lineTo(old_guessed_pointer_x, old_guessed_pointer_y)
        // ctx.stroke()

        /*
        guessed pointer indicator
        */
        ctx.fillStyle = "yellow"
        ctx.beginPath()
        ctx.arc(guessed_pointer_x, guessed_pointer_y, 4, 0, Math.PI * 2)
        ctx.fill()
        // ctx.strokeStyle = "yellow"
        // ctx.lineWidth = 1
        // ctx.beginPath()
        // ctx.moveTo(pointer_x, pointer_y)
        // ctx.lineTo(guessed_pointer_x, guessed_pointer_y)
        // ctx.stroke()

        /*
        pointer indicator
        */
        ctx.fillStyle = "red"
        ctx.beginPath()
        ctx.arc(pointer_x, pointer_y, 4, 0, Math.PI * 2)
        ctx.fill()
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

void sweb.render(() => <App />, document.getElementById("root")!)
