import * as T from './types.js'

export type EventListenerOptions = boolean | AddEventListenerOptions

export type TargetEventMapMap =
    | {target: Window; map: WindowEventMap}
    | {target: Document | XMLDocument; map: DocumentEventMap}
    | {target: HTMLBodyElement; map: HTMLBodyElementEventMap}
    | {target: HTMLFrameSetElement; map: HTMLFrameSetElementEventMap}
    | {target: HTMLMediaElement; map: HTMLMediaElementEventMap}
    | {target: HTMLVideoElement; map: HTMLVideoElementEventMap}
    | {target: HTMLElement; map: HTMLElementEventMap}
    | {target: SVGSVGElement; map: SVGSVGElementEventMap}
    | {target: SVGElement; map: SVGElementEventMap}
    | {target: MathMLElement; map: MathMLElementEventMap}
    | {target: Element; map: ElementEventMap}
    | {target: AbortSignal; map: AbortSignalEventMap}
    | {target: AbstractWorker; map: AbstractWorkerEventMap}
    | {target: Animation; map: AnimationEventMap}
    | {target: BroadcastChannel; map: BroadcastChannelEventMap}
    | {target: CSSAnimation; map: AnimationEventMap}
    | {target: CSSTransition; map: AnimationEventMap}
    | {target: FileReader; map: FileReaderEventMap}
    | {target: IDBDatabase; map: IDBDatabaseEventMap}
    | {target: IDBOpenDBRequest; map: IDBOpenDBRequestEventMap}
    | {target: IDBRequest; map: IDBRequestEventMap}
    | {target: IDBTransaction; map: IDBTransactionEventMap}
    | {target: MediaDevices; map: MediaDevicesEventMap}
    | {target: MediaKeySession; map: MediaKeySessionEventMap}
    | {target: MediaQueryList; map: MediaQueryListEventMap}
    | {target: MediaRecorder; map: MediaRecorderEventMap}
    | {target: MediaSource; map: MediaSourceEventMap}
    | {target: MediaStream; map: MediaStreamEventMap}
    | {target: MediaStreamTrack; map: MediaStreamTrackEventMap}
    | {target: MessagePort; map: MessagePortEventMap}
    | {target: Notification; map: NotificationEventMap}
    | {target: PaymentRequest; map: PaymentRequestEventMap}
    | {target: Performance; map: PerformanceEventMap}
    | {target: PermissionStatus; map: PermissionStatusEventMap}
    | {target: PictureInPictureWindow; map: PictureInPictureWindowEventMap}
    | {target: RemotePlayback; map: RemotePlaybackEventMap}
    | {target: ScreenOrientation; map: ScreenOrientationEventMap}
    | {target: ServiceWorker; map: ServiceWorkerEventMap}
    | {target: ServiceWorkerContainer; map: ServiceWorkerContainerEventMap}
    | {target: ServiceWorkerRegistration; map: ServiceWorkerRegistrationEventMap}
    | {target: ShadowRoot; map: ShadowRootEventMap}
    | {target: SharedWorker; map: AbstractWorkerEventMap}
    | {target: SourceBuffer; map: SourceBufferEventMap}
    | {target: SourceBufferList; map: SourceBufferListEventMap}
    | {target: SpeechSynthesis; map: SpeechSynthesisEventMap}
    | {target: SpeechSynthesisUtterance; map: SpeechSynthesisUtteranceEventMap}
    | {target: VisualViewport; map: VisualViewportEventMap}
    | {target: WebSocket; map: WebSocketEventMap}
    | {target: Worker; map: WorkerEventMap}
    | {target: XMLHttpRequest; map: XMLHttpRequestEventMap}
    | {target: XMLHttpRequestEventTarget; map: XMLHttpRequestEventTargetEventMap}
    | {target: XMLHttpRequestUpload; map: XMLHttpRequestEventTargetEventMap}
    | {target: EventSource; map: EventSourceEventMap}

export type TargetWithEventMap = TargetEventMapMap['target']

export type EventMapOf<TTarget extends TargetWithEventMap> = TargetEventMapMap extends {
    target: TTarget
    map: infer TEventMap
}
    ? TEventMap
    : never

export const PASSIVE = {passive: true} as const
export const NOT_PASSIVE = {passive: false} as const

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

export function ratioInElement(
    e: {readonly clientX: number; readonly clientY: number},
    el: HTMLElement,
): T.Position {
    const rect = el.getBoundingClientRect()
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
    }
}

export function shouldIgnoreKeydown(e: KeyboardEvent): boolean {
    return e.isComposing || e.defaultPrevented || e.target !== document.body
}

// DOM Events
export function listener<
    TTarget extends TargetWithEventMap,
    TEventMap extends EventMapOf<TTarget>,
    TEventType extends keyof TEventMap,
>(
    target: TTarget,
    type: TEventType,
    handler: (event: TEventMap[TEventType]) => void,
    options?: EventListenerOptions,
): VoidFunction

// Custom Events
export function listener<
    TEventMap extends Record<string, Event>,
    TEventType extends keyof TEventMap = keyof TEventMap,
>(
    target: EventTarget,
    type: TEventType,
    handler: (event: TEventMap[TEventType]) => void,
    options?: EventListenerOptions,
): () => void

export function listener(
    target: EventTarget,
    type: string,
    handler: (event: Event) => void,
    options?: EventListenerOptions,
): () => void {
    target.addEventListener(type, handler, options)
    return target.removeEventListener.bind(target, type, handler, options)
}

export type EventHandlerMap<TEventMap> = {
    [EventName in keyof TEventMap]: (event: TEventMap[EventName]) => void
}

// DOM Events
export function listenerMap<
    TTarget extends TargetWithEventMap,
    TEventMap extends EventMapOf<TTarget>,
    THandlersMap extends Partial<EventHandlerMap<TEventMap>>,
>(target: TTarget, handlersMap: THandlersMap, options?: EventListenerOptions): () => void

// Custom Events
export function listenerMap<TEventMap extends Record<string, Event>>(
    target: EventTarget,
    handlersMap: Partial<EventHandlerMap<TEventMap>>,
    options?: EventListenerOptions,
): () => void

export function listenerMap(
    target: EventTarget,
    handlers: Record<string, T.AnyFunction | T.Nullish>,
    options?: EventListenerOptions,
): () => void {
    const entries = Object.entries(handlers)
    for (const [name, handler] of entries) {
        handler && target.addEventListener(name, handler, options)
    }
    return () => {
        for (const [name, handler] of entries) {
            handler && target.removeEventListener(name, handler, options)
        }
    }
}

/**
 * Alias to {@link listenerMap}
 */
export const listeners = listenerMap
