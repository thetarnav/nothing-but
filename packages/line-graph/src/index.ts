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
