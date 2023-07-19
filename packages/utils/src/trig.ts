export type Point = { x: number; y: number }
export type VecString = `(${number}, ${number})`

export class Vec {
    x: number
    y: number

    constructor(str: VecString)
    constructor(vec: Point)
    constructor(x: number, y?: number)
    constructor(x: number | VecString | Point, y?: number) {
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
    toJSON(): Point {
        return { x: this.x, y: this.y }
    }
}

export const vec: {
    (str: VecString): Vec
    (vec: Point): Vec
    (x: number, y?: number): Vec
} = (...args: [any]) => new Vec(...args)

export const ZERO = vec(0, 0)
export const zero = () => vec(0, 0)

export function vecEquals(a: Vec, b: Vec): boolean {
    return a.x === b.x && a.y === b.y
}

export function vecSubtract(position: Vec, velocity: Vec): void {
    position.x -= velocity.x
    position.y -= velocity.y
}

export function vecDifference(position: Vec, velocity: Vec): Vec {
    return vec(position.x - velocity.x, position.y - velocity.y)
}

export function vecAdd(position: Vec, velocity: Vec | Force | number): void
export function vecAdd(position: Vec, x: number, y: number): void
export function vecAdd(position: Vec, x: Vec | Force | number, y?: number): void {
    if (typeof x === 'number') {
        position.x += x
        position.y += y ?? x
        return
    }
    if (x instanceof Force) {
        x = forceToVec(x)
    }
    position.x += x.x
    position.y += x.y
}

export function vecSum(position: Vec, velocity: Vec): Vec {
    return vec(position.x + velocity.x, position.y + velocity.y)
}

export function vecMultiply(position: Vec, velocity: Vec | number): void {
    if (typeof velocity === 'number') {
        position.x *= velocity
        position.y *= velocity
        return
    }
    position.x *= velocity.x
    position.y *= velocity.y
}

export function vecProduct(position: Vec, velocity: Vec): Vec {
    return vec(position.x * velocity.x, position.y * velocity.y)
}

export function vecDivide(position: Vec, velocity: Vec): void {
    position.x /= velocity.x
    position.y /= velocity.y
}

export function vecQuotient(position: Vec, velocity: Vec): Vec {
    return vec(position.x / velocity.x, position.y / velocity.y)
}

export function vecDistance(a: Vec, b: Vec): number {
    const x = a.x - b.x
    const y = a.y - b.y
    return Math.sqrt(x * x + y * y)
}

export function vecAngle(a: Vec, b: Vec): number {
    return Math.atan2(b.y - a.y, b.x - a.x)
}

export class Force {
    distance: number
    angle: number

    constructor(a: Vec, b: Vec)
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

export const force: {
    (a: Vec, b: Vec): Force
    (distance: number, angle: number): Force
} = (...args: [any, any]) => new Force(...args)

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

export type Segment = [Vec, Vec]
