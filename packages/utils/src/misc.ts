import { AnyClass, Noop } from './types'

/** no operation */
export const noop = (() => void 0) as Noop
export const trueFn: () => boolean = () => true
export const falseFn: () => boolean = () => false

/**
 * `a ^ b`
 */
export const XOR = (a: boolean, b: boolean) => (a ? !b : b)

/**
 * Get entries of an object
 */
export const entries = Object.entries as <T extends object>(obj: T) => [keyof T, T[keyof T]][]

/**
 * Get keys of an object
 */
export const keys = Object.keys as <T extends object>(object: T) => (keyof T)[]

/**
 * Check if a value is a PlainObject. A PlainObject is an object with no prototype.
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    (value && Object.getPrototypeOf(value) === Object.prototype) as any

/**
 * Check if the value is an instance of ___
 */
export const isOfClass = (v: any, c: AnyClass): boolean =>
    v instanceof c || (v && v.constructor === c)

/**
 * `a != null` is equivalent to `a !== null && a !== undefined`.
 *
 * Useful for filtering out `null` and `undefined` from an array.
 */
export const isNonNullable = <T>(i: T): i is NonNullable<T> => i != null

/**
 * Returns a function that will call all functions in the order they were chained with the same arguments.
 */
export function chain<Args extends [] | any[]>(callbacks: {
    [Symbol.iterator](): IterableIterator<((...args: Args) => any) | undefined>
}): (...args: Args) => void {
    return (...args: Args) => {
        for (const callback of callbacks) callback && callback(...args)
    }
}

/**
 * Returns a function that will call all functions in the reversed order with the same arguments.
 */
export function reverseChain<Args extends [] | any[]>(
    callbacks: (((...args: Args) => any) | undefined)[],
): (...args: Args) => void {
    return (...args: Args) => {
        for (let i = callbacks.length - 1; i >= 0; i--) {
            const callback = callbacks[i]
            callback && callback(...args)
        }
    }
}
