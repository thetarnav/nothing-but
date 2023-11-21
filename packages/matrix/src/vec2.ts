/*

2 Dimensional Vector

Copied from the gl-matrix library, with some modifications.
The original code is licensed under the MIT license, and can be found here:
https://github.com/toji/gl-matrix/blob/2534c9d0dd8c947ec7ddd4223d99447de017bac9/LICENSE.md

*/

import {num} from '@nothing-but/utils'
import {array_constructor} from './array_type.js'

/**
 * 2 Dimensional Vector
 */
export type Vec2 = [number, number]

/**
 * Readonly 2 Dimensional Vector
 */
export type ReadonlyVec2 = readonly [number, number]

/**
 * Creates a new, empty Vec2
 *
 * @returns a new 2D vector
 */
export function make(): Vec2 {
    return new array_constructor(2) as Vec2
}

/**
 * Creates a new, zero Vec2
 *
 * @returns a new 2D vector
 */
export function zero(): Vec2 {
    const out = new array_constructor(2) as Vec2
    if (array_constructor != Float32Array) {
        out[0] = 0
        out[1] = 0
    }
    return out
}

/**
 * Set the components of a Vec2 to zero
 *
 * @param out the receiving vector
 */
export function setZero(out: Vec2): void {
    out[0] = 0
    out[1] = 0
}

/**
 * Creates a new Vec2 initialized with values from an existing vector
 *
 * @param {ReadonlyVec2} a vector to clone
 * @returns a new 2D vector
 */
export function clone(a: ReadonlyVec2): Vec2 {
    const out = new array_constructor(2) as Vec2
    out[0] = a[0]
    out[1] = a[1]
    return out
}

/**
 * Copy the values from one Vec2 to another
 *
 * @param out the receiving vector
 * @param a the source vector
 */
export function copy(out: Vec2, a: ReadonlyVec2): void {
    out[0] = a[0]
    out[1] = a[1]
}

/**
 * Creates a new Vec2 initialized with the given values
 *
 * @param x X component
 * @param y Y component
 * @returns a new 2D vector
 */
export function fromValues(x: number, y: number): Vec2 {
    const out = new array_constructor(2) as Vec2
    out[0] = x
    out[1] = y
    return out
}

/**
 * Set the components of a Vec2 to the given values
 *
 * @param out the receiving vector
 * @param x X component
 * @param y Y component
 */
export function set(out: Vec2, x: number, y: number): void {
    out[0] = x
    out[1] = y
}

/**
 * Adds two Vec2's
 *
 * @param a the first, receiving operand
 * @param b the second operand
 */
export function add(a: Vec2, b: ReadonlyVec2): void {
    a[0] += b[0]
    a[1] += b[1]
}

/**
 * Returns the sum of two Vec2's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns a new vector
 */
export function sum(a: ReadonlyVec2, b: ReadonlyVec2): Vec2 {
    const out = new array_constructor(2) as Vec2
    out[0] = a[0] + b[0]
    out[1] = a[1] + b[1]
    return out
}

/**
 * Subtracts vector b from vector a
 *
 * @param a the first, receiving operand
 * @param b the second operand
 */
export function subtract(a: Vec2, b: ReadonlyVec2): void {
    a[0] -= b[0]
    a[1] -= b[1]
}

/**
 * Returns the difference of two Vec2's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns a new vector
 */
export function difference(a: ReadonlyVec2, b: ReadonlyVec2): Vec2 {
    const out = new array_constructor(2) as Vec2
    out[0] = a[0] - b[0]
    out[1] = a[1] - b[1]
    return out
}

/**
 * Multiplies two Vec2's
 *
 * @param a the first, receiving operand
 * @param b the second operand
 */
export function multiply(a: Vec2, b: ReadonlyVec2): void {
    a[0] *= b[0]
    a[1] *= b[1]
}

/**
 * Returns the product of two Vec2's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns a new vector
 */
export function product(a: ReadonlyVec2, b: ReadonlyVec2): Vec2 {
    const out = new array_constructor(2) as Vec2
    out[0] = a[0] * b[0]
    out[1] = a[1] * b[1]
    return out
}

/**
 * Divides two Vec2's
 *
 * @param a the first, receiving operand
 * @param b the second operand
 */
export function divide(a: Vec2, b: ReadonlyVec2): void {
    a[0] /= b[0]
    a[1] /= b[1]
}

