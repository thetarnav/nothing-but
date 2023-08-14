import type { Position } from './types.js'

export const PASSIVE = { passive: true } as const
export const NOT_PASSIVE = { passive: false } as const

export function preventCancelable(e: Event): Event {
    if (e.cancelable) e.preventDefault()
    return e
}

export function preventDefault(e: Event): Event {
    e.preventDefault()
    return e
}

export function stopPropagation(e: Event): Event {
    e.stopPropagation()
    return e
}

export function stopImmediatePropagation(e: Event): Event {
    e.stopImmediatePropagation()
    return e
}

export function preventMobileScrolling(container: HTMLElement): void {
    container.addEventListener('touchstart', preventCancelable, NOT_PASSIVE)
    container.addEventListener('touchmove', preventCancelable, NOT_PASSIVE)
}

export function positionInElement(
    e: { readonly clientX: number; readonly clientY: number },
    el: HTMLElement,
): Position {
    const rect = el.getBoundingClientRect()
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
    }
}
