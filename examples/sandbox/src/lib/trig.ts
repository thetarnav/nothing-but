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

export const ZERO_VEC = new Vector(0, 0)
