/*

3x3 Matrix

Copied from the gl-matrix library, with some modifications.
The original code is licensed under the MIT license, and can be found here:
https://github.com/toji/gl-matrix/blob/2534c9d0dd8c947ec7ddd4223d99447de017bac9/LICENSE.md

*/

import {num} from '@nothing-but/utils'
import {array_constructor} from './array_type.js'
import {ReadonlyVec2} from './vec2.js'

/**
 * 3x3 Matrix
 */
// prettier-ignore
export type Mat3 = [
    number, number, number,
    number, number, number,
    number, number, number,
]

/**
 * Readonly 3x3 Matrix
 */
// prettier-ignore
export type ReadonlyMat3 = readonly [
    number, number, number,
    number, number, number,
    number, number, number,
]

/**
 * Creates a new **uninitialized** Mat3
 *
 * @returns a new 3x3 matrix
 */
export function make(): Mat3 {
    return new array_constructor(9) as Mat3
}

/**
 * Creates a new identity Mat3
 *
 * @returns a new 3x3 matrix
 */
export function identity(): Mat3 {
    const out = new array_constructor(9) as Mat3
    if (array_constructor != Float32Array) {
        out[1] = 0
        out[2] = 0
        out[3] = 0
        out[5] = 0
        out[6] = 0
        out[7] = 0
    }
    out[0] = 1
    out[4] = 1
    out[8] = 1
    return out
}

/**
 * Set a Mat3 to the identity matrix
 *
 * @param out the receiving matrix
 */
export function setIdentity(out: Mat3): void {
    out[0] = 1
    out[1] = 0
    out[2] = 0
    out[3] = 0
    out[4] = 1
    out[5] = 0
    out[6] = 0
    out[7] = 0
    out[8] = 1
}

// /**
//  * Copies the upper-left 3x3 values into the given mat3.
//  *
//  * @param out the receiving 3x3 matrix
//  * @param a   the source 4x4 matrix
//  * @returns out
//  */
// export function setFromMat4(out:Mat3, a): Mat3 {
//     out[0] = a[0]
//     out[1] = a[1]
//     out[2] = a[2]
//     out[3] = a[4]
//     out[4] = a[5]
//     out[5] = a[6]
//     out[6] = a[8]
//     out[7] = a[9]
//     out[8] = a[10]
//     return out
// }

/**
 * Creates a new Mat3 initialized with values from an existing matrix
 *
 * @param a matrix to clone
 * @returns a new 3x3 matrix
 */
export function clone(a: ReadonlyMat3): Mat3 {
    const out = new array_constructor(9) as Mat3
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    out[3] = a[3]
    out[4] = a[4]
    out[5] = a[5]
    out[6] = a[6]
    out[7] = a[7]
    out[8] = a[8]
    return out
}

/**
 * Copy the values from one Mat3 to another
 *
 * @param out the receiving matrix
 * @param a the source matrix
 */
export function copy(out: Mat3, a: ReadonlyMat3): void {
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    out[3] = a[3]
    out[4] = a[4]
    out[5] = a[5]
    out[6] = a[6]
    out[7] = a[7]
    out[8] = a[8]
}

/**
 * Create a new Mat3 with the given values
 *
 * Values:
 * ```
 * [m00, m01, m02]
 * [m10, m11, m12]
 * [m20, m21, m22]
 * ```
 * @returns A new Mat3
 */
export function fromValues(
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
    m20: number,
    m21: number,
    m22: number,
): Mat3 {
    const out = new array_constructor(9) as Mat3
    out[0] = m00
    out[1] = m01
    out[2] = m02
    out[3] = m10
    out[4] = m11
    out[5] = m12
    out[6] = m20
    out[7] = m21
    out[8] = m22
    return out
}

/**
 * Set the components of a Mat3 to the given values
 *
 * @param out the receiving matrix
 *
 * Values:
 * ```
 * [m00, m01, m02]
 * [m10, m11, m12]
 * [m20, m21, m22]
 * ```
 */
