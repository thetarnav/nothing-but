/*

Typescript utilities for 2x2 matrices

Copied from the gl-matrix library, with some modifications.
The original code is licensed under the MIT license, and can be found here:
https://github.com/toji/gl-matrix/blob/2534c9d0dd8c947ec7ddd4223d99447de017bac9/LICENSE.md

*/

import {num} from '@nothing-but/utils'
import {array_constructor} from './array_type.js'

/**
 * 2x2 Matrix
 */
export type Mat2 = [number, number, number, number]
/**
 * Readonly 2x2 Matrix
 */
export type ReadonlyMat2 = readonly [number, number, number, number]

/**
 * Creates a new **uninitialized** identity Mat2
 *
 * @returns a new 2x2 matrix
 */
export function make(): Mat2 {
    return new array_constructor(4) as Mat2
}

/**
 * Returns a new identity Mat2
 *
 * @returns a new 2x2 matrix
 */
export function identity(): Mat2 {
    const mat2 = new array_constructor(4) as Mat2
    if (array_constructor != Float32Array) {
        mat2[1] = 0
        mat2[2] = 0
    }
    mat2[0] = 1
    mat2[3] = 1
    return mat2
}

/**
 * Set a Mat2 to the identity matrix
 *
 * @param out the receiving matrix
 */
export function setIdentity(out: Mat2): void {
    out[0] = 1
    out[1] = 0
    out[2] = 0
    out[3] = 1
}

/**
 * Creates a new Mat2 initialized with values from an existing matrix
 *
 * @param a matrix to clone
 * @returns a new 2x2 matrix
 */
export function clone(a: ReadonlyMat2): Mat2 {
    const out = new array_constructor(4) as Mat2
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    out[3] = a[3]
    return out
}

/**
 * Create a new Mat2 with the given values
 *
 * Values:
 * ```
 *  m00 m01
 *  m10 m11
 * ```
 * @returns A new 2x2 matrix
 */
export function fromValues(m00: number, m01: number, m10: number, m11: number): Mat2 {
    const mat = new array_constructor(4) as Mat2
    mat[0] = m00
    mat[1] = m01
    mat[2] = m10
    mat[3] = m11
    return mat
}

/**
 * Set the components of a Mat2 to the given values
 *
 * @param mat the receiving matrix
 *
 * Values:
 * ```
 *  m00 m01
 *  m10 m11
 * ```
 */
export function set(mat: Mat2, m00: number, m01: number, m10: number, m11: number): void {
    mat[0] = m00
    mat[1] = m01
    mat[2] = m10
    mat[3] = m11
}

/**
 * Transpose the values of a Mat2
 *
 * @param a the receiving matrix
 * @param b the source matrix
 */
export function transpose(a: Mat2, b: ReadonlyMat2): void {
    /*
    If we are transposing ourselves we can skip a few steps but have to cache
    some values
    */
    if (a === b) {
        ;[a[1], a[2]] = [a[2], a[1]]
    } else {
        a[0] = b[0]
        a[1] = b[2]
        a[2] = b[1]
        a[3] = b[3]
    }
}

/**
 * Returns a transposed copy of a Mat2
 *
 * @param a the receiving matrix
 * @param b the source matrix
 * @returns a new matrix
 */
export function transposed(a: ReadonlyMat2, b: ReadonlyMat2): Mat2 {
    const out = clone(a)
    transpose(out, b)
    return out
}

/**
 * Inverts a Mat2
 *
 * @param a the receiving matrix
 * @param b the source matrix
 */
export function invert(a: Mat2, b: ReadonlyMat2): void {
    const b0 = b[0],
        b1 = b[1],
        b2 = b[2],
        b3 = b[3]

    // Calculate the determinant
    let det = b0 * b3 - b2 * b1
    if (det === 0) return

    det = 1 / det

    a[0] = b3 * det
    a[1] = -b1 * det
    a[2] = -b2 * det
    a[3] = b0 * det
}

/**
 * Returns an inverted Mat2
 *
 * @param a the receiving matrix
 * @param b the source matrix
 * @returns a new Mat2
 */
export function inverse(a: ReadonlyMat2, b: ReadonlyMat2): Mat2 {
    const copy = clone(a)
    invert(copy, b)
    return copy
}

/**
 * Calculates the adjugate of a Mat2
 *
 * @param a the receiving matrix
 * @param b the source matrix
 */
export function adjoint(a: Mat2, b: ReadonlyMat2): void {
    /* Caching this value is necessary if a === b */
    const b0 = b[0]
    a[0] = b[3]
    a[1] = -b[1]
    a[2] = -b[2]
    a[3] = b0
}

