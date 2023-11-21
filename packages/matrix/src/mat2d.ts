/**
 * 2x3 Matrix
 * @module mat2d
 * @description
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, b,
 *  c, d,
 *  tx, ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, b, 0,
 *  c, d, 0,
 *  tx, ty, 1]
 * </pre>
 * The last column is ignored so the array is shorter and operations are faster.
 */

/**
 * Creates a new identity mat2d
 *
 * @returns a new 2x3 matrix
 */
export function create(): mat2d {
    let out = new array_constructor(6)
    if (array_constructor != Float32Array) {
        out[1] = 0
        out[2] = 0
        out[4] = 0
        out[5] = 0
    }
    out[0] = 1
    out[3] = 1
    return out
}

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {ReadonlyMat2d} a matrix to clone
 * @returns a new 2x3 matrix
 */
export function clone(a): mat2d {
    let out = new array_constructor(6)
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    out[3] = a[3]
    out[4] = a[4]
    out[5] = a[5]
    return out
}

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the source matrix
 * @returns out
 */
export function copy(out, a): mat2d {
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    out[3] = a[3]
    out[4] = a[4]
    out[5] = a[5]
    return out
}

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns out
 */
export function identity(out): mat2d {
    out[0] = 1
    out[1] = 0
    out[2] = 0
    out[3] = 1
    out[4] = 0
    out[5] = 0
    return out
}

/**
 * Create a new mat2d with the given values
 *
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns A new mat2d
 */
export function fromValues(a, b, c, d, tx, ty): mat2d {
    let out = new array_constructor(6)
    out[0] = a
    out[1] = b
    out[2] = c
    out[3] = d
    out[4] = tx
    out[5] = ty
    return out
}

/**
 * Set the components of a mat2d to the given values
 *
 * @param {mat2d} out the receiving matrix
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns out
 */
export function set(out, a, b, c, d, tx, ty): mat2d {
    out[0] = a
    out[1] = b
    out[2] = c
    out[3] = d
    out[4] = tx
    out[5] = ty
    return out
}

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the source matrix
 * @returns out
 */
export function invert(out, a): mat2d {
    let aa = a[0],
        ab = a[1],
        ac = a[2],
        ad = a[3]
    let atx = a[4],
        aty = a[5]

    let det = aa * ad - ab * ac
    if (!det) {
        return null
    }
    det = 1.0 / det

    out[0] = ad * det
    out[1] = -ab * det
    out[2] = -ac * det
    out[3] = aa * det
    out[4] = (ac * aty - ad * atx) * det
    out[5] = (ab * atx - aa * aty) * det
    return out
}

/**
 * Calculates the determinant of a mat2d
 *
 * @param {ReadonlyMat2d} a the source matrix
 * @returns determinant of a
 */
export function determinant(a): Number {
    return a[0] * a[3] - a[1] * a[2]
}

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns out
 */
export function multiply(out, a, b): mat2d {
    let a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        a4 = a[4],
        a5 = a[5]
    let b0 = b[0],
        b1 = b[1],
        b2 = b[2],
        b3 = b[3],
        b4 = b[4],
        b5 = b[5]
    out[0] = a0 * b0 + a2 * b1
    out[1] = a1 * b0 + a3 * b1
    out[2] = a0 * b2 + a2 * b3
    out[3] = a1 * b2 + a3 * b3
    out[4] = a0 * b4 + a2 * b5 + a4
    out[5] = a1 * b4 + a3 * b5 + a5
    return out
}

/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns out
 */
