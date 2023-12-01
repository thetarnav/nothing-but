import {signal as s} from '@nothing-but/solid'
import * as utils from '@nothing-but/utils'
import * as solid from 'solid-js'
import * as sweb from 'solid-js/web'
import * as lib from '../../src'

const RED: lib.Vec4 = [255, 0, 0, 255]
const GREEN: lib.Vec4 = [0, 255, 0, 255]
const BLUE: lib.Vec4 = [0, 0, 255, 255]

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

    // prettier-ignore
    const data_points = new Float32Array([
        180, 150,
        200, 200,
        200, 250,   
        300, 250,
        350, 250,
        370, 240,
        400, 240,
        420, 260,
        440, 280,
        460, 300,
    ])

    const data_points_count = data_points.length / 2

    const positions = new Float32Array(data_points.length * 3)
    const positions_count = positions.length / 2

    const colors = new Uint8Array(positions_count * 3)

    const INSET_WIDTH = 40

    /*
    NORMALS
    */
    {
        const normal = new Float32Array(2)
        for (let i = 1; i < data_points_count - 1; i += 1) {
            const data_idx = i << 1

            const prev_x = data_points[data_idx - 2]!
            const prev_y = data_points[data_idx - 1]!
            const curr_x = data_points[data_idx + 0]!
            const curr_y = data_points[data_idx + 1]!
            const next_x = data_points[data_idx + 2]!
            const next_y = data_points[data_idx + 3]!

            lib.polylineNormal(normal, 0, prev_x, prev_y, curr_x, curr_y, next_x, next_y)

            const normal_x = normal[0]! * INSET_WIDTH
            const normal_y = normal[1]! * INSET_WIDTH

            const pos_idx = i * 6

            positions[pos_idx + 0] = curr_x
            positions[pos_idx + 1] = curr_y
            positions[pos_idx + 2] = curr_x + normal_x
            positions[pos_idx + 3] = curr_y + normal_y
            positions[pos_idx + 4] = curr_x - normal_x
            positions[pos_idx + 5] = curr_y - normal_y
        }
        /* end points */
        {
            const curr_x = data_points[0]!
            const curr_y = data_points[1]!
            const next_x = data_points[2]!
            const next_y = data_points[3]!

            const prev_x = curr_x - (next_x - curr_x)
            const prev_y = curr_y - (next_y - curr_y)

            lib.polylineNormal(normal, 0, prev_x, prev_y, curr_x, curr_y, next_x, next_y)

            const normal_x = normal[0]! * INSET_WIDTH
            const normal_y = normal[1]! * INSET_WIDTH

            positions[0] = curr_x
            positions[1] = curr_y
            positions[2] = curr_x + normal_x
            positions[3] = curr_y + normal_y
            positions[4] = curr_x - normal_x
            positions[5] = curr_y - normal_y
        }
        {
            const prev_x = data_points[data_points.length - 4]!
            const prev_y = data_points[data_points.length - 3]!
            const curr_x = data_points[data_points.length - 2]!
            const curr_y = data_points[data_points.length - 1]!
            const next_x = curr_x + (curr_x - prev_x)
            const next_y = curr_y + (curr_y - prev_y)

            lib.polylineNormal(normal, 0, prev_x, prev_y, curr_x, curr_y, next_x, next_y)

            const normal_x = normal[0]! * INSET_WIDTH
            const normal_y = normal[1]! * INSET_WIDTH

            positions[positions.length - 6] = curr_x
            positions[positions.length - 5] = curr_y
            positions[positions.length - 4] = curr_x + normal_x
            positions[positions.length - 3] = curr_y + normal_y
            positions[positions.length - 2] = curr_x - normal_x
            positions[positions.length - 1] = curr_y - normal_y
        }

        for (let i = 0; i < data_points_count; i += 1) {
            const color_idx = i * 3 * 3
            colors[color_idx + 0] = RED[0]
            colors[color_idx + 1] = RED[1]
            colors[color_idx + 2] = RED[2]
            colors[color_idx + 3] = GREEN[0]
            colors[color_idx + 4] = GREEN[1]
            colors[color_idx + 5] = GREEN[2]
            colors[color_idx + 6] = BLUE[0]
            colors[color_idx + 7] = BLUE[1]
            colors[color_idx + 8] = BLUE[2]
        }
    }

    const loop = utils.raf.makeAnimationLoop(() => {
        /*
            clear
            flip y
        */
        ctx.setTransform(1, 0, 0, -1, 0, el.height)
        ctx.clearRect(0, 0, el.width, el.height)

        /*
            draw normal lines
        */
        ctx.lineWidth = 1
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#777'
        ctx.beginPath()
        for (let i = 0; i < positions_count; i += 3) {
            const idx = i * 2
            ctx.moveTo(positions[idx + 2]!, positions[idx + 3]!)
            ctx.lineTo(positions[idx + 4]!, positions[idx + 5]!)
        }
        ctx.stroke()

        /*
            draw line segments
        */
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#e50'
        ctx.beginPath()
        ctx.moveTo(positions[2]!, positions[3]!)
        for (let i = 0; i < positions_count; i += 3) {
            const idx = i * 2
            ctx.lineTo(positions[idx + 2]!, positions[idx + 3]!)
        }
        ctx.moveTo(positions[4]!, positions[5]!)
        for (let i = 0; i < positions_count; i += 3) {
            const idx = i * 2
            ctx.lineTo(positions[idx + 4]!, positions[idx + 5]!)
        }
        ctx.stroke()

        /*
            draw points dots
        */
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        for (let i = 0; i < positions_count; i += 3) {
            const idx = i * 2
            ctx.moveTo(positions[idx + 0]!, positions[idx + 1]!)
            ctx.arc(positions[idx + 0]!, positions[idx + 1]!, 3, 0, Math.PI * 2)
            ctx.moveTo(positions[idx + 2]!, positions[idx + 3]!)
            ctx.arc(positions[idx + 2]!, positions[idx + 3]!, 3, 0, Math.PI * 2)
            ctx.moveTo(positions[idx + 4]!, positions[idx + 5]!)
            ctx.arc(positions[idx + 4]!, positions[idx + 5]!, 3, 0, Math.PI * 2)
        }
        ctx.fill()
    })
    utils.raf.loopStart(loop)
    s.addCleanup(loop, utils.raf.loopClear)

    return <Shell>{el}</Shell>
}

void sweb.render(() => <App />, document.getElementById('root')!)
