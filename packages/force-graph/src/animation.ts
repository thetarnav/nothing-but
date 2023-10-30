import {Num} from '@nothing-but/utils'

export type AnimationLoop = {
    /**
     * User callback to be called on each animation frame.
     */
    callback: FrameRequestCallback
    /**
     * {@link loopFrame} bound to this loop.
     */
    frame: FrameRequestCallback
    /**
     * The current frame id returned by {@link requestAnimationFrame}.
     */
    frame_id: number
}

export const animationLoop = (callback: FrameRequestCallback): AnimationLoop => {
    const loop: AnimationLoop = {
        callback: callback,
        frame: t => loopFrame(loop, t),
        frame_id: 0,
    }
    return loop
}
export const loopFrame = (loop: AnimationLoop, time: number): void => {
    loop.frame_id = requestAnimationFrame(loop.frame)
    loop.callback(time)
}
export const loopStart = (loop: AnimationLoop): void => {
    loop.frame_id ||= requestAnimationFrame(loop.frame)
}
export const loopClear = (loop: AnimationLoop): void => {
    cancelAnimationFrame(loop.frame_id)
    loop.frame_id = 0
}

export const DEFAULT_TARGET_FPS = 44

export type FrameIterationsLimit = {
    target_fps: number
    last_timestamp: number
}

export const frameIterationsLimit = (
    target_fps: number = DEFAULT_TARGET_FPS,
): FrameIterationsLimit => ({
    target_fps,
    last_timestamp: performance.now(),
})
export const calcIterations = (limit: FrameIterationsLimit, current_time: number): number => {
    const target_ms = 1000 / limit.target_fps
    const delta_time = current_time - limit.last_timestamp
    const times = Math.floor(delta_time / target_ms)
    limit.last_timestamp += times * target_ms
    return times
}

export type AlphaUpdateSteps = {
    increment: number
    decrement: number
}
export const DEFAULT_ALPHA_UPDATE_STEPS: AlphaUpdateSteps = {
    increment: 0.03,
    decrement: 0.005,
}
export const updateAlpha = (
    alpha: number,
    is_playing: boolean,
    update_steps = DEFAULT_ALPHA_UPDATE_STEPS,
): number => {
    return is_playing
        ? Num.lerp(alpha, 1, update_steps.increment)
        : Num.lerp(alpha, 0, update_steps.decrement)
}

export const DEFAULT_BUMP_TIMEOUT_DURATION = 2000

export const bump = (
    bump_end: number,
    duration: number = DEFAULT_BUMP_TIMEOUT_DURATION,
): number => {
    const start = performance.now()
    const end = start + duration
    return end > bump_end ? end : bump_end
}
