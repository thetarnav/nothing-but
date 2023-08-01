export {}

declare module 'solid-js' {
    namespace JSX {
        interface CustomEvents {
            mousedown: MouseEvent
            keydown: KeyboardEvent
            click: MouseEvent
            pointerover: PointerEvent
            pointerout: PointerEvent
            pointerdown: PointerEvent
            touchstart: TouchEvent
        }
    }
}
