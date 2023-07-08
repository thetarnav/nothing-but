export type Pointable = { get x(): number; get y(): number }
export type VecString = `(${number}, ${number})`

export class Vector {
    x: number
    y: number

    constructor(str: VecString)
    constructor(vec: Pointable)
    constructor(x: number, y?: number)
    constructor(x: number | VecString | Pointable, y?: number) {
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

    get 0() {
        return this.x
    }
    get 1() {
        return this.y
    }

    *[Symbol.iterator]() {
        yield this.x
        yield this.y
    }

    toString(): VecString {
        return `(${this.x}, ${this.y})`
    }
    toJSON() {
        return { x: this.x, y: this.y }
    }
}

export const vec: {
    (str: VecString): Vector
    (vec: Pointable): Vector
    (x: number, y?: number): Vector
} = (...args: [any]) => new Vector(...args)

export const ZERO_VEC = vec(0, 0)

export const zero = () => vec(0, 0)

export function vec_equals(a: Vector, b: Vector): boolean {
    return a.x === b.x && a.y === b.y
}

export function force_vec(distance: number, angle: number): Vector {
    const x = distance * Math.cos(angle)
    const y = distance * Math.sin(angle)
    return vec(x, y)
}

export function vec_subtract(position: Vector, velocity: Vector): void {
    position.x -= velocity.x
    position.y -= velocity.y
}

export function vec_difference(position: Vector, velocity: Vector): Vector {
    return vec(position.x - velocity.x, position.y - velocity.y)
}

export function vec_add(position: Vector, velocity: Vector): void {
    position.x += velocity.x
    position.y += velocity.y
}

export function vec_sum(position: Vector, velocity: Vector): Vector {
    return vec(position.x + velocity.x, position.y + velocity.y)
}

export function vec_multiply(position: Vector, velocity: Vector | number): void {
    if (typeof velocity === 'number') {
        position.x *= velocity
        position.y *= velocity
        return
    }
    position.x *= velocity.x
    position.y *= velocity.y
}

export function vec_product(position: Vector, velocity: Vector): Vector {
    return vec(position.x * velocity.x, position.y * velocity.y)
}

export function vec_divide(position: Vector, velocity: Vector): void {
    position.x /= velocity.x
    position.y /= velocity.y
}

export function vec_quotient(position: Vector, velocity: Vector): Vector {
    return vec(position.x / velocity.x, position.y / velocity.y)
}

export function vec_distance(a: Vector, b: Vector): number {
    const x = a.x - b.x
    const y = a.y - b.y
    return Math.sqrt(x * x + y * y)
}

export function vec_angle(a: Vector, b: Vector): number {
    return Math.atan2(b.y - a.y, b.x - a.x)
}

export type Segment = [Vector, Vector]