/**
 * Returns the quotient of two Vec2's
 *
 * @param a the first operand
 * @param b the second operand
 * @returns a new vector
 */
export function quotient(a: ReadonlyVec2, b: ReadonlyVec2): Vec2 {
    const out = new array_constructor(2) as Vec2
    out[0] = a[0] / b[0]
    out[1] = a[1] / b[1]
    return out
}

/**
 * Math.ceil the components of a Vec2
 *
 * @param out the receiving vector
 */
export function ceil(out: Vec2): void {
    out[0] = Math.ceil(out[0])
    out[1] = Math.ceil(out[1])
}

/**
 * Math.floor the components of a Vec2
 *
 * @param out the receiving vector
 */
export function floor(out: Vec2): void {
    out[0] = Math.floor(out[0])
    out[1] = Math.floor(out[1])
}

/**
 * symmetric round the components of a Vec2
 *
 * @param out vector to round
 */
export function round(out: Vec2): void {
    out[0] = num.round(out[0])
    out[1] = num.round(out[1])
}

/**
 * Returns the minimum of two Vec2's
 *
 * @param a the first, receiving operand
 * @param b the second operand
 */
export function min(a: Vec2, b: ReadonlyVec2): void {
    a[0] = Math.min(a[0], b[0])
    a[1] = Math.min(a[1], b[1])
}

/**
 * Returns the maximum of two Vec2's
 *
 * @param a the first, receiving operand
 * @param b the second operand
 */
export function max(a: Vec2, b: ReadonlyVec2): void {
    a[0] = Math.max(a[0], b[0])
    a[1] = Math.max(a[1], b[1])
}

/**
 * Scales a Vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns out
 */
export function scale(out, a, b): Vec2 {
    out[0] = a[0] * b
    out[1] = a[1] * b
    return out
}

/**
 * Adds two Vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns out
 */
export function scaleAndAdd(out, a, b, scale): Vec2 {
    out[0] = a[0] + b[0] * scale
    out[1] = a[1] + b[1] * scale
    return out
}

/**
 * Calculates the euclidian distance between two Vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns distance between a and b
 */
export function distance(a, b): number {
    var x = b[0] - a[0],
        y = b[1] - a[1]
    return Math.sqrt(x * x + y * y)
}

/**
 * Calculates the squared euclidian distance between two Vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns squared distance between a and b
 */
export function squaredDistance(a, b): number {
    var x = b[0] - a[0],
        y = b[1] - a[1]
    return x * x + y * y
}

/**
 * Calculates the length of a Vec2
 *
 * @param {ReadonlyVec2} a vector to calculate length of
 * @returns length of a
 */
export function length(a): number {
    var x = a[0],
        y = a[1]
    return Math.sqrt(x * x + y * y)
}

/**
 * Calculates the squared length of a Vec2
 *
 * @param {ReadonlyVec2} a vector to calculate squared length of
 * @returns squared length of a
 */
export function squaredLength(a): number {
    var x = a[0],
        y = a[1]
    return x * x + y * y
}

/**
 * Negates the components of a Vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to negate
 * @returns out
 */
export function negate(out, a): Vec2 {
    out[0] = -a[0]
    out[1] = -a[1]
    return out
}

/**
 * Returns the inverse of the components of a Vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to invert
 * @returns out
 */
export function inverse(out, a): Vec2 {
    out[0] = 1.0 / a[0]
    out[1] = 1.0 / a[1]
    return out
}

/**
 * Normalize a Vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to normalize
 * @returns out
 */
export function normalize(out, a): Vec2 {
    var x = a[0],
        y = a[1]
    var len = x * x + y * y
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len)
    }
    out[0] = a[0] * len
    out[1] = a[1] * len
    return out
}

/**
 * Calculates the dot product of two Vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns dot product of a and b
 */
export function dot(a, b): number {
    return a[0] * b[0] + a[1] * b[1]
}

/**
 * Computes the cross product of two Vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns out
 */
export function cross(out, a, b): vec3 {
    var z = a[0] * b[1] - a[1] * b[0]
    out[0] = out[1] = 0
    out[2] = z
    return out
}

/**
 * Performs a linear interpolation between two Vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns out
 */
