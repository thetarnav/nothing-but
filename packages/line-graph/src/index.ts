export function makeShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
): WebGLShader | Error {
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

export function makeVertexShader(gl: WebGL2RenderingContext, source: string): WebGLShader | Error {
    return makeShader(gl, gl.VERTEX_SHADER, source)
}
export function makeFragmentShader(
    gl: WebGL2RenderingContext,
    source: string,
): WebGLShader | Error {
    return makeShader(gl, gl.FRAGMENT_SHADER, source)
}

export function makeProgram(
    gl: WebGL2RenderingContext,
    shaders: WebGLShader[],
): WebGLProgram | Error {
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

export type Vec4 = [number, number, number, number]
export type NumArray = {[n: number]: number; length: number}
export type ReadonlyNumArray = {readonly [n: number]: number; readonly length: number}

export const HALF_PI = Math.PI / 2

// prettier-ignore
export function polylineNormal(
    out: NumArray, out_idx: number,
    prev_x: number, prev_y: number,
    curr_x: number, curr_y: number,
    next_x: number, next_y: number,
): void {
    const prev_angle = Math.atan2(curr_y - prev_y, curr_x - prev_x)
    const next_angle = Math.atan2(next_y - curr_y, next_x - curr_x)
    const absolute_angle = (prev_angle + next_angle) / 2
    const relative_angle = HALF_PI - Math.abs(absolute_angle - prev_angle)

    const normal_d = 1 / Math.sin(relative_angle)
    const normal_x = Math.cos(absolute_angle - HALF_PI) * normal_d
    const normal_y = Math.sin(absolute_angle - HALF_PI) * normal_d

    out[out_idx    ] = normal_x
    out[out_idx + 1] = normal_y
}

// prettier-ignore
export function polylineCap(
    out: NumArray, out_idx: number,
      cap_x: number,  cap_y: number,
     next_x: number, next_y: number,
    dencity: number,  width: number,
): void {
    const angle = Math.atan2(next_y - cap_y, next_x - cap_x) // absolute

    for (let i = 0; i < dencity; i += 1) {
        const p = i / (dencity - 1)
        const angle_offset = (p - 0.5) * Math.PI + angle + Math.PI
        const x = cap_x + Math.cos(angle_offset) * width
        const y = cap_y + Math.sin(angle_offset) * width
        const idx = out_idx + i * 2
        out[idx] = x
        out[idx + 1] = y
    }
}