export function set(
    out: Mat3,
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
    m20: number,
    m21: number,
    m22: number,
): void {
    out[0] = m00
    out[1] = m01
    out[2] = m02
    out[3] = m10
    out[4] = m11
    out[5] = m12
    out[6] = m20
    out[7] = m21
    out[8] = m22
}

/**
 * Transpose the values of a Mat3
 *
 * @param out the receiving matrix
 * @param a the source matrix
 */
export function transpose(out: Mat3, a: ReadonlyMat3): void {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        const a01 = a[1],
            a02 = a[2],
            a12 = a[5]
        out[1] = a[3]
        out[2] = a[6]
        out[3] = a01
        out[5] = a[7]
        out[6] = a02
        out[7] = a12
    } else {
        out[0] = a[0]
        out[1] = a[3]
        out[2] = a[6]
        out[3] = a[1]
        out[4] = a[4]
        out[5] = a[7]
        out[6] = a[2]
        out[7] = a[5]
        out[8] = a[8]
    }
}

/**
 * Inverts a Mat3
 *
 * @param out the receiving matrix
 * @param a the source matrix
 */
export function invert(out: Mat3, a: ReadonlyMat3): void {
    const a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a10 = a[3],
        a11 = a[4],
        a12 = a[5],
        a20 = a[6],
        a21 = a[7],
        a22 = a[8],
        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20

    // Calculate the determinant
    let det = a00 * b01 + a01 * b11 + a02 * b21
    if (det === 0) return

    det = 1.0 / det

    out[0] = b01 * det
    out[1] = (-a22 * a01 + a02 * a21) * det
    out[2] = (a12 * a01 - a02 * a11) * det
    out[3] = b11 * det
    out[4] = (a22 * a00 - a02 * a20) * det
    out[5] = (-a12 * a00 + a02 * a10) * det
    out[6] = b21 * det
    out[7] = (-a21 * a00 + a01 * a20) * det
    out[8] = (a11 * a00 - a01 * a10) * det
}

/**
 * Calculates the adjugate of a Mat3
 *
 * @param out the receiving matrix
 * @param a the source matrix
 */
export function adjoint(out: Mat3, a: ReadonlyMat3): void {
    const a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a10 = a[3],
        a11 = a[4],
        a12 = a[5],
        a20 = a[6],
        a21 = a[7],
        a22 = a[8]

    out[0] = a11 * a22 - a12 * a21
    out[1] = a02 * a21 - a01 * a22
    out[2] = a01 * a12 - a02 * a11
    out[3] = a12 * a20 - a10 * a22
    out[4] = a00 * a22 - a02 * a20
    out[5] = a02 * a10 - a00 * a12
    out[6] = a10 * a21 - a11 * a20
    out[7] = a01 * a20 - a00 * a21
    out[8] = a00 * a11 - a01 * a10
}

/**
 * Calculates the determinant of a Mat3
 *
 * @param a the source matrix
 * @returns determinant of a
 */
export function determinant(a: ReadonlyMat3): number {
    const a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a10 = a[3],
        a11 = a[4],
        a12 = a[5],
        a20 = a[6],
        a21 = a[7],
        a22 = a[8]

    return (
        a00 * (a22 * a11 - a12 * a21) +
        a01 * (-a22 * a10 + a12 * a20) +
        a02 * (a21 * a10 - a11 * a20)
    )
}

/**
 * Multiplies two Mat3's
 *
 * @param a the first, receiving operand
 * @param b the second operand
 */
export function multiply(a: Mat3, b: ReadonlyMat3): void {
    const a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a10 = a[3],
        a11 = a[4],
        a12 = a[5],
        a20 = a[6],
        a21 = a[7],
        a22 = a[8],
        b00 = b[0],
        b01 = b[1],
        b02 = b[2],
        b10 = b[3],
        b11 = b[4],
        b12 = b[5],
        b20 = b[6],
        b21 = b[7],
        b22 = b[8]

    a[0] = b00 * a00 + b01 * a10 + b02 * a20
    a[1] = b00 * a01 + b01 * a11 + b02 * a21
    a[2] = b00 * a02 + b01 * a12 + b02 * a22

    a[3] = b10 * a00 + b11 * a10 + b12 * a20
    a[4] = b10 * a01 + b11 * a11 + b12 * a21
    a[5] = b10 * a02 + b11 * a12 + b12 * a22

    a[6] = b20 * a00 + b21 * a10 + b22 * a20
    a[7] = b20 * a01 + b21 * a11 + b22 * a21
    a[8] = b20 * a02 + b21 * a12 + b22 * a22
}

