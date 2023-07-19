import type { Position } from './types'

/**
 * Represents a template string type in the format `(${number}, ${number})`.
 *
 * Useful for storing in a Set or Map to check if a point exists.
 */
export type VecString = `(${number}, ${number})`

/**
 * Represents a 2D vector with x and y components.
 */
export class Vec {
    x: number
    y: number

    /**
     * Creates a new Vec instance.
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
    constructor(str: VecString)
    constructor(vec: Position)
    constructor(x: number, y?: number)
    constructor(x: number | VecString | Position, y?: number) {
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
    toString(): VecString {
        return `(${this.x}, ${this.y})`
    }
    toJSON(): Position {
        return { x: this.x, y: this.y }
    }
}

/**
 * Creates a new Vec instance.
 */
export const vec: {
    (str: VecString): Vec
    (vec: Position): Vec
    (x: number, y?: number): Vec
} = (...args: [any]) => new Vec(...args)

/**
 * A constant Vec representing the zero vector.
 */
export const ZERO = vec(0, 0)

/**
 * Creates a new Vec instance representing the zero vector.
 * @returns A Vec instance representing the zero vector.
 */
export const zero = () => vec(0, 0)

/**
 * Checks if two vectors are equal.
 */
export function vecEquals(a: Vec, b: Vec): boolean {
    return a.x === b.x && a.y === b.y
}

/**
 * Subtracts a vector from another vector in place. The first vector is **mutated**.
 */
export function vecSubtract(a: Vec, b: Vec): void {
    a.x -= b.x
    a.y -= b.y
}

/**
 * Calculates the difference between two vectors.
 * @returns The difference vector.
 */
export function vecDifference(a: Vec, b: Vec): Vec {
    return vec(a.x - b.x, a.y - b.y)
}

/**
 * Adds a vector or a force to another vector in place. The first vector is **mutated**.
 */
export function vecAdd(vec: Vec, velocity: Vec | Force | number): void
export function vecAdd(vec: Vec, x: number, y: number): void
export function vecAdd(vec: Vec, x: Vec | Force | number, y?: number): void {
    if (typeof x === 'number') {
        vec.x += x
        vec.y += y ?? x
        return
    }
    if (x instanceof Force) {
        x = forceToVec(x)
    }
    vec.x += x.x
    vec.y += x.y
}

/**
 * Calculates the sum of two vectors.
 * @returns The sum vector.
 */
export function vecSum(a: Vec, b: Vec): Vec {
    return vec(a.x + b.x, a.y + b.y)
}

/**
 * Multiplies a vector by another vector or a scalar in place. The first vector is **mutated**.
 */
export function vecMultiply(a: Vec, b: Vec | number): void {
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
export function vecProduct(a: Vec, b: Vec): Vec {
    return vec(a.x * b.x, a.y * b.y)
}

/**
 * Divides a vector by another vector in place. The first vector is **mutated**.
 */
export function vecDivide(a: Vec, b: Vec): void {
    a.x /= b.x
    a.y /= b.y
}

/**
 * Calculates the quotient of two vectors.
 * (The first vector is divided by the second vector.)
 * @returns The quotient vector.
 */
export function vecQuotient(a: Vec, b: Vec): Vec {
    return vec(a.x / b.x, a.y / b.y)
}

/**
 * Calculates the distance between two vectors.
 * @returns The distance between the vectors.
 */
export function vecDistance(a: Vec, b: Vec): number {
    const x = a.x - b.x
    const y = a.y - b.y
    return Math.sqrt(x * x + y * y)
}

/**
 * Calculates the angle between two vectors.
 * @returns The angle between the vectors in radians.
 */
export function vecAngle(a: Vec, b: Vec): number {
    return Math.atan2(b.y - a.y, b.x - a.x)
}

/**
 * Rotates the {@link point} vector by {@link rad} angle (origin is 0,0).
 * The first vector is **mutated**.
 */
export function vecRotate(point: Vec, rad: number): void {
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
export function vecRotateAround(point: Vec, origin: Vec, rad: number): void {
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
    constructor(delta_x: Vec, delta_y: Vec)
    constructor(distance: number, angle: number)
    constructor(a: number | Vec, b: number | Vec) {
        if (typeof a === 'object') {
            this.angle = vecAngle(a, b as Vec)
            this.distance = vecDistance(a, b as Vec)
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
    (a: Vec, b: Vec): Force
    (distance: number, angle: number): Force
} = (...args: [any, any]) => new Force(...args)

/**
 * Converts a Force object to a Vec object with x and y components.
 */
export function forceToVec(force: Force): Vec
export function forceToVec(distance: number, angle: number): Vec
export function forceToVec(distance: number | Force, angle?: number): Vec {
    if (typeof distance === 'object') {
        angle = distance.angle
        distance = distance.distance
    }
    const x = distance * Math.cos(angle!)
    const y = distance * Math.sin(angle!)
    return vec(x, y)
}

/**
 * Represents a line segment with two endpoints.
 */
export type Segment = [Vec, Vec]
