import * as solid from 'solid-js'

export class Reactive<T> {
    read: solid.Accessor<T>
    get value(): T {
        return this.read()
    }

    constructor(read: solid.Accessor<T>) {
        this.read = read
    }

    toString(): string {
        return `Reactive(${this.value})`
    }
    toJSON(): T {
        return this.value
    }
    valueOf(): T {
        return this.value
    }
}

export type ReactiveValue<T> = T extends Reactive<infer U> ? U : never

export function reactive<T>(get: solid.Accessor<T>): Reactive<T> {
    return new Reactive(get)
}

export function peek<T>(obj: Reactive<T>): T {
    return solid.untrack(() => obj.value)
}

export function memo<T>(source: solid.Accessor<T>): Reactive<T>
export function memo<T>(source: Reactive<T>): Reactive<T>
export function memo<T>(source: solid.Accessor<T> | Reactive<T>): Reactive<T> {
    return new Reactive(solid.createMemo(source instanceof Reactive ? () => source.value : source))
}

export function map<T, U>(source: Reactive<T>, fn: (value: T) => U): Reactive<U> {
    return new Reactive(() => {
        const value = source.value
        return solid.untrack(() => fn(value))
    })
}

export function map_nested<T, K extends keyof T, U>(
    source: Reactive<T>,
    key: K,
    fn: (value: T[K]) => U,
): Reactive<U> {
    return new Reactive(() => {
        const value = source.value[key]
        return solid.untrack(() => fn(value))
    })
}

export function destructure<const T extends readonly unknown[]>(
    source: Reactive<T>,
): {[K in keyof T]: Reactive<T[K]>} {
    return peek(source).map(value => new Reactive(() => value)) as any
}

export function join<const T extends readonly Reactive<unknown>[]>(
    sources: T,
): Reactive<{[K in keyof T]: ReactiveValue<T[K]>}> {
    return new Reactive(() => sources.map(source => source.value)) as any
}

export function effect<T>(
    source: Reactive<T>,
    fn: (value: T) => void | undefined | (() => void),
): void {
    solid.createEffect(() => {
        const value = source.value
        const cleanup = solid.untrack(() => fn(value))
        cleanup && solid.onCleanup(cleanup)
    })
}

export function selector<T, U = T>(
    obj: Reactive<T>,
    equals?: (key: U, source: T) => boolean,
): (key: U) => boolean {
    return solid.createSelector(() => obj.value, equals)
}

export type SignalOptions<T> = {
    name?: string
    equals?: (a: T, b: T) => boolean
    internal?: boolean
}

export class Signal<T> extends Reactive<T> {
    setter: solid.Setter<T>
    mutating: boolean = false

    constructor(initialValue: T, options?: SignalOptions<T>) {
        const equals = options?.equals ?? solid.equalFn
        const [read, setter] = solid.createSignal(initialValue, {
            ...options,
            equals: (a, b) => (this.mutating ? (this.mutating = false) : equals(a, b)),
        })
        super(read)
        this.setter = setter
    }
}

export function signal<T>(initialValue: T, options?: SignalOptions<T>): Signal<T>
export function signal<T = undefined>(
    initialValue?: T | undefined,
    options?: SignalOptions<T | undefined>,
): Signal<T | undefined>
export function signal<T>(initialValue: T, options?: SignalOptions<T>): Signal<T> {
    return new Signal(initialValue, options)
}

export function set<T>(obj: Signal<T>, value: T): T {
    return obj.setter(() => value)
}

export function reset<T>(obj: Signal<T | undefined>): void {
    return obj.setter(undefined)
}

export function set_nested<T, K extends keyof T>(sig: Signal<T>, key: K, value: T[K]): void {
    const obj = peek(sig)
    if (!obj || typeof obj !== 'object') return
    const old = obj[key]
    if (old !== value) {
        const copy: any = Array.isArray(obj) ? [...obj] : {...obj}
        copy[key] = value as any
        // eslint-disable-next-line @nothing-but/no-ignored-return
        sig.setter(copy)
    }
}

export function update<T>(sig: Signal<T>, fn: (value: T) => T): void {
    // eslint-disable-next-line @nothing-but/no-ignored-return
    sig.setter(fn)
}

export function mutate<T>(sig: Signal<T>, fn: (value: T) => void): void {
    sig.mutating = true
    // eslint-disable-next-line @nothing-but/no-ignored-return
    sig.setter(value => {
        fn(value)
        return value
    })
}

export function trigger(sig: Signal<any>): void {
    sig.mutating = true
    // eslint-disable-next-line @nothing-but/no-ignored-return
    sig.setter(value => value)
}

/**
 * For read-only access to a signal.
 */
export function readonly<T>(sig: Signal<T>): Reactive<T> {
    return new Reactive(() => sig.value)
}
