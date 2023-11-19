export function random(max: number): number {
    return Math.random() * max
}
export function random_from(min: number, max: number): number {
    return Math.random() * (max - min) + min
}
export function random_int(max: number): number {
    return Math.floor(Math.random() * max)
}
export function random_int_from(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min
}
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}
export function remainder(a: number, b: number): number {
    return ((a % b) + b) % b
}
export function wrap(value: number, min: number, max: number): number {
    return remainder(value - min, max - min) + min
}
export function bounce(value: number, min: number, max: number): number {
    const range = max - min,
        rem = wrap(value - min, 0, 2 * range),
        distance = Math.abs(rem - range)
    return max - distance
}

/**
 * Linear interpolation
 * @param start Start value
 * @param end End value
 * @param t Interpolation factor
 *
 * ```ts
 * start + (end - start) * t
 * ```
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t
}

export function map_range(
    value: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number,
): number {
    return ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
}

export function to_percent(value: number, min: number, max: number): number {
    return (value - min) / (max - min)
}

/**
 * Symmetric round
 * see https://www.npmjs.com/package/round-half-up-symmetric#user-content-detailed-background
 *
 * @param a value to round
 */
export function round(a: number): number {
    return a >= 0 || a % 0.5 !== 0 ? Math.round(a) : Math.floor(a)
}

const DEGREE: number = Math.PI / 180

/**
 * Convert Degree To Radian
 *
 * @param a Angle in Degrees
 */
export function to_radian(a: number): number {
    return a * DEGREE
}

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of Number.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param a The first number to test.
 * @param b The second number to test.
 * @returns True if the numbers are approximately equal, false otherwise.
 */
export function equals(a: number, b: number): boolean {
    return Math.abs(a - b) <= Number.EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b))
}

export function between(a: number, b: number, c: number): boolean {
    if (a > c) [a, c] = [c, a]
    return a - Number.EPSILON <= b && b <= c + Number.EPSILON
}
export function ranges_intersecting(a1: number, b1: number, a2: number, b2: number): boolean {
    if (a1 > b1) [a1, b1] = [b1, a1]
    if (a2 > b2) [a2, b2] = [b2, a2]
    return a1 <= b2 && a2 <= b1
}
