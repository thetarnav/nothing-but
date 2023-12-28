/*

Smooth dragging

- [ ] multiple pointers
- [x] initial smooth move to center
- [x] momentum
- [ ] optimistic events

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

    let box_x = 100
    let box_y = 100

    let momentum_x = 0
    let momentum_y = 0

    let goal_x = box_x
    let goal_y = box_y

    let last_rect_x = 0
    let last_rect_y = 0

    let pointer_down = false

    const BOX_SIZE = 40
    const HALF_BOX_SIZE = BOX_SIZE / 2

    const INERTIA_STRENGTH = 0.3
    const DECAY_STRENGTH = 0.5

    function updatePosition(x: number, y: number): void {
        goal_x = x
        goal_y = y
    }
    function updateLastRect(rect: DOMRect): void {
        last_rect_x = rect.x
        last_rect_y = rect.y
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

        updatePosition(x, y)
        updateLastRect(el.getBoundingClientRect())
        pointer_down = true
    })
    utils.event.createListener(document, "pointermove", e => {
        if (!pointer_down) return
        const rect = el.getBoundingClientRect()
        updatePosition(e.clientX - rect.left, e.clientY - rect.top)
        updateLastRect(rect)
    })
    utils.event.createListener(document, "scroll", () => {
        if (!pointer_down) return
        const rect = el.getBoundingClientRect()
        updatePosition(goal_x + last_rect_x - rect.x, goal_y + last_rect_y - rect.y)
        updateLastRect(rect)
    })
    utils.event.createListener(document, "pointerup", () => {
        pointer_down = false
    })
    utils.event.createListener(document, "pointercancel", () => {
        pointer_down = false
    })
    utils.event.createListener(document, "contextmenu", () => {
        pointer_down = false
    })

    const frame = (): void => {
        momentum_x += (goal_x - box_x) * INERTIA_STRENGTH
        momentum_y += (goal_y - box_y) * INERTIA_STRENGTH
        momentum_x *= DECAY_STRENGTH
        momentum_y *= DECAY_STRENGTH
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
        ctx.fillStyle = "red"
        ctx.fillRect(box_x - HALF_BOX_SIZE, box_y - HALF_BOX_SIZE, BOX_SIZE, BOX_SIZE)

        /*
        momentum indicator
        */
        ctx.strokeStyle = "blue"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(box_x, box_y)
        ctx.lineTo(box_x + momentum_x, box_y + momentum_y)
        ctx.stroke()
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
