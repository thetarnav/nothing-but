import {signal as s} from '@nothing-but/solid'
import * as utils from '@nothing-but/utils'
import * as solid from 'solid-js'
import * as sweb from 'solid-js/web'
import * as lib from '../../src'
import fragment_shader_source from './fragment.glsl?raw'
import vertex_shader_source from './vertex.glsl?raw'

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

type Vec4 = [number, number, number, number]

function randomColor(): Vec4 {
    return [Math.random() * 256, Math.random() * 256, Math.random() * 256, 255]
}

const RED: Vec4 = [255, 0, 0, 255]
const GREEN: Vec4 = [0, 255, 0, 255]

export const App: solid.Component = () => {
    const el = (<canvas class="absolute w-full h-full" />) as HTMLCanvasElement

    const gl = el.getContext('webgl2')
    if (!gl) throw new Error('webgl2 is not supported')

    /*
    Update the canvas's size to match the size it's displayed.
    */
    const ro = utils.canvas.makeCanvasResizeObserver(el)
    s.addCleanup(ro, utils.canvas.cleanCanvasResizeObserver)

    /*
    setup GLSL program
    */
    const fragment_shader = lib.makeFragmentShader(gl, fragment_shader_source)
    if (fragment_shader instanceof Error) throw fragment_shader

    const vertex_shader = lib.makeVertexShader(gl, vertex_shader_source)
    if (vertex_shader instanceof Error) throw vertex_shader

    const program = lib.makeProgram(gl, [fragment_shader, vertex_shader])
    if (program instanceof Error) throw program

    gl.useProgram(program)

    const a_position = gl.getAttribLocation(program, 'a_position')
    const a_color = gl.getAttribLocation(program, 'a_color')
    const u_resolution = gl.getUniformLocation(program, 'u_resolution')

    // Turn on the attribute
    gl.enableVertexAttribArray(a_position)
    gl.enableVertexAttribArray(a_color)

    const positions_buffer = gl.createBuffer()
    const colors_buffer = gl.createBuffer()

    if (!positions_buffer || !colors_buffer) throw new Error('failed to create gl buffers')

    // prettier-ignore
    const data_points = new Float32Array([
          50, 70,
        200, 200,
        400, 300,
        600, 150,
        800, 400,
    ])
    const data_points_count = data_points.length / 2

    const EASING_FREQUENCY = 12

    // fill in the gaps between data points
    const easing_points_count = (data_points_count - 1) * EASING_FREQUENCY
    const easing_points_length = easing_points_count * 2
    const positions_count = easing_points_count * 2 // add the inset points
    const positions = new Float32Array(positions_count * 2)

    /*
    EASING
    */
    for (let i = 0; i < data_points_count - 1; i += 1) {
        const data_idx = i << 1
        const x1 = data_points[data_idx]!
        const y1 = data_points[data_idx + 1]!
        const x2 = data_points[data_idx + 2]!
        const y2 = data_points[data_idx + 3]!

        for (let j = 0; j < EASING_FREQUENCY; j += 1) {
            const p = j / EASING_FREQUENCY
            const ease = utils.ease.in_out_cubic(p)
            const x = utils.num.lerp(x1, x2, p)
            const y = utils.num.lerp(y1, y2, ease)

            const easing_idx = data_idx * EASING_FREQUENCY + (j << 1)
            positions[easing_idx] = x
            positions[easing_idx + 1] = y
        }
    }

    /*
    INSET POINTS
    */
    const INSET_WIDTH = 12
    for (let i = 1; i < easing_points_count - 1; i += 1) {
        const idx = i << 1
        const x = positions[idx]!
        const y = positions[idx + 1]!

        const x1 = positions[idx - 2]!
        const y1 = positions[idx - 1]!
        const x2 = positions[idx + 2]!
        const y2 = positions[idx + 3]!

        const angle = Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2

        const inset_x = x + Math.cos(angle) * INSET_WIDTH
        const inset_y = y + Math.sin(angle) * INSET_WIDTH

        const inset_idx = easing_points_length + idx
        positions[inset_idx] = inset_x
        positions[inset_idx + 1] = inset_y
    }

    /* first inset point */
    positions[easing_points_length] = positions[0]!
    positions[easing_points_length + 1] = positions[1]! - INSET_WIDTH

    /* last inset point */
    positions[easing_points_length + easing_points_length - 2] =
        positions[easing_points_length - 2]!
    positions[easing_points_length + easing_points_length - 1] =
        positions[easing_points_length - 1]! - INSET_WIDTH

    /*
    COLORS
    */
    const colors = new Uint8Array(positions_count * 4)
    {
        let i = 0
        let stop = easing_points_count * 4
        for (; i < stop; i += 4) {
            colors[i] = GREEN[0]
            colors[i + 1] = GREEN[1]
            colors[i + 2] = GREEN[2]
            colors[i + 3] = GREEN[3]
        }
        stop += easing_points_count * 4
        for (; i < stop; i += 4) {
            colors[i] = RED[0]
            colors[i + 1] = RED[1]
            colors[i + 2] = RED[2]
            colors[i + 3] = RED[3]
        }
    }

    const loop = utils.raf.makeAnimationLoop(() => {
        // set the resolution
        gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height)

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.bindBuffer(gl.ARRAY_BUFFER, positions_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, colors_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_color, 4, gl.UNSIGNED_BYTE, true, 0, 0)

        gl.drawArrays(gl.POINTS, 0, positions_count)
    })
    utils.raf.loopStart(loop)
    s.addCleanup(loop, utils.raf.loopClear)

    return <Shell>{el}</Shell>
}

void sweb.render(() => <App />, document.getElementById('root')!)
