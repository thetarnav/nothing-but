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

function randomColor(): [number, number, number, number] {
    return [Math.random() * 256, Math.random() * 256, Math.random() * 256, 255]
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

    const a_position = gl.getAttribLocation(program, 'a_position')
    const u_resolution = gl.getUniformLocation(program, 'u_resolution')

    // Turn on the attribute
    gl.enableVertexAttribArray(a_position)

    const positions_buffer = gl.createBuffer()
    const colors_buffer = gl.createBuffer()

    if (!positions_buffer || !colors_buffer) throw new Error('failed to create gl buffers')

    // prettier-ignore
    const data_points: number[] = [
          0,   0,
        200, 200,
        400, 300,
        600, 150,
        800, 400,
    ]
    const data_points_count = data_points.length / 2

    const loop = utils.raf.makeAnimationLoop(() => {
        gl.bindBuffer(gl.ARRAY_BUFFER, positions_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data_points), gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0)

        // set the resolution
        gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height)

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        // draw
        gl.drawArrays(gl.POINTS, 0, data_points_count)
    })
    utils.raf.loopStart(loop)
    s.addCleanup(loop, utils.raf.loopClear)

    return <Shell>{el}</Shell>
}

void sweb.render(() => <App />, document.getElementById('root')!)
