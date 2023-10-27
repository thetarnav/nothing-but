import {Num} from '@nothing-but/utils'

export interface Options {
    readonly onIteration: (alpha: number) => void
    readonly onFrame: () => void
    readonly target_fps: number
    readonly max_iterations_per_frame: number
    readonly bump_timeout: number
}

export const DEFAULT_OPTIONS = {
    target_fps: 44,
    max_iterations_per_frame: 2,
    bump_timeout: 2000,
} as const satisfies Partial<Options>

export interface FrameAnimation {
    options: Options
    alpha: number
    active: boolean
    frame_id: number
    last_timestamp: number
    bump_timeout: undefined | ReturnType<typeof setTimeout>
}

export function frameAnimation(options: Options): FrameAnimation {
    return {
        options,
        last_timestamp: performance.now(),
        alpha: 0,
        active: false,
        frame_id: 0,
        bump_timeout: undefined,
    }
}

export function frame(a: FrameAnimation, timestamp: DOMHighResTimeStamp): void {
    const {options} = a
    const target_ms = 1000 / options.target_fps

    const delta_time = timestamp - a.last_timestamp
    const times = Math.floor(delta_time / target_ms)
    a.last_timestamp += times * target_ms

    if (times === 0) {
        a.frame_id = requestAnimationFrame(t => frame(a, t))
        return
    }

    const is_playing = isPlaying(a)

    for (let i = Math.min(times, options.max_iterations_per_frame); i > 0; i--) {
        a.alpha = Num.lerp(
            a.alpha,
            is_playing ? 1 : 0,
            is_playing ? 0.03 : 0.005, // TODO: configurable
        )

        if (a.alpha < 0.001) {
            cleanup(a)
            return
        }

        options.onIteration(a.alpha)
    }

    options.onFrame()

    a.frame_id = requestAnimationFrame(t => frame(a, t))
}

export function start(a: FrameAnimation): void {
    if (a.active) return

    a.active = true
    a.last_timestamp = performance.now()
    a.frame_id = requestAnimationFrame(t => frame(a, t))
}

export function pause(a: FrameAnimation): void {
    a.active = false
}

export function cleanup(a: FrameAnimation): void {
    cancelAnimationFrame(a.frame_id)
    clearTimeout(a.bump_timeout)
    a.alpha = 0
    a.active = false
    a.bump_timeout = undefined
}

export function bump(a: FrameAnimation): void {
    if (a.bump_timeout) {
        clearTimeout(a.bump_timeout)
    } else {
        a.last_timestamp = performance.now()
        a.frame_id = requestAnimationFrame(t => frame(a, t))
    }

    a.bump_timeout = setTimeout(() => {
        a.bump_timeout = undefined
    }, a.options.bump_timeout)
}

export function isPlaying(a: FrameAnimation): boolean {
    return a.active || !!a.bump_timeout
}

export function requestFrame(a: FrameAnimation): void {
    if (isPlaying(a)) return

    a.last_timestamp = performance.now()
    a.frame_id = requestAnimationFrame(() => a.options.onFrame())
}
