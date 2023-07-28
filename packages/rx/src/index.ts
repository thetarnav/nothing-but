/*

TODO:

-   [ ] disposing
-   [ ] join
-   [ ] derived
-   [ ] equals
-   [ ] lazy
-   [ ] computed
-   [ ] context
-   [ ] resource
-   [ ] diamond
-   [ ] observables working with derived and effects

*/

export type Observer_Callback<T> = (value: T) => void

export type Unsubscribe = () => void

export class Observable<T = undefined> {
    observers: Observer_Callback<T>[] = []

    subscribe(listener: Observer_Callback<T>): Unsubscribe {
        return subscribe(this, listener)
    }
}

export function publish(source: Observable, value?: undefined): void
export function publish<T>(source: Observable<T>, value: T): void
export function publish<T>(source: Observable<T>, value: T): void {
    for (const listener of source.observers) {
        listener(value)
    }
}

export function unsubscribe<T>(
    { observers: listeners }: Observable<T>,
    listener: Observer_Callback<T>,
): void {
    for (let i = 0; i < listeners.length; i++) {
        if (listeners[i] === listener) {
            listeners.splice(i, 1)
            return
        }
    }
}

export function subscribe<T>(to: Observable<T>, listener: Observer_Callback<T>): Unsubscribe {
    to.observers.push(listener)
    return () => unsubscribe(to, listener)
}

export class Signal<T> extends Observable<Signal<T>> {
    constructor(public value: T) {
        super()
    }
}

export function signal<T>(initial_value: T): Signal<T>
export function signal<T = undefined>(initial_value?: T | undefined): Signal<T | undefined>
export function signal<T>(initial_value: T): Signal<T> {
    return new Signal(initial_value)
}

export function set<T>(signal: Signal<T>, value: T): void {
    signal.value = value
    publish(signal, signal)
}

let current_scheduler: Scheduler<any> | undefined

export class Scheduler<T> {
    derived: Derived<any, any>[] = []
    effects: Effect<T>[] = []
}

export function flush(scheduler: Scheduler<any>): void {
    if (scheduler.effects.length === 0) return

    const prev_scheduler = current_scheduler
    current_scheduler = scheduler
    const set = new Set<Effect<any>>()
    try {
        for (const eff of scheduler.effects) {
            if (set.has(eff)) continue
            set.add(eff)
            eff.fn(eff.source.value)
        }
    } finally {
        current_scheduler = prev_scheduler
        scheduler.effects.length = 0
    }
}

export class Effect<T> {
    constructor(
        public source: Signal<T>,
        public fn: (value: T) => void,
        public scheduler: Scheduler<T>,
    ) {}
}

// TODO should run immediately probably
export function effect<T>(
    source: Signal<T>,
    fn: (value: T) => void,
    scheduler = current_scheduler ?? new Scheduler(),
): Effect<T> {
    const effect = new Effect(source, fn, scheduler)
    source.subscribe(() => schedule(effect))
    return effect
}

export function schedule<T>(eff: Effect<T>): void {
    const scheduler = eff.scheduler
    scheduler.effects.push(eff)

    if (scheduler.effects.length === 1) {
        queueMicrotask(() => flush(scheduler))
    }
}

export class Derived<TSource, TValue> extends Signal<TValue> {
    constructor(
        public source: Signal<TSource>,
        public fn: (source_value: TSource) => TValue,
        initial_value: TValue,
    ) {
        super(initial_value)
    }
}

export function derived<TSource, TValue>(
    source: Signal<TSource>,
    fn: (source_value: TSource) => TValue,
    initial_value?: TValue,
): Derived<TSource, TValue> {
    const derived = new Derived(source, fn, initial_value as TValue)
    source.subscribe(v => set(derived, fn(v.value)))
    return derived
}
