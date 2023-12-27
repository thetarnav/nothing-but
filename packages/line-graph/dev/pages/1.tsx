import {signal as s} from "@nothing-but/solid"
import * as utils from "@nothing-but/utils"
import * as solid from "solid-js"
import * as sweb from "solid-js/web"
import * as lib from "../../src"

const vertex_shader_source = /*glsl*/ `
// an attribute will receive data from a buffer
attribute vec2 a_position;
attribute vec4 a_color;
uniform vec2 u_resolution;
// color to pass to the fragment shader
// value in fragment shader will be interpolated
varying vec4 v_color;

void main() {
    // from pixels to 0->1 then to 0->2 then to -1->+1 (clipspace)
    vec2 clip_space = (a_position / u_resolution) * 2.0 - 1.0;

    gl_Position = vec4(clip_space * vec2(1, -1), 0, 1);

    // Convert from clip space to color space.
    // Clip space goes -1.0 to +1.0
    // Color space goes from 0.0 to 1.0
    // v_color = 1.0 - (gl_Position * 0.5 + 0.5);
    v_color = a_color;
}
`

const fragment_shader_source = /*glsl*/ `
// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default
precision mediump float;

// color varying received from vertex shader
varying vec4 v_color;

void main() {
  // gl_FragColor is a special variable a fragment shader is responsible for setting
  gl_FragColor = v_color;
}
`

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

export const App: solid.Component = () => {
    const el = (<canvas class="absolute w-full h-full" />) as HTMLCanvasElement

    const gl = el.getContext("webgl2")
    if (!gl) throw new Error("webgl2 is not supported")

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

    const a_position = gl.getAttribLocation(program, "a_position")
    const a_color = gl.getAttribLocation(program, "a_color")
    const u_resolution = gl.getUniformLocation(program, "u_resolution")

    // Turn on the attribute
    gl.enableVertexAttribArray(a_position)
    gl.enableVertexAttribArray(a_color)

    const positions_buffer = gl.createBuffer()
    const colors_buffer = gl.createBuffer()

    if (!positions_buffer || !colors_buffer) throw new Error("failed to create gl buffers")

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

void sweb.render(() => <App />, document.getElementById("root")!)
