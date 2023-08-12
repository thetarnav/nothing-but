import type { Position } from './types.js'

/**
 * Represents a template string type in the format `(${number}, ${number})`.
 *
 * Useful for storing in a Set or Map to check if a point exists.
 */
export type Vector_String = `(${number}, ${number})`

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
    constructor(str: Vector_String)
    constructor(vec: Position)
    constructor(x: number, y?: number)
    constructor(x: number | Vector_String | Position, y?: number) {
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
    toString(): Vector_String {
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
    (str: Vector_String): Vector
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
export function vec_equals(a: Position, b: Position): boolean {
    return a.x === b.x && a.y === b.y
}

/**
 * Subtracts a vector from another vector in place. The first vector is **mutated**.
 */
export function vec_subtract(a: Position, b: Position): void {
    a.x -= b.x
    a.y -= b.y
}

/**
 * Calculates the difference between two vectors.
 * @returns The difference vector.
 */
export function vec_difference(a: Position, b: Position): Vector {
    return vector(a.x - b.x, a.y - b.y)
}

/**
 * Adds a vector or a force to another vector in place. The first vector is **mutated**.
 */
export function vec_add(vec: Vector, velocity: Position | Force | number): void
export function vec_add(vec: Vector, x: number, y: number): void
export function vec_add(vec: Vector, x: Position | Force | number, y?: number): void {
    if (typeof x === 'number') {
        vec.x += x
        vec.y += y ?? x
        return
    }
    if (x instanceof Force) {
        x = force_to_vector(x)
    }
    vec.x += x.x
    vec.y += x.y
}

/**
 * Calculates the sum of two vectors.
 * @returns The sum vector.
 */
export function vec_sum(a: Position, b: Position): Vector {
    return vector(a.x + b.x, a.y + b.y)
}

/**
 * Multiplies a vector by another vector or a scalar in place. The first vector is **mutated**.
 */
export function vec_multiply(a: Position, b: Position | number): void {
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
export function product(a: Position, b: Position): Vector {
    return vector(a.x * b.x, a.y * b.y)
}

/**
 * Divides a vector by another vector in place. The first vector is **mutated**.
 */
export function vec_divide(a: Position, b: Position): void {
    a.x /= b.x
    a.y /= b.y
}

/**
 * Calculates the quotient of two vectors.
 * (The first vector is divided by the second vector.)
 * @returns The quotient vector.
 */
export function quotient(a: Position, b: Position): Vector {
    return vector(a.x / b.x, a.y / b.y)
}

export function vec_map(vec: Position, fn: (xy: number) => number): Vector {
    return vector(fn(vec.x), fn(vec.y))
}

export function vec_mut(vec: Position, fn: (xy: number) => number): void {
    vec.x = fn(vec.x)
    vec.y = fn(vec.y)
}

/**
 * Calculates the distance between two vectors.
 * @returns The distance between the vectors.
 */
export function distance(a: Position, b: Position): number {
    const x = a.x - b.x
    const y = a.y - b.y
    return Math.sqrt(x * x + y * y)
}

/**
 * Calculates the angle between two vectors.
 * @returns The angle between the vectors in radians.
 */
export function angle(a: Position, b: Position): number {
    return Math.atan2(b.y - a.y, b.x - a.x)
}

/**
 * Rotates the {@link point} vector by {@link rad} angle (origin is 0,0).
 * The first vector is **mutated**.
 */
export function vec_rotate(point: Vector, rad: number): void {
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
export function vec_rotate_around(point: Vector, origin: Vector, rad: number): void {
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
            this.angle = angle(a, b as Vector)
            this.distance = distance(a, b as Vector)
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
export function force_to_vector(f: Force): Vector
export function force_to_vector(distance: number, angle: number): Vector
export function force_to_vector(distance: number | Force, angle?: number): Vector {
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