/**
 * Calculates the adjugate of a Mat2
 *
 * @param a the receiving matrix
 * @param b the source matrix
 * @returns a new Mat2
 */
export function adjugate(a: ReadonlyMat2, b: ReadonlyMat2): Mat2 {
    const copy = clone(a)
    adjoint(copy, b)
    return copy
}

/**
 * Calculates the determinant of a Mat2
 *
 * @param a the source matrix
 * @returns determinant of a
 */
export function determinant(a: ReadonlyMat2): number {
    return a[0] * a[3] - a[2] * a[1]
}

/**
 * Multiplies two Mat2's
 *
 * @param mat the receiving matrix
 * @param a the first operand
 * @param b the second operand
 */
export function multiply(mat: Mat2, a: ReadonlyMat2, b: ReadonlyMat2): void {
    const a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        b0 = b[0],
        b1 = b[1],
        b2 = b[2],
        b3 = b[3]

    mat[0] = a0 * b0 + a2 * b1
    mat[1] = a1 * b0 + a3 * b1
    mat[2] = a0 * b2 + a2 * b3
    mat[3] = a1 * b2 + a3 * b3
}

/**
 * Alias for {@link multiply}
 */
export const mul = multiply

/**
 * Returns a new Mat2 from the given Mat2 multiplied by the given Mat2
 *
 * @param a the first operand
 * @param b the second operand
 * @returns out
 */
export function product(a: ReadonlyMat2, b: ReadonlyMat2): Mat2 {
    const mat = make()
    multiply(mat, a, b)
    return mat
}

/**
 * Rotates a Mat2 by the given angle
 *
 * @param mat the matrix to rotate
 * @param rad the angle to rotate the matrix by
 */
export function rotate(mat: Mat2, rad: number): void {
    const a0 = mat[0],
        a1 = mat[1],
        a2 = mat[2],
        a3 = mat[3],
        s = Math.sin(rad),
        c = Math.cos(rad)
    mat[0] = a0 * c + a2 * s
    mat[1] = a1 * c + a3 * s
    mat[2] = a0 * -s + a2 * c
    mat[3] = a1 * -s + a3 * c
}

/**
 * Rotates a matrix by the given angle
 *
 * @param mat the matrix to rotate
 * @param rad the angle to rotate the matrix by
 * @returns a new matrix
 */
