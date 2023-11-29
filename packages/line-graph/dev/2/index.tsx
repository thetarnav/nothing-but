import {signal as s} from '@nothing-but/solid'
import * as utils from '@nothing-but/utils'
import * as solid from 'solid-js'
import * as sweb from 'solid-js/web'
import * as lib from '../../src'

const vertex_shader_source = /*glsl*/ `
uniform vec2 u_resolution;
uniform vec4 u_color;

// an attribute will receive data from a buffer
attribute vec2 a_position;
attribute vec2 a_normal;

varying vec4 v_color;

void main() {
    // move a_position by thickness in the direction of a_normal
    vec2 p = a_position + a_normal;

    // from pixels to 0->1 then to 0->2 then to -1->+1 (clipspace)
    vec2 clip_space = (p / u_resolution) * 2.0 - 1.0;

    gl_Position = vec4(clip_space * vec2(1, 1), 0, 1);

    v_color = u_color;
}
`

const fragment_shader_source = /*glsl*/ `
precision mediump float;

varying vec4 v_color;

void main() {
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    gl_FragColor = v_color;
}
`

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

const HALF_PI = Math.PI / 2

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

    const u_resolution = gl.getUniformLocation(program, 'u_resolution')
    const u_color = gl.getUniformLocation(program, 'u_color')

    const a_position = gl.getAttribLocation(program, 'a_position')
    const a_normal = gl.getAttribLocation(program, 'a_normal')

    // Turn on the attribute
    gl.enableVertexAttribArray(a_position)
    gl.enableVertexAttribArray(a_normal)

    const positions_buffer = gl.createBuffer()
    const angles_buffer = gl.createBuffer()

    if (!positions_buffer || !angles_buffer) throw new Error('failed to create gl buffers')

    const X_SPACING = 100

    // prettier-ignore
    const data_points = new Float32Array(8)

    const EASING_FREQUENCY = 32

    const INSET_WIDTH = 8

    // fill in the gaps between data points
    const easing_points_count = (data_points.length - 1) * EASING_FREQUENCY
    const positions_count = easing_points_count * 2 // add the inset points

    /*
    BUFFERS

    positions: (2 points per easing point for adding thickness)
    [x1, y1]    [x1, y1]...
    normals
    [x1, y1]    [x1, y1]...
    colors:
    [r, g, b, a][r, g, b, a]...

    */
    const positions = new Float32Array(positions_count * 2)
    const normals = new Float32Array(positions_count * 2)

    function addDataPoint(): void {
        // shift all the data points left
        for (let i = 0; i < data_points.length; i += 1) {
            data_points[i] = data_points[i + 1]!
        }
        data_points[data_points.length - 1] = Math.random() * 600
    }

    function updateBuffers(): void {
        /*
        EASING
        */
        for (let i = 0; i < data_points.length - 1; i += 1) {
            const x1 = i * X_SPACING
            const y1 = data_points[i]!
            const x2 = i * X_SPACING + X_SPACING
            const y2 = data_points[i + 1]!

            const points_before = (i * EASING_FREQUENCY) << 2

            for (let j = 0; j < EASING_FREQUENCY; j += 1) {
                const p = j / EASING_FREQUENCY
                const ease = utils.ease.in_out_quad(p)
                const x = utils.num.lerp(x1, x2, p)
                const y = utils.num.lerp(y1, y2, ease)

                const easing_idx = points_before + (j << 2)
                positions[easing_idx + 0] = x
                positions[easing_idx + 1] = y
                positions[easing_idx + 2] = x
                positions[easing_idx + 3] = y
            }
        }

        /*
        NORMALS
        */
        for (let i = 1; i < easing_points_count - 1; i += 1) {
            const pos_idx = i << 2 // 2 components, 2 points per easing point

            const x_prev = positions[pos_idx - 4]!
            const y_prev = positions[pos_idx - 3]!
            const x_curr = positions[pos_idx + 0]!
            const y_curr = positions[pos_idx + 1]!
            const x_next = positions[pos_idx + 4]!
            const y_next = positions[pos_idx + 5]!

            const prev_angle = Math.atan2(y_curr - y_prev, x_curr - x_prev)
            const next_angle = Math.atan2(y_next - y_curr, x_next - x_curr)
            const absolute_angle = (prev_angle + next_angle) / 2
            const relative_angle = HALF_PI - Math.abs(absolute_angle - prev_angle)

            const inset_width = INSET_WIDTH / Math.sin(relative_angle)
            const normal_x = Math.cos(absolute_angle - HALF_PI) * inset_width
            const normal_y = Math.sin(absolute_angle - HALF_PI) * inset_width

            const n_idx = i << 2 // 1 angle per point, 2 points per easing point
            normals[n_idx + 0] = normal_x
            normals[n_idx + 1] = normal_y
            normals[n_idx + 2] = -normal_x
            normals[n_idx + 3] = -normal_y
        }
        /* end points */
        normals[0] = 0
        normals[1] = -INSET_WIDTH
        normals[2] = 0
        normals[3] = INSET_WIDTH
        normals[normals.length - 4] = 0
        normals[normals.length - 3] = -INSET_WIDTH
        normals[normals.length - 2] = 0
        normals[normals.length - 1] = INSET_WIDTH
    }
    updateBuffers()

    const ANIM_DURATION = 1000
    let anim_progress = 0 // 0 -> 1

    const interval = setInterval(() => {
        addDataPoint()
        updateBuffers()
        anim_progress = 0
    }, ANIM_DURATION)
    s.addCleanup(interval, clearInterval)

    let last_time = 0
    const loop = utils.raf.makeAnimationLoop(time => {
        const delta = time - last_time
        last_time = time

        anim_progress = Math.min(anim_progress + delta / ANIM_DURATION, 1)

        const translate_x = utils.num.lerp(0, -X_SPACING, anim_progress)

        gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height)
        gl.uniform4f(u_color, 1, 0, 0, 1)

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(100 + translate_x, 100, gl.canvas.width, gl.canvas.height)

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.bindBuffer(gl.ARRAY_BUFFER, positions_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, angles_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_normal, 2, gl.FLOAT, false, 0, 0)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, positions_count)
    })
    utils.raf.loopStart(loop)
    s.addCleanup(loop, utils.raf.loopClear)

    return <Shell>{el}</Shell>
}

void sweb.render(() => <App />, document.getElementById('root')!)
