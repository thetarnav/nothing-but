import {onCleanup} from "./lifecycle.js"
import * as T from "./types.js"

export type EventListenerOptions = boolean | AddEventListenerOptions

export type TargetWithEventMap =
	| Window
	| Document
	| XMLDocument
	| HTMLBodyElement
	| HTMLFrameSetElement
	| HTMLMediaElement
	| HTMLVideoElement
	| HTMLElement
	| SVGSVGElement
	| SVGElement
	| MathMLElement
	| Element
	| AbortSignal
	| AbstractWorker
	| Animation
	| BroadcastChannel
	| CSSAnimation
	| CSSTransition
	| FileReader
	| IDBDatabase
	| IDBOpenDBRequest
	| IDBRequest
	| IDBTransaction
	| MediaDevices
	| MediaKeySession
	| MediaQueryList
	| MediaRecorder
	| MediaSource
	| MediaStream
	| MediaStreamTrack
	| MessagePort
	| Notification
	| PaymentRequest
	| Performance
	| PermissionStatus
	| PictureInPictureWindow
	| RemotePlayback
	| ScreenOrientation
	| ServiceWorker
	| ServiceWorkerContainer
	| ServiceWorkerRegistration
	| ShadowRoot
	| SharedWorker
	| SourceBuffer
	| SourceBufferList
	| SpeechSynthesis
	| SpeechSynthesisUtterance
	| VisualViewport
	| WebSocket
	| Worker
	| XMLHttpRequest
	| XMLHttpRequestEventTarget
	| XMLHttpRequestUpload
	| EventSource

export type EventMapOf<Target> =
	  Target extends Window                    ? WindowEventMap
	: Target extends Document | XMLDocument    ? DocumentEventMap
	: Target extends HTMLBodyElement           ? HTMLBodyElementEventMap
	: Target extends HTMLFrameSetElement       ? HTMLFrameSetElementEventMap
	: Target extends HTMLMediaElement          ? HTMLMediaElementEventMap
	: Target extends HTMLVideoElement          ? HTMLVideoElementEventMap
	: Target extends HTMLElement               ? HTMLElementEventMap
	: Target extends SVGSVGElement             ? SVGSVGElementEventMap
	: Target extends SVGElement                ? SVGElementEventMap
	: Target extends MathMLElement             ? MathMLElementEventMap
	: Target extends Element                   ? ElementEventMap
	: Target extends AbortSignal               ? AbortSignalEventMap
	: Target extends AbstractWorker            ? AbstractWorkerEventMap
	: Target extends Animation                 ? AnimationEventMap
	: Target extends BroadcastChannel          ? BroadcastChannelEventMap
	: Target extends CSSAnimation              ? AnimationEventMap
	: Target extends CSSTransition             ? AnimationEventMap
	: Target extends FileReader                ? FileReaderEventMap
	: Target extends IDBDatabase               ? IDBDatabaseEventMap
	: Target extends IDBOpenDBRequest          ? IDBOpenDBRequestEventMap
	: Target extends IDBRequest                ? IDBRequestEventMap
	: Target extends IDBTransaction            ? IDBTransactionEventMap
	: Target extends MediaDevices              ? MediaDevicesEventMap
	: Target extends MediaKeySession           ? MediaKeySessionEventMap
	: Target extends MediaQueryList            ? MediaQueryListEventMap
	: Target extends MediaRecorder             ? MediaRecorderEventMap
	: Target extends MediaSource               ? MediaSourceEventMap
	: Target extends MediaStream               ? MediaStreamEventMap
	: Target extends MediaStreamTrack          ? MediaStreamTrackEventMap
	: Target extends MessagePort               ? MessagePortEventMap
	: Target extends Notification              ? NotificationEventMap
	: Target extends PaymentRequest            ? PaymentRequestEventMap
	: Target extends Performance               ? PerformanceEventMap
	: Target extends PermissionStatus          ? PermissionStatusEventMap
	: Target extends PictureInPictureWindow    ? PictureInPictureWindowEventMap
	: Target extends RemotePlayback            ? RemotePlaybackEventMap
	: Target extends ScreenOrientation         ? ScreenOrientationEventMap
	: Target extends ServiceWorker             ? ServiceWorkerEventMap
	: Target extends ServiceWorkerContainer    ? ServiceWorkerContainerEventMap
	: Target extends ServiceWorkerRegistration ? ServiceWorkerRegistrationEventMap
	: Target extends ShadowRoot                ? ShadowRootEventMap
	: Target extends SharedWorker              ? AbstractWorkerEventMap
	: Target extends SourceBuffer              ? SourceBufferEventMap
	: Target extends SourceBufferList          ? SourceBufferListEventMap
	: Target extends SpeechSynthesis           ? SpeechSynthesisEventMap
	: Target extends SpeechSynthesisUtterance  ? SpeechSynthesisUtteranceEventMap
	: Target extends VisualViewport            ? VisualViewportEventMap
	: Target extends WebSocket                 ? WebSocketEventMap
	: Target extends Worker                    ? WorkerEventMap
	: Target extends XMLHttpRequest            ? XMLHttpRequestEventMap
	: Target extends XMLHttpRequestEventTarget ? XMLHttpRequestEventTargetEventMap
	: Target extends XMLHttpRequestUpload      ? XMLHttpRequestEventTargetEventMap
	: Target extends EventSource               ? EventSourceEventMap
	: never

export const PASSIVE     = {passive: true } as const
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
	container.addEventListener("touchstart", preventCancelable, NOT_PASSIVE)
	container.addEventListener("touchmove",  preventCancelable, NOT_PASSIVE)
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
): () => void

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

// DOM Events
export function createListener<
	TTarget extends TargetWithEventMap,
	TEventMap extends EventMapOf<TTarget>,
	TEventType extends keyof TEventMap,
>(
	target: TTarget,
	type: TEventType,
	handler: (event: TEventMap[TEventType]) => void,
	options?: EventListenerOptions,
): void

// Custom Events
export function createListener<
	TEventMap extends Record<string, Event>,
	TEventType extends keyof TEventMap = keyof TEventMap,
>(
	target: EventTarget,
	type: TEventType,
	handler: (event: TEventMap[TEventType]) => void,
	options?: EventListenerOptions,
): void

export function createListener(
	target: EventTarget,
	type: string,
	handler: (event: Event) => void,
	options?: EventListenerOptions,
): void {
	target.addEventListener(type, handler, options)
	onCleanup(target.removeEventListener.bind(target, type, handler, options))
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

/** Alias to {@link listenerMap} */
export const listeners = listenerMap

// DOM Events
export function createListeners<
	TTarget extends TargetWithEventMap,
	TEventMap extends EventMapOf<TTarget>,
	THandlersMap extends Partial<EventHandlerMap<TEventMap>>,
>(target: TTarget, handlersMap: THandlersMap, options?: EventListenerOptions): void

// Custom Events
export function createListeners<TEventMap extends Record<string, Event>>(
	target: EventTarget,
	handlersMap: Partial<EventHandlerMap<TEventMap>>,
	options?: EventListenerOptions,
): void

export function createListeners(
	target: EventTarget,
	handlers: Record<string, T.AnyFunction | T.Nullish>,
	options?: EventListenerOptions,
): void {
	onCleanup((listeners as any)(target, handlers, options))
}
