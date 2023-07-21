import type { Position } from './types'

/**
 * Represents a template string type in the format `(${number}, ${number})`.
 *
 * Useful for storing in a Set or Map to check if a point exists.
 */
export type VectorString = `(${number}, ${number})`

/**
 * Represents a 2D vector with x and y components.
 */
export class Vector {
    x: number
    y: number

    /**
     * Creates a new vector instance.
     * @param str - A string in the format `(${number}, ${number})`.
     *
     * OR
     *
     * @param vec - A Point object to copy the x and y components from.
     *
     * OR
     *
     * @param x - The x-component of the vector.
     * @param y - The y-component of the vector.
     */
    constructor(str: VectorString)
    constructor(vec: Position)
    constructor(x: number, y?: number)
    constructor(x: number | VectorString | Position, y?: number) {
        if (typeof x === 'string') {
            const [xStr, yStr] = x.slice(1, -1).split(', ')
            x = Number(xStr)
            y = Number(yStr)
        } else if (typeof x === 'object') {
            y = x.y
            x = x.x
        }
        this.x = x
        this.y = y ?? x
    }

    *[Symbol.iterator]() {
        yield this.x
        yield this.y
    }
    toString(): VectorString {
        return `(${this.x}, ${this.y})`
    }
    toJSON(): Position {
        return { x: this.x, y: this.y }
    }
}

/**
 * Creates a new vector instance.
 */
export const vector: {
    (str: VectorString): Vector
    (vector: Position): Vector
    (x: number, y?: number): Vector
} = (...args: [any]) => new Vector(...args)

/**
 * A constant vector representing the zero vector.
 */
export const ZERO = vector(0, 0)

/**
 * Creates a new vector instance representing the zero vector.
 * @returns A vector instance representing the zero vector.
 */
export const zero = () => vector(0, 0)

/**
 * Checks if two vectors are equal.
 */
export function vectorEquals(a: Vector, b: Vector): boolean {
    return a.x === b.x && a.y === b.y
}

/**
 * Subtracts a vector from another vector in place. The first vector is **mutated**.
 */
export function vectorSubtract(a: Vector, b: Vector): void {
    a.x -= b.x
    a.y -= b.y
}

/**
 * Calculates the difference between two vectors.
 * @returns The difference vector.
 */
export function vectorDifference(a: Vector, b: Vector): Vector {
    return vector(a.x - b.x, a.y - b.y)
}

/**
 * Adds a vector or a force to another vector in place. The first vector is **mutated**.
 */
export function vectorAdd(vec: Vector, velocity: Vector | Force | number): void
export function vectorAdd(vec: Vector, x: number, y: number): void
export function vectorAdd(vec: Vector, x: Vector | Force | number, y?: number): void {
    if (typeof x === 'number') {
        vec.x += x
        vec.y += y ?? x
        return
    }
    if (x instanceof Force) {
        x = forceTovector(x)
    }
    vec.x += x.x
    vec.y += x.y
}

/**
 * Calculates the sum of two vectors.
 * @returns The sum vector.
 */
export function vectorSum(a: Vector, b: Vector): Vector {
    return vector(a.x + b.x, a.y + b.y)
}

/**
 * Multiplies a vector by another vector or a scalar in place. The first vector is **mutated**.
 */
export function vectorMultiply(a: Vector, b: Vector | number): void {
    if (typeof b === 'number') {
        a.x *= b
        a.y *= b
        return
    }
    a.x *= b.x
    a.y *= b.y
}

/**
 * Calculates the product of two vectors.
 * @returns The product vector.
 */
export function vectorProduct(a: Vector, b: Vector): Vector {
    return vector(a.x * b.x, a.y * b.y)
}

/**
 * Divides a vector by another vector in place. The first vector is **mutated**.
 */
export function vectorDivide(a: Vector, b: Vector): void {
    a.x /= b.x
    a.y /= b.y
}

/**
 * Calculates the quotient of two vectors.
 * (The first vector is divided by the second vector.)
 * @returns The quotient vector.
 */
export function vectorQuotient(a: Vector, b: Vector): Vector {
    return vector(a.x / b.x, a.y / b.y)
}

/**
 * Calculates the distance between two vectors.
 * @returns The distance between the vectors.
 */
export function vectorDistance(a: Vector, b: Vector): number {
    const x = a.x - b.x
    const y = a.y - b.y
    return Math.sqrt(x * x + y * y)
}

/**
 * Calculates the angle between two vectors.
 * @returns The angle between the vectors in radians.
 */
export function vectorAngle(a: Vector, b: Vector): number {
    return Math.atan2(b.y - a.y, b.x - a.x)
}

/**
 * Rotates the {@link point} vector by {@link rad} angle (origin is 0,0).
 * The first vector is **mutated**.
 */
export function vectorRotate(point: Vector, rad: number): void {
    const { x, y } = point,
        cos = Math.cos(rad),
        sin = Math.sin(rad)
    point.x = x * cos - y * sin
    point.y = x * sin + y * cos
}

/**
 * Rotates the {@link point} vector around {@link origin} by {@link rad} angle.
 * The first vector is **mutated**.
 * @param point - The vector to rotate.
 * @param origin - The origin of the rotation.
 * @param rad - The angle of rotation in radians.
 */
export function vectorRotateAround(point: Vector, origin: Vector, rad: number): void {
    const { x, y } = point,
        { x: ox, y: oy } = origin,
        cos = Math.cos(rad),
        sin = Math.sin(rad)
    point.x = ox + (x - ox) * cos - (y - oy) * sin
    point.y = oy + (x - ox) * sin + (y - oy) * cos
}

/**
 * Represents a force with magnitude and angle in 2D space.
 */
export class Force {
    /**
     * The magnitude of the force.
     */
    distance: number

    /**
     * The angle of the force in radians.
     */
    angle: number

    /**
     * Creates a new Force instance.
     * @param delta_x - The x-component of the vector representing the force.
     * @param delta_y - The y-component of the vector representing the force.
     *
     * OR
     *
     * @param distance - The magnitude of the force.
     * @param angle - The angle of the force in radians.
     */
    constructor(delta_x: Vector, delta_y: Vector)
    constructor(distance: number, angle: number)
    constructor(a: number | Vector, b: number | Vector) {
        if (typeof a === 'object') {
            this.angle = vectorAngle(a, b as Vector)
            this.distance = vectorDistance(a, b as Vector)
        } else {
            this.distance = a
            this.angle = b as number
        }
    }

    *[Symbol.iterator]() {
        yield this.distance
        yield this.angle
    }
}

/**
 * Creates a new Force instance.
 */
export const force: {
    (a: Vector, b: Vector): Force
    (distance: number, angle: number): Force
} = (...args: [any, any]) => new Force(...args)

/**
 * Converts a Force object to a vector object with x and y components.
 */
export function forceTovector(f: Force): Vector
export function forceTovector(distance: number, angle: number): Vector
export function forceTovector(distance: number | Force, angle?: number): Vector {
    if (typeof distance === 'object') {
        angle = distance.angle
        distance = distance.distance
    }
    const x = distance * Math.cos(angle!)
    const y = distance * Math.sin(angle!)
    return vector(x, y)
}

/**
 * Represents a line segment with two endpoints.
 */
export type Segment = [Vector, Vector]
