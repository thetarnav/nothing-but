export type Listener<T> = (value: T) => void

export type Unsubscribe = () => void

export class Observable<T = undefined> {
    listeners: Listener<T>[] = []

    subscribe(listener: Listener<T>): Unsubscribe {
        return subscribe(this, listener)
    }
}

export function publish(source: Observable, value?: undefined): void
export function publish<T>(source: Observable<T>, value: T): void
export function publish<T>(source: Observable<T>, value: T): void {
    for (const listener of source.listeners) {
        listener(value)
    }
}

export function unsubscribe<T>({ listeners }: Observable<T>, listener: Listener<T>): void {
    for (let i = 0; i < listeners.length; i++) {
        if (listeners[i] === listener) {
            listeners.splice(i, 1)
            return
        }
    }
}

export function subscribe<T>(to: Observable<T>, listener: Listener<T>): Unsubscribe {
    to.listeners.push(listener)
    return () => unsubscribe(to, listener)
}

export class Signal<T> extends Observable<T> {
    constructor(public value: T) {
        super()
    }
}

export function signal<T>(initial_value: T): Signal<T>
export function signal<T = undefined>(initial_value?: T | undefined): Signal<T | undefined>
export function signal<T>(initial_value: T): Signal<T> {
    return new Signal(initial_value)
}

let current_scheduler: Scheduler | undefined

export class Scheduler {
    effects = new Set<Effect<any>>()
    scheduled: boolean = false
}

export function scheduler_push(scheduler: Scheduler, eff: Effect<any>): void {
    scheduler.effects.add(eff)
    if (!scheduler.scheduled) {
        scheduler.scheduled = true
        queueMicrotask(() => {
            scheduler.scheduled = false
            current_scheduler = scheduler
            try {
                for (const eff of scheduler.effects) {
                    run(eff)
                }
            } finally {
                current_scheduler = undefined
                scheduler.effects.clear()
            }
        })
    }
}

export class Effect<T> {
    constructor(
        public source: Observable<T>,
        public fn: (value: T) => void,
        public scheduler: Scheduler,
    ) {}
}

export function effect<T>(
    source: Observable<T>,
    fn: (value: T) => void,
    scheduler = current_scheduler ?? new Scheduler(),
): Effect<T> {
    const effect = new Effect(source, fn, scheduler)
    source.subscribe(value => scheduler_push(scheduler, effect))
    return effect
}

export function run<T>(effect: Effect<T>): void {
    effect.fn((effect.source as any).value)
}

export function set<T>(signal: Signal<T>, value: T): void {
    publish(signal, (signal.value = value))
}

;(() => {
    const count = signal(0)

    const root_obs = new Observable()
    const root = effect(root_obs, () => {
        console.log('root')

        effect(count, n => {
            console.log('count:', n)
        })

        effect(count, n => {
            console.log('_count:', n)
        })
    })
    run(root)

    set(count, 1)

    publish(root_obs)

    set(count, 2)
})()
