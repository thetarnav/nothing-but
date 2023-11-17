/**
 * Resizes the canvas to match the size it is being displayed.
 * @param canvas the canvas to resize
 * @returns `true` if the canvas was resized
 */
export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean {
    // Get the size the browser is displaying the canvas in device pixels.
    const dpr = window.devicePixelRatio
    const {width, height} = canvas.getBoundingClientRect()
    const display_width = Math.round(width * dpr)
    const display_height = Math.round(height * dpr)

    // Check if the canvas is not the same size.
    const need_resize = canvas.width != display_width || canvas.height != display_height

    if (need_resize) {
        canvas.width = display_width
        canvas.height = display_height
    }

    return need_resize
}

export interface CanvasResizeObserver {
    /**
     * Canvas was resized since last check.
     * Set it to `false` to reset.
     */
    resized: boolean
    canvas: HTMLCanvasElement
    observer: ResizeObserver
}

export function resizeCanvasObserver(observer: CanvasResizeObserver): boolean {
    const resized = resizeCanvasToDisplaySize(observer.canvas)
    observer.resized ||= resized
    return resized
}

export function makeCanvasResizeObserver(canvas: HTMLCanvasElement): CanvasResizeObserver {
    const canvas_observer: CanvasResizeObserver = {
        resized: false,
        canvas,
        observer: null!,
    }
    canvas_observer.observer = new ResizeObserver(resizeCanvasObserver.bind(null, canvas_observer))
    void resizeCanvasObserver(canvas_observer)
    canvas_observer.observer.observe(canvas)
    return canvas_observer
}

export function cleanCanvasResizeObserver(observer: CanvasResizeObserver): void {
    observer.observer.disconnect()
}