export function lerp(out, a, b, t): Vec2 {
    var ax = a[0],
        ay = a[1]
    out[0] = ax + t * (b[0] - ax)
    out[1] = ay + t * (b[1] - ay)
    return out
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
 * @returns out
 */
export function random(out, scale): Vec2 {
    scale = scale === undefined ? 1.0 : scale
    var r = glMatrix.RANDOM() * 2.0 * Math.PI
    out[0] = Math.cos(r) * scale
    out[1] = Math.sin(r) * scale
    return out
}

/**
 * Transforms the Vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2} m matrix to transform with
 * @returns out
 */
export function transformMat2(out, a, m): Vec2 {
    var x = a[0],
        y = a[1]
    out[0] = m[0] * x + m[2] * y
    out[1] = m[1] * x + m[3] * y
    return out
}

/**
 * Transforms the Vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2d} m matrix to transform with
 * @returns out
 */
export function transformMat2d(out, a, m): Vec2 {
    var x = a[0],
        y = a[1]
    out[0] = m[0] * x + m[2] * y + m[4]
    out[1] = m[1] * x + m[3] * y + m[5]
    return out
}

/**
 * Transforms the Vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat3} m matrix to transform with
 * @returns out
 */
export function transformMat3(out, a, m): Vec2 {
    var x = a[0],
        y = a[1]
    out[0] = m[0] * x + m[3] * y + m[6]
    out[1] = m[1] * x + m[4] * y + m[7]
    return out
}

/**
 * Transforms the Vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns out
 */
export function transformMat4(out, a, m): Vec2 {
    const x = a[0]
    const y = a[1]
    out[0] = m[0] * x + m[4] * y + m[12]
    out[1] = m[1] * x + m[5] * y + m[13]
    return out
}

/**
 * Rotate a 2D vector
 * @param {vec2} out The receiving Vec2
 * @param {ReadonlyVec2} a The Vec2 point to rotate
 * @param {ReadonlyVec2} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns out
 */
export function rotate(out, a, b, rad): Vec2 {
    //Translate point to the origin
    const p0 = a[0] - b[0],
        p1 = a[1] - b[1],
        sinC = Math.sin(rad),
        cosC = Math.cos(rad)

    //perform rotation and translate to correct position
    out[0] = p0 * cosC - p1 * sinC + b[0]
    out[1] = p0 * sinC + p1 * cosC + b[1]

    return out
}

/**
 * Get the angle between two 2D vectors
 * @param {ReadonlyVec2} a The first operand
 * @param {ReadonlyVec2} b The second operand
 * @returns The angle in radians
 */
export function angle(a, b): number {
    const x1 = a[0],
        y1 = a[1],
        x2 = b[0],
        y2 = b[1],
        // mag is the product of the magnitudes of a and b
        mag = Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2)),
        // mag &&.. short circuits if mag == 0
        cosine = mag && (x1 * x2 + y1 * y2) / mag
    // Math.min(Math.max(cosine, -1), 1) clamps the cosine between -1 and 1
    return Math.acos(Math.min(Math.max(cosine, -1), 1))
}

/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec2} a vector to represent as a string
 * @returns string representation of the vector
 */
export function str(a): string {
    return 'vec2(' + a[0] + ', ' + a[1] + ')'
}

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns True if the vectors are equal, false otherwise.
 */
export function exactEquals(a, b): boolean {
    return a[0] === b[0] && a[1] === b[1]
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns True if the vectors are equal, false otherwise.
 */
export function equals(a, b): boolean {
    const a0 = a[0],
        a1 = a[1]
    const b0 = b[0],
        b1 = b[1]
    return (
        Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1))
    )
}

/**
 * Alias for {@link vec2.length}
 * @function
 */
export const len = length

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
export const sub = subtract

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
export const mul = multiply

/**
 * Alias for {@link vec2.divide}
 * @function
 */
export const div = divide

/**
 * Alias for {@link vec2.distance}
 * @function
 */
export const dist = distance

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
export const sqrDist = squaredDistance

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
export const sqrLen = squaredLength

/**
 * Perform some operation over an array of Vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each Vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of Vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
export const forEach = (function () {
    const vec = create()

    return function (a, stride, offset, count, fn, arg) {
        let i, l
        if (!stride) {
            stride = 2
        }

        if (!offset) {
            offset = 0
        }

        if (count) {
            l = Math.min(count * stride + offset, a.length)
        } else {
            l = a.length
        }

        for (i = offset; i < l; i += stride) {
            vec[0] = a[i]
            vec[1] = a[i + 1]
            fn(vec, vec, arg)
            a[i] = vec[0]
            a[i + 1] = vec[1]
        }

        return a
    }
})()