/**
 * Translate a Mat3 by the given vector
 *
 * @param out the receiving matrix to translate
 * @param v vector to translate by
 */
export function translate(out: Mat3, v: ReadonlyVec2): void {
    const a00 = out[0],
        a01 = out[1],
        a02 = out[2],
        a10 = out[3],
        a11 = out[4],
        a12 = out[5],
        a20 = out[6],
        a21 = out[7],
        a22 = out[8],
        x = v[0],
        y = v[1]

    out[0] = a00
    out[1] = a01
    out[2] = a02

    out[3] = a10
    out[4] = a11
    out[5] = a12

    out[6] = x * a00 + y * a10 + a20
    out[7] = x * a01 + y * a11 + a21
    out[8] = x * a02 + y * a12 + a22
}

/**
 * Rotates a Mat3 by the given angle
 *
 * @param out the receiving matrix to rotate
 * @param rad the angle to rotate the matrix by
 */
export function rotate(out: Mat3, rad: number): void {
    const a00 = out[0],
        a01 = out[1],
        a02 = out[2],
        a10 = out[3],
        a11 = out[4],
        a12 = out[5],
        a20 = out[6],
        a21 = out[7],
        a22 = out[8],
        s = Math.sin(rad),
        c = Math.cos(rad)

    out[0] = c * a00 + s * a10
    out[1] = c * a01 + s * a11
    out[2] = c * a02 + s * a12

    out[3] = c * a10 - s * a00
    out[4] = c * a11 - s * a01
    out[5] = c * a12 - s * a02

    out[6] = a20
    out[7] = a21
    out[8] = a22
}

/**
 * Scales the Mat3 by the dimensions in the given Vec2
 *
 * @param out the receiving matrix to scale
 * @param v the Vec2 to scale the matrix by
 **/
