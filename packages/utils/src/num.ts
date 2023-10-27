export const random = (max: number): number => Math.random() * max
export const random_from = (min: number, max: number): number => Math.random() * (max - min) + min

export const random_int = (max: number): number => Math.floor(Math.random() * max)
export const random_int_from = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min)) + min

export const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max)

export const remainder = (a: number, b: number): number => ((a % b) + b) % b

export const wrap = (value: number, min: number, max: number): number =>
    remainder(value - min, max - min) + min

export const bounce = (value: number, min: number, max: number): number => {
    const range = max - min,
        rem = wrap(value - min, 0, 2 * range),
        distance = Math.abs(rem - range)
    return max - distance
}

/**
 * Linear interpolation
 */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const map_range = (
    value: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number,
): number => ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min

export const to_percent = (value: number, min: number, max: number): number =>
    (value - min) / (max - min)

export const number_equals = (a: number, b: number): boolean => Math.abs(a - b) < Number.EPSILON

export const between = (a: number, b: number, c: number): boolean => {
    if (a > c) [a, c] = [c, a]
    return a - Number.EPSILON <= b && b <= c + Number.EPSILON
}

export const ranges_intersecting = (a1: number, b1: number, a2: number, b2: number): boolean => {
    if (a1 > b1) [a1, b1] = [b1, a1]
    if (a2 > b2) [a2, b2] = [b2, a2]
    return a1 <= b2 && a2 <= b1
}
