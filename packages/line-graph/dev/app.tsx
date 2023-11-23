import {signal as s} from '@nothing-but/solid'
import * as utils from '@nothing-but/utils'
import * as solid from 'solid-js'
import fragment_shader_source from './fragment.glsl?raw'
import vertex_shader_source from './vertex.glsl?raw'

const Shell: solid.FlowComponent = props => {
    return (
        <div class="min-h-110vh min-w-110vw">
            <div class="w-screen h-screen center-child flex-col">
                <div
                    ref={utils.event.preventMobileScrolling}
                    class="relative aspect-3/4 sm:aspect-4/3 w-90vmin m-auto relative overflow-hidden overscroll-none touch-none b b-solid b-red rounded-md"
                >
                    {props.children}
                </div>
            </div>
        </div>
    )
}

function makeShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | Error {
    const shader = gl.createShader(type)
    if (!shader) return new Error('failed to create gl shader')

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (!success) {
        const log = gl.getShaderInfoLog(shader)
        gl.deleteShader(shader)
        return new Error(log || 'failed to compile shader')
    }

    return shader
}

function makeVertexShader(gl: WebGL2RenderingContext, source: string): WebGLShader | Error {
    return makeShader(gl, gl.VERTEX_SHADER, source)
}
function makeFragmentShader(gl: WebGL2RenderingContext, source: string): WebGLShader | Error {
    return makeShader(gl, gl.FRAGMENT_SHADER, source)
}

function makeProgram(gl: WebGL2RenderingContext, shaders: WebGLShader[]): WebGLProgram | Error {
    const program = gl.createProgram()
    if (!program) return new Error('failed to create gl program')

    for (const shader of shaders) {
        gl.attachShader(program, shader)
    }
    gl.linkProgram(program)

    const success = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (!success) {
        const log = gl.getProgramInfoLog(program)
        gl.deleteProgram(program)
        return new Error(log || 'failed to link program')
    }

    return program
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
    const fragment_shader = makeFragmentShader(gl, fragment_shader_source)
    if (fragment_shader instanceof Error) throw fragment_shader

    const vertex_shader = makeVertexShader(gl, vertex_shader_source)
    if (vertex_shader instanceof Error) throw vertex_shader

    const program = makeProgram(gl, [fragment_shader, vertex_shader])
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

    function randomColor(): [number, number, number, number] {
        return [Math.random() * 256, Math.random() * 256, Math.random() * 256, 255]
    }

    // Make every vertex a different color.
    const colors = new Uint8Array([
        ...randomColor(),
        ...randomColor(),
        ...randomColor(),
        ...randomColor(),
        ...randomColor(),
        ...randomColor(),
    ])

    let i = 0

    const loop = utils.raf.makeAnimationLoop(() => {
        const h = gl.canvas.height / 2
        const w = gl.canvas.width / 2
        const x = (i += 2) % h
        // prettier-ignore
        const positions = [
            10+x, 20+x,
             w+x, 20+x,
            10+x,  h+x,
            10+x,  h+x,
             w+x, 20+x,
             w+x,  h+x,
        ]

        // bind, and fill position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, positions_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        gl.vertexAttribPointer(
            a_position,
            2, // 2 components per iteration, position is a vec2
            gl.FLOAT, // the data is 32bit floats
            false, // don't normalize the data
            0, // 0 = move forward size * sizeof(type) each iteration to get the next position
            0, // start at the beginning of the buffer
        )

        // bind, and fill color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, colors_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_color, 4, gl.UNSIGNED_BYTE, true, 0, 0)

        // set the resolution
        gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height)

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        // draw
        gl.drawArrays(gl.TRIANGLES, 0, 6) // 2 triangles, 6 vertices
    })
    utils.raf.loopStart(loop)
    s.addCleanup(loop, utils.raf.loopClear)

    return <Shell>{el}</Shell>
}
