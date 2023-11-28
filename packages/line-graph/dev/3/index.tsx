import {signal as s} from '@nothing-but/solid'
import * as utils from '@nothing-but/utils'
import * as solid from 'solid-js'
import * as sweb from 'solid-js/web'
import * as lib from '../../src'

const vertex_shader_source = /*glsl*/ `
uniform vec2 u_resolution;

attribute vec2 a_position;
attribute vec3 a_color;

varying vec3 v_color;

void main() {
    // from pixels to 0->1 then to 0->2 then to -1->+1 (clipspace)
    vec2 clip_space = (a_position / u_resolution) * 2.0 - 1.0;

    gl_Position = vec4(clip_space * vec2(1, 1), 0, 1);
    gl_PointSize = 8.0;

    v_color = a_color;
}
`

const fragment_shader_source = /*glsl*/ `
precision mediump float;

varying vec3 v_color;

void main() {
    gl_FragColor = vec4(v_color, 1.0);
}
`

type Vec4 = [number, number, number, number]

const RED: Vec4 = [255, 0, 0, 255]
const GREEN: Vec4 = [0, 255, 0, 255]
const BLUE: Vec4 = [0, 0, 255, 255]

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

    const a_position = gl.getAttribLocation(program, 'a_position')
    const a_color = gl.getAttribLocation(program, 'a_color')

    // Turn on the attribute
    gl.enableVertexAttribArray(a_position)
    gl.enableVertexAttribArray(a_color)

    const positions_buffer = gl.createBuffer()
    const colors_buffer = gl.createBuffer()

    if (!positions_buffer || !colors_buffer) throw new Error('failed to create gl buffers')

    // prettier-ignore
    const data_points = new Float32Array([
        150, 150,
        200, 200,
        200, 250,   
        300, 250,
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

        const angle =
            (Math.atan2(y_curr - y_prev, x_curr - x_prev) +
                Math.atan2(y_next - y_curr, x_next - x_curr)) /
            2

        const add = Math.abs(1 - angle / (Math.PI / 2))
        const move_by = INSET_WIDTH + add * INSET_WIDTH

        const perp_angle = angle - Math.PI / 2
        const move_x = Math.cos(perp_angle) * move_by
        const move_y = Math.sin(perp_angle) * move_by

        const pos_idx = i * 6

        positions[pos_idx + 0] = x_curr
        positions[pos_idx + 1] = y_curr
        positions[pos_idx + 2] = x_curr + move_x
        positions[pos_idx + 3] = y_curr + move_y
        positions[pos_idx + 4] = x_curr - move_x
        positions[pos_idx + 5] = y_curr - move_y
    }
    /* end points - flat down */
    // angles[0] = angles[positions_count - 2] = -Math.PI / 2
    // angles[1] = angles[positions_count - 1] = Math.PI / 2
    /* end points - correct */
    {
        const x_curr = data_points[0]!
        const y_curr = data_points[1]!
        const x_next = data_points[2]!
        const y_next = data_points[3]!

        const angle = Math.atan2(y_next - y_curr, x_next - x_curr) - Math.PI / 2
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

        const angle = Math.atan2(y_curr - y_prev, x_curr - x_prev) - Math.PI / 2
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
        gl.vertexAttribPointer(a_color, 3, gl.UNSIGNED_BYTE, true, 0, 0)

        gl.drawArrays(gl.POINTS, 0, positions_count)
    })
    utils.raf.loopStart(loop)
    s.addCleanup(loop, utils.raf.loopClear)

    return <Shell>{el}</Shell>
}

void sweb.render(() => <App />, document.getElementById('root')!)