export function rotate(out, a, rad): mat2d {
    let a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        a4 = a[4],
        a5 = a[5]
    let s = Math.sin(rad)
    let c = Math.cos(rad)
    out[0] = a0 * c + a2 * s
    out[1] = a1 * c + a3 * s
    out[2] = a0 * -s + a2 * c
    out[3] = a1 * -s + a3 * c
    out[4] = a4
    out[5] = a5
    return out
}

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to translate
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
export function scale(out, a, v) {
    let a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        a4 = a[4],
        a5 = a[5]
    let v0 = v[0],
        v1 = v[1]
    out[0] = a0 * v0
    out[1] = a1 * v0
    out[2] = a2 * v1
    out[3] = a3 * v1
    out[4] = a4
    out[5] = a5
    return out
}

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to translate
 * @param {ReadonlyVec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
export function translate(out, a, v) {
    let a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        a4 = a[4],
        a5 = a[5]
    let v0 = v[0],
        v1 = v[1]
    out[0] = a0
    out[1] = a1
    out[2] = a2
    out[3] = a3
    out[4] = a0 * v0 + a2 * v1 + a4
    out[5] = a1 * v0 + a3 * v1 + a5
    return out
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.rotate(dest, dest, rad);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns out
 */
export function fromRotation(out, rad): mat2d {
    let s = Math.sin(rad),
        c = Math.cos(rad)
    out[0] = c
    out[1] = s
    out[2] = -s
    out[3] = c
    out[4] = 0
    out[5] = 0
    return out
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.scale(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {ReadonlyVec2} v Scaling vector
 * @returns out
 */
export function fromScaling(out, v): mat2d {
    out[0] = v[0]
    out[1] = 0
    out[2] = 0
    out[3] = v[1]
    out[4] = 0
    out[5] = 0
    return out
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.translate(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {ReadonlyVec2} v Translation vector
 * @returns out
 */
export function fromTranslation(out, v): mat2d {
    out[0] = 1
    out[1] = 0
    out[2] = 0
    out[3] = 1
    out[4] = v[0]
    out[5] = v[1]
    return out
}

/**
 * Returns a string representation of a mat2d
 *
 * @param {ReadonlyMat2d} a matrix to represent as a string
 * @returns string representation of the matrix
 */
export function str(a): String {
    return (
        'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' + a[4] + ', ' + a[5] + ')'
    )
}

/**
 * Returns Frobenius norm of a mat2d
 *
 * @param {ReadonlyMat2d} a the matrix to calculate Frobenius norm of
 * @returns Frobenius norm
 */
export function frob(a): Number {
    return Math.sqrt(
        a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + 1,
    )
}

/**
 * Adds two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns out
 */
export function add(out, a, b): mat2d {
    out[0] = a[0] + b[0]
    out[1] = a[1] + b[1]
    out[2] = a[2] + b[2]
    out[3] = a[3] + b[3]
    out[4] = a[4] + b[4]
    out[5] = a[5] + b[5]
    return out
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns out
 */
export function subtract(out, a, b): mat2d {
    out[0] = a[0] - b[0]
    out[1] = a[1] - b[1]
    out[2] = a[2] - b[2]
    out[3] = a[3] - b[3]
    out[4] = a[4] - b[4]
    out[5] = a[5] - b[5]
    return out
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns out
 */
export function multiplyScalar(out, a, b): mat2d {
    out[0] = a[0] * b
    out[1] = a[1] * b
    out[2] = a[2] * b
    out[3] = a[3] * b
    out[4] = a[4] * b
    out[5] = a[5] * b
    return out
}

/**
 * Adds two mat2d's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2d} out the receiving vector
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns out
 */
export function multiplyScalarAndAdd(out, a, b, scale): mat2d {
    out[0] = a[0] + b[0] * scale
    out[1] = a[1] + b[1] * scale
    out[2] = a[2] + b[2] * scale
    out[3] = a[3] + b[3] * scale
    out[4] = a[4] + b[4] * scale
    out[5] = a[5] + b[5] * scale
    return out
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat2d} a The first matrix.
 * @param {ReadonlyMat2d} b The second matrix.
 * @returns True if the matrices are equal, false otherwise.
 */
export function exactEquals(a, b): Boolean {
    return (
        a[0] === b[0] &&
        a[1] === b[1] &&
        a[2] === b[2] &&
        a[3] === b[3] &&
        a[4] === b[4] &&
        a[5] === b[5]
    )
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat2d} a The first matrix.
 * @param {ReadonlyMat2d} b The second matrix.
 * @returns True if the matrices are equal, false otherwise.
 */
export function equals(a, b): Boolean {
    let a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        a4 = a[4],
        a5 = a[5]
    let b0 = b[0],
        b1 = b[1],
        b2 = b[2],
        b3 = b[3],
        b4 = b[4],
        b5 = b[5]
    return (
        Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
        Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
        Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
        Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
        Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
        Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5))
    )
}

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
export const mul = multiply

/**
 * Alias for {@link mat2d.subtract}
 * @function
 */
export const sub = subtract