export function rotated(mat: ReadonlyMat2, rad: number): Mat2 {
    const copy = clone(mat)
    rotate(copy, rad)
    return copy
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 * ```ts
 * mat2.identity(dest);
 * mat2.rotate(dest, rad);
 * ```
 * @param out Mat2 receiving operation result
 * @param rad the angle to rotate the matrix by
 */
export function setFromRotation(out: Mat2, rad: number): void {
    const s = Math.sin(rad),
        c = Math.cos(rad)
    out[0] = c
    out[1] = s
    out[2] = -s
    out[3] = c
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 * ```ts
 * const mat = mat2.make();
 * mat2.rotate(mat, rad);
 * ```
 * @param rad the angle to rotate the matrix by
 * @returns a new matrix
 */
export function fromRotation(rad: number): Mat2 {
    const mat = new array_constructor(4) as Mat2
    setFromRotation(mat, rad)
    return mat
}

/**
 * Scales the Mat2 by the dimensions in the given vec2
 *
 * @param mat the matrix to rotate
 * @param v the vec2 to scale the matrix by
 **/
export function scale(mat: Mat2, v: ReadonlyMat2): void {
    const v0 = v[0],
        v1 = v[1]
    mat[0] *= v0
    mat[1] *= v0
    mat[2] *= v1
    mat[3] *= v1
}

/**
 * Scales the Mat2 by the dimensions in the given vec2
 *
 * @param mat the matrix to rotate
 * @param v the vec2 to scale the matrix by
 * @returns a new matrix
 **/
export function scaled(mat: ReadonlyMat2, v: ReadonlyMat2): Mat2 {
    const copy = clone(mat)
    scale(copy, v)
    return copy
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 * ```ts
 * mat2.identity(dest);
 * mat2.scale(dest, vec);
 * ```
 * @param out Mat2 receiving operation result
 * @param v Scaling vector
 */
export function setFromScaling(out: Mat2, v: ReadonlyMat2): void {
    out[0] = v[0]
    out[1] = 0
    out[2] = 0
    out[3] = v[1]
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 * ```ts
 * const mat = mat2.make();
 * mat2.scale(mat, vec);
 * ```
 * @param v Scaling vector
 * @returns a new matrix
 */
export function fromScaling(v: ReadonlyMat2): Mat2 {
    const mat = new array_constructor(4) as Mat2
    setFromScaling(mat, v)
    return mat
}

/**
 * Returns a string representation of a Mat2
 *
 * @param a matrix to represent as a string
 * @returns string representation of the matrix
 */
export function str(a: ReadonlyMat2): string {
    return 'Mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')'
}

/**
 * Returns Frobenius norm of a Mat2
 *
 * @param a the matrix to calculate Frobenius norm of
 * @returns Frobenius norm
 */
export function frob(a: ReadonlyMat2): number {
    const a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3]
    return Math.sqrt(a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3)
}

// /**
//  * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
//  * @param L the lower triangular matrix
//  * @param D the diagonal matrix
//  * @param U the upper triangular matrix
//  * @param a the input matrix to factorize
//  */

// export function LDU(L: ReadonlyMat2, D: ReadonlyMat2, U: ReadonlyMat2, a: ReadonlyMat2) {
//     L[2] = a[2] / a[0]
//     U[0] = a[0]
//     U[1] = a[1]
//     U[3] = a[3] - L[2] * U[1]
//     return [L, D, U]
// }

/**
 * Adds two Mat2's
 * ```ts
 * a += b
 * ```
 * @param a the first, receiving operand
 * @param b the second operand
 */
export function add(a: Mat2, b: ReadonlyMat2): void {
    a[0] += b[0]
    a[1] += b[1]
    a[2] += b[2]
    a[3] += b[3]
}

/**
 * Returns the sum of two Mat2's
 * ```ts
 * out = a + b
 * ```
 * @param a the first, receiving operand
 * @param b the second operand
 * @returns a new matrix
 */
export function sum(a: ReadonlyMat2, b: ReadonlyMat2): Mat2 {
    const mat = new array_constructor(4) as Mat2
    mat[0] = a[0] + b[0]
    mat[1] = a[1] + b[1]
    mat[2] = a[2] + b[2]
    mat[3] = a[3] + b[3]
    return mat
}

/**
 * Subtracts matrix b from matrix a
 * ```ts
 * a -= b
 * ```
 * @param a the first, receiving operand
 * @param b the second operand
 */
export function subtract(a: Mat2, b: ReadonlyMat2): void {
    a[0] -= b[0]
    a[1] -= b[1]
    a[2] -= b[2]
    a[3] -= b[3]
}

/**
 * Alias for {@link subtract}
 */
export const sub = subtract

/**
 * Returns the difference between two Mat2's
 * ```ts
 * out = a - b
 * ```
 * @param a the first, receiving operand
 * @param b the second operand
 * @returns a new matrix
 */
export function difference(a: ReadonlyMat2, b: ReadonlyMat2): Mat2 {
    const mat = new array_constructor(4) as Mat2
    mat[0] = a[0] - b[0]
    mat[1] = a[1] - b[1]
    mat[2] = a[2] - b[2]
    mat[3] = a[3] - b[3]
    return mat
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param a The first matrix.
 * @param b The second matrix.
 * @returns True if the matrices are equal, false otherwise.
 */
export function exactEquals(a: ReadonlyMat2, b: ReadonlyMat2): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param a The first matrix.
 * @param b The second matrix.
 * @returns True if the matrices are equal, false otherwise.
 */
export function equals(a: ReadonlyMat2, b: ReadonlyMat2): boolean {
    return (
        num.equals(a[0], b[0]) &&
        num.equals(a[1], b[1]) &&
        num.equals(a[2], b[2]) &&
        num.equals(a[3], b[3])
    )
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param a the receiving matrix to scale
 * @param b amount to scale the matrix's elements by
 */
export function multiplyScalar(a: Mat2, b: number): void {
    a[0] *= b
    a[1] *= b
    a[2] *= b
    a[3] *= b
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param a the receiving matrix to scale
 * @param b amount to scale the matrix's elements by
 */
export function multipliedScalar(a: ReadonlyMat2, b: number): Mat2 {
    const mat = new array_constructor(4) as Mat2
    mat[0] = a[0] * b
    mat[1] = a[1] * b
    mat[2] = a[2] * b
    mat[3] = a[3] * b
    return mat
}

// /**
//  * Adds two Mat2's after multiplying each element of the second operand by a scalar value.
//  *
//  * @param out the receiving vector
//  * @param a the first operand
//  * @param b the second operand
//  * @param {Number} scale the amount to scale b's elements by before adding
//  * @returns out
//  */
// export function multiplyScalarAndAdd(
//     out: Mat2,
//     a: ReadonlyMat2,
//     b: ReadonlyMat2,
//     scale: number,
// ): Mat2 {
//     out[0] = a[0] + b[0] * scale
//     out[1] = a[1] + b[1] * scale
//     out[2] = a[2] + b[2] * scale
//     out[3] = a[3] + b[3] * scale
//     return out
// }
