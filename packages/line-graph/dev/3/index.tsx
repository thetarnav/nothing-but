import {signal as s} from '@nothing-but/solid'
import * as utils from '@nothing-but/utils'
import * as solid from 'solid-js'
import * as sweb from 'solid-js/web'

type Vec4 = [number, number, number, number]

const RED: Vec4 = [255, 0, 0, 255]
const GREEN: Vec4 = [0, 255, 0, 255]
const BLUE: Vec4 = [0, 0, 255, 255]

const HALF_PI = Math.PI / 2

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
    for (let i = 1; i < data_points_count - 1; i += 1) {
        const data_idx = i << 1

        const x_prev = data_points[data_idx - 2]!
        const y_prev = data_points[data_idx - 1]!
        const x_curr = data_points[data_idx + 0]!
        const y_curr = data_points[data_idx + 1]!
        const x_next = data_points[data_idx + 2]!
        const y_next = data_points[data_idx + 3]!

        const prev_angle = Math.atan2(y_curr - y_prev, x_curr - x_prev)
        const next_angle = Math.atan2(y_next - y_curr, x_next - x_curr)
        const absolute_angle = (prev_angle + next_angle) / 2
        const relative_angle = HALF_PI - Math.abs(absolute_angle - prev_angle)

        const inset_width = INSET_WIDTH / Math.sin(relative_angle)
        const normal_x = Math.cos(absolute_angle - HALF_PI) * inset_width
        const normal_y = Math.sin(absolute_angle - HALF_PI) * inset_width

        const pos_idx = i * 6

        positions[pos_idx + 0] = x_curr
        positions[pos_idx + 1] = y_curr
        positions[pos_idx + 2] = x_curr + normal_x
        positions[pos_idx + 3] = y_curr + normal_y
        positions[pos_idx + 4] = x_curr - normal_x
        positions[pos_idx + 5] = y_curr - normal_y
    }
    /* end points - flat down */
    // angles[0] = angles[positions_count - 2] = -HALF_PI
    // angles[1] = angles[positions_count - 1] = HALF_PI
    /* end points - correct */
    {
        const x_curr = data_points[0]!
        const y_curr = data_points[1]!
        const x_next = data_points[2]!
        const y_next = data_points[3]!

        const angle = Math.atan2(y_next - y_curr, x_next - x_curr) - HALF_PI
        positions[0] = x_curr
        positions[1] = y_curr
        positions[2] = x_curr + Math.cos(angle) * INSET_WIDTH
        positions[3] = y_curr + Math.sin(angle) * INSET_WIDTH
        positions[4] = x_curr - Math.cos(angle) * INSET_WIDTH
        positions[5] = y_curr - Math.sin(angle) * INSET_WIDTH
    }
    {
        const x_prev = data_points[data_points.length - 4]!
        const y_prev = data_points[data_points.length - 3]!
        const x_curr = data_points[data_points.length - 2]!
        const y_curr = data_points[data_points.length - 1]!

        const angle = Math.atan2(y_curr - y_prev, x_curr - x_prev) - HALF_PI
        positions[positions.length - 6] = x_curr
        positions[positions.length - 5] = y_curr
        positions[positions.length - 4] = x_curr + Math.cos(angle) * INSET_WIDTH
        positions[positions.length - 3] = y_curr + Math.sin(angle) * INSET_WIDTH
        positions[positions.length - 2] = x_curr - Math.cos(angle) * INSET_WIDTH
        positions[positions.length - 1] = y_curr - Math.sin(angle) * INSET_WIDTH
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
