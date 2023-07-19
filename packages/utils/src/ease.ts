/**
 * No easing, no acceleration
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function linear(t: number): number {
    return t
}

/**
 * Slight acceleration from zero to full speed
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inSine(t: number): number {
    return -1 * Math.cos(t * (Math.PI / 2)) + 1
}

/**
 * Slight deceleration at the end
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function outSine(t: number): number {
    return Math.sin(t * (Math.PI / 2))
}

/**
 * Slight acceleration at beginning and slight deceleration at end
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inOutSine(t: number): number {
    return -0.5 * (Math.cos(Math.PI * t) - 1)
}

/**
 * Accelerating from zero velocity
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inQuad(t: number): number {
    return t * t
}

/**
 * Decelerating to zero velocity
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function outQuad(t: number): number {
    return t * (2 - t)
}

/**
 * Acceleration until halfway, then deceleration
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

/**
 * Accelerating from zero velocity
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inCubic(t: number): number {
    return t * t * t
}

/**
 * Decelerating to zero velocity
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function outCubic(t: number): number {
    const t1 = t - 1
    return t1 * t1 * t1 + 1
}

/**
 * Acceleration until halfway, then deceleration
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
}

/**
 * Accelerating from zero velocity
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inQuart(t: number): number {
    return t * t * t * t
}

/**
 * Decelerating to zero velocity
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function outQuart(t: number): number {
    const a = t - 1
    return 1 - a * a * a * a
}

/**
 * Acceleration until halfway, then deceleration
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inOutQuart(t: number): number {
    const a = t - 1
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * a * a * a * a
}

/**
 * Accelerating from zero velocity
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inQuint(t: number): number {
    return t * t * t * t * t
}

/**
 * Decelerating to zero velocity
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function outQuint(t: number): number {
    const a = t - 1
    return 1 + a * a * a * a * a
}

/**
 * Acceleration until halfway, then deceleration
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inOutQuint(t: number): number {
    const a = t - 1
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * a * a * a * a * a
}

/**
 * Accelerate exponentially until finish
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inExpo(t: number): number {
    if (t === 0) {
        return 0
    }
    return Math.pow(2, 10 * (t - 1))
}

/**
 * Initial exponential acceleration slowing to stop
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function outExpo(t: number): number {
    return t === 1 ? 1 : -Math.pow(2, -10 * t) + 1
}

/**
 * Exponential acceleration and deceleration
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inOutExpo(t: number): number {
    if (t === 0 || t === 1) return t
    const a = t * 2,
        b = a - 1
    return a < 1 ? 0.5 * Math.pow(2, 10 * b) : 0.5 * (-Math.pow(2, -10 * b) + 2)
}

/**
 * Increasing velocity until stop
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inCirc(t: number): number {
    const a = t / 1
    return -1 * (Math.sqrt(1 - a * t) - 1)
}

/**
 * Start fast, decreasing velocity until stop
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function outCirc(t: number): number {
    const a = t - 1
    return Math.sqrt(1 - a * a)
}

/**
 * Fast increase in velocity, fast decrease in velocity
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inOutCirc(t: number): number {
    const a = t * 2,
        b = a - 2
    return a < 1 ? -0.5 * (Math.sqrt(1 - a * a) - 1) : 0.5 * (Math.sqrt(1 - b * b) + 1)
}

/**
 * Slow movement backwards then fast snap to finish
 * @param t - The current time (between 0 and 1)
 * @param magnitude - The magnitude of the easing (default: 1.70158)
 * @returns The eased value
 */
export function inBack(t: number, magnitude = 1.70158): number {
    return t * t * ((magnitude + 1) * t - magnitude)
}

/**
 * Fast snap to backwards point then slow resolve to finish
 * @param t - The current time (between 0 and 1)
 * @param magnitude - The magnitude of the easing (default: 1.70158)
 * @returns The eased value
 */
export function outBack(t: number, magnitude = 1.70158): number {
    const a = t / 1 - 1
    return a * a * ((magnitude + 1) * a + magnitude) + 1
}

/**
 * Slow movement backwards, fast snap to past finish, slow resolve to finish
 * @param t - The current time (between 0 and 1)
 * @param magnitude - The magnitude of the easing (default: 1.70158)
 * @returns The eased value
 */
export function inOutBack(t: number, magnitude = 1.70158): number {
    const a = t * 2,
        b = a - 2,
        s = magnitude * 1.525
    return a < 1 ? 0.5 * a * a * ((s + 1) * a - s) : 0.5 * (b * b * ((s + 1) * b + s) + 2)
}

/**
 * Bounces slowly then quickly to finish
 * @param t - The current time (between 0 and 1)
 * @param magnitude - The magnitude of the easing (default: 0.7)
 * @returns The eased value
 */
export function inElastic(t: number, magnitude = 0.7): number {
    if (t === 0 || t === 1) return t
    const a = t / 1,
        b = a - 1,
        p = 1 - magnitude,
        s = (p / (2 * Math.PI)) * Math.asin(1)
    return -(Math.pow(2, 10 * b) * Math.sin(((b - s) * (2 * Math.PI)) / p))
}

/**
 * Fast acceleration, bounces to zero
 * @param t - The current time (between 0 and 1)
 * @param magnitude - The magnitude of the easing (default: 0.7)
 * @returns The eased value
 */
export function outElastic(t: number, magnitude = 0.7): number {
    const p = 1 - magnitude,
        a = t * 2
    if (t === 0 || t === 1) return t
    const s = (p / (2 * Math.PI)) * Math.asin(1)
    return Math.pow(2, -10 * a) * Math.sin(((a - s) * (2 * Math.PI)) / p) + 1
}

/**
 * Slow start and end, two bounces sandwich a fast motion
 * @param t - The current time (between 0 and 1)
 * @param magnitude - The magnitude of the easing (default: 0.7)
 * @returns The eased value
 */
export function inOutElastic(t: number, magnitude = 0.7): number {
    const p = 1 - magnitude
    if (t === 0 || t === 1) return t
    const a = t * 2,
        b = a - 1,
        s = (p / (2 * Math.PI)) * Math.asin(1)
    return a < 1
        ? -0.5 * (Math.pow(2, 10 * b) * Math.sin(((b - s) * (2 * Math.PI)) / p))
        : Math.pow(2, -10 * b) * Math.sin(((b - s) * (2 * Math.PI)) / p) * 0.5 + 1
}

/**
 * Bounce to completion
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function outBounce(t: number): number {
    const a = t / 1
    if (a < 1 / 2.75) {
        return 7.5625 * a * a
    }
    if (a < 2 / 2.75) {
        const b = a - 1.5 / 2.75
        return 7.5625 * b * b + 0.75
    }
    if (a < 2.5 / 2.75) {
        const b = a - 2.25 / 2.75
        return 7.5625 * b * b + 0.9375
    }
    const b = a - 2.625 / 2.75
    return 7.5625 * b * b + 0.984375
}

/**
 * Bounce increasing in velocity until completion
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inBounce(t: number): number {
    return 1 - outBounce(1 - t)
}

/**
 * Bounce in and bounce out
 * @param t - The current time (between 0 and 1)
 * @returns The eased value
 */
export function inOutBounce(t: number): number {
    return t < 0.5 ? inBounce(t * 2) * 0.5 : outBounce(t * 2 - 1) * 0.5 + 0.5
}