export function scale(out: Mat3, v: ReadonlyVec2): void {
    const x = v[0],
        y = v[1]

    out[0] *= x
    out[1] *= x
    out[2] *= x

    out[3] *= y
    out[4] *= y
    out[5] *= y
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 * ```ts
 * mat3.setIdentity(dest);
 * mat3.translate(dest, vec);
 * ```
 * @param out Mat3 receiving operation result
 * @param v Translation vector
 */
export function setFromTranslation(out: Mat3, v: ReadonlyVec2): void {
    out[0] = 1
    out[1] = 0
    out[2] = 0
    out[3] = 0
    out[4] = 1
    out[5] = 0
    out[6] = v[0]
    out[7] = v[1]
    out[8] = 1
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 * ```ts
 * mat3.setIdentity(dest);
 * mat3.rotate(dest, rad);
 * ```
 * @param out Mat3 receiving operation result
 * @param rad the angle to rotate the matrix by
 */
export function setFromRotation(out: Mat3, rad: number): void {
    const s = Math.sin(rad),
        c = Math.cos(rad)

    out[0] = c
    out[1] = s
    out[2] = 0

    out[3] = -s
    out[4] = c
    out[5] = 0

    out[6] = 0
    out[7] = 0
    out[8] = 1
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 * ```ts
 * mat3.setIdentity(dest);
 * mat3.scale(dest, vec);
 * ```
 * @param out Mat3 receiving operation result
 * @param v Scaling vector
 */
export function setFromScaling(out: Mat3, v: ReadonlyVec2): void {
    out[0] = v[0]
    out[1] = 0
    out[2] = 0

    out[3] = 0
    out[4] = v[1]
    out[5] = 0

    out[6] = 0
    out[7] = 0
    out[8] = 1
}

// /**
//  * Copies the values from a mat2d into a Mat3
//  *
//  * @param out the receiving matrix
//  * @param {ReadonlyMat2d} a the matrix to copy
//  * @returns out
//  **/
// export function fromMat2d(out, a: ReadonlyMat2d) {
//     out[0] = a[0]
//     out[1] = a[1]
//     out[2] = 0

//     out[3] = a[2]
//     out[4] = a[3]
//     out[5] = 0

//     out[6] = a[4]
//     out[7] = a[5]
//     out[8] = 1
//     return out
// }

// /**
//  * Calculates a 3x3 matrix from the given quaternion
//  *
//  * @param out Mat3 receiving operation result
//  * @param {ReadonlyQuat} q Quaternion to create matrix from
//  *
//  * @returns out
//  */
// export function fromQuat(out, q: ReadonlyQuat): Mat3 {
//     let x = q[0],
//         y = q[1],
//         z = q[2],
//         w = q[3]
//     let x2 = x + x
//     let y2 = y + y
//     let z2 = z + z

//     let xx = x * x2
//     let yx = y * x2
//     let yy = y * y2
//     let zx = z * x2
//     let zy = z * y2
//     let zz = z * z2
//     let wx = w * x2
//     let wy = w * y2
//     let wz = w * z2

//     out[0] = 1 - yy - zz
//     out[3] = yx - wz
//     out[6] = zx + wy

//     out[1] = yx + wz
//     out[4] = 1 - xx - zz
//     out[7] = zy - wx

//     out[2] = zx - wy
//     out[5] = zy + wx
//     out[8] = 1 - xx - yy

//     return out
// }

// /**
//  * Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
//  *
//  * @param out Mat3 receiving operation result
//  * @param a Mat4 to derive the normal matrix from
//  *
//  * @returns out
//  */
// export function normalFromMat4(out, a): Mat3 {
//     let a00 = a[0],
//         a01 = a[1],
//         a02 = a[2],
//         a03 = a[3]
//     let a10 = a[4],
//         a11 = a[5],
//         a12 = a[6],
//         a13 = a[7]
//     let a20 = a[8],
//         a21 = a[9],
//         a22 = a[10],
//         a23 = a[11]
//     let a30 = a[12],
//         a31 = a[13],
//         a32 = a[14],
//         a33 = a[15]

//     let b00 = a00 * a11 - a01 * a10
//     let b01 = a00 * a12 - a02 * a10
//     let b02 = a00 * a13 - a03 * a10
//     let b03 = a01 * a12 - a02 * a11
//     let b04 = a01 * a13 - a03 * a11
//     let b05 = a02 * a13 - a03 * a12
//     let b06 = a20 * a31 - a21 * a30
//     let b07 = a20 * a32 - a22 * a30
//     let b08 = a20 * a33 - a23 * a30
//     let b09 = a21 * a32 - a22 * a31
//     let b10 = a21 * a33 - a23 * a31
//     let b11 = a22 * a33 - a23 * a32

//     // Calculate the determinant
//     let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06

//     if (!det) {
//         return null
//     }
//     det = 1.0 / det

//     out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det
//     out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det
//     out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det

//     out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det
//     out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det
//     out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det

//     out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det
//     out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det
//     out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det

//     return out
// }

/**
 * Generates a 2D projection matrix with the given bounds
 *
 * @param out Mat3 frustum matrix will be written into
 * @param width Width of your gl context
 * @param height Height of gl context
 */
export function project(out: Mat3, width: number, height: number): void {
    out[0] = 2 / width
    out[1] = 0
    out[2] = 0
    out[3] = 0
    out[4] = -2 / height
    out[5] = 0
    out[6] = -1
    out[7] = 1
    out[8] = 1
}

/**
 * Sets matrix to a 2D projection matrix with the given bounds
 *
 * @param width Width of your gl context
 * @param height Height of gl context
 * @returns a new 3x3 matrix
 */
export function projection(width: number, height: number): Mat3 {
    const out = new array_constructor(9) as Mat3
    project(out, width, height)
    return out
}

/**
 * Returns a string representation of a Mat3
 *
 * @param a matrix to represent as a string
 * @returns string representation of the matrix
 */
export function str(a: ReadonlyMat3): string {
    return (
        'Mat3(' +
        a[0] +
        ', ' +
        a[1] +
        ', ' +
        a[2] +
        ', ' +
        a[3] +
        ', ' +
        a[4] +
        ', ' +
        a[5] +
        ', ' +
        a[6] +
        ', ' +
        a[7] +
        ', ' +
        a[8] +
        ')'
    )
}

/**
 * Returns Frobenius norm of a Mat3
 *
 * @param a the matrix to calculate Frobenius norm of
 * @returns Frobenius norm
 */
export function frob(a: ReadonlyMat3): number {
    const a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        a4 = a[4],
        a5 = a[5],
        a6 = a[6],
        a7 = a[7],
        a8 = a[8]

    return Math.sqrt(
        a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3 + a4 * a4 + a5 * a5 + a6 * a6 + a7 * a7 + a8 * a8,
    )
}

/**
 * Adds two Mat3's
 *
 * @param out the first, receiving operand
 * @param b the second operand
 */
export function add(out: Mat3, b: ReadonlyMat3): void {
    out[0] += b[0]
    out[1] += b[1]
    out[2] += b[2]
    out[3] += b[3]
    out[4] += b[4]
    out[5] += b[5]
    out[6] += b[6]
    out[7] += b[7]
    out[8] += b[8]
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param out the first, receiving operand
 * @param b the second operand
 */
export function subtract(out: Mat3, b: ReadonlyMat3): void {
    out[0] -= b[0]
    out[1] -= b[1]
    out[2] -= b[2]
    out[3] -= b[3]
    out[4] -= b[4]
    out[5] -= b[5]
    out[6] -= b[6]
    out[7] -= b[7]
    out[8] -= b[8]
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param out the first, receiving operand
 * @param b the second operand
 */
export function multiplyScalar(out: Mat3, b: number): void {
    out[0] *= b
    out[1] *= b
    out[2] *= b
    out[3] *= b
    out[4] *= b
    out[5] *= b
    out[6] *= b
    out[7] *= b
    out[8] *= b
}

/**
 * Adds two Mat3's after multiplying each element of the second operand by a scalar value.
 *
 * @param out the receiving vector
 * @param a the first operand
 * @param b the second operand
 * @param scale the amount to scale b's elements by before adding
 * @returns out
 */
export function multiplyScalarAndAdd(out, a, b, scale): Mat3 {
    out[0] = a[0] + b[0] * scale
    out[1] = a[1] + b[1] * scale
    out[2] = a[2] + b[2] * scale
    out[3] = a[3] + b[3] * scale
    out[4] = a[4] + b[4] * scale
    out[5] = a[5] + b[5] * scale
    out[6] = a[6] + b[6] * scale
    out[7] = a[7] + b[7] * scale
    out[8] = a[8] + b[8] * scale
    return out
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param a The first matrix.
 * @param b The second matrix.
 * @returns True if the matrices are equal, false otherwise.
 */
export function exactEquals(a: ReadonlyMat3, b: ReadonlyMat3): boolean {
    return (
        a[0] === b[0] &&
        a[1] === b[1] &&
        a[2] === b[2] &&
        a[3] === b[3] &&
        a[4] === b[4] &&
        a[5] === b[5] &&
        a[6] === b[6] &&
        a[7] === b[7] &&
        a[8] === b[8]
    )
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param a The first matrix.
 * @param b The second matrix.
 * @returns True if the matrices are equal, false otherwise.
 */
export function equals(a: ReadonlyMat3, b: ReadonlyMat3): boolean {
    return (
        num.equals(a[0], b[0]) &&
        num.equals(a[1], b[1]) &&
        num.equals(a[2], b[2]) &&
        num.equals(a[3], b[3]) &&
        num.equals(a[4], b[4]) &&
        num.equals(a[5], b[5]) &&
        num.equals(a[6], b[6]) &&
        num.equals(a[7], b[7]) &&
        num.equals(a[8], b[8])
    )
}

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
export const mul = multiply

/**
 * Alias for {@link mat3.subtract}
 * @function
 */
export const sub = subtract
