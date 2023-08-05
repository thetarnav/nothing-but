import { createMemo, createSignal, type Accessor } from 'solid-js'

export type StatesBase<TStateNames extends PropertyKey> = {
    [K in TStateNames]: { input?: any; value?: any; to?: TStateNames[] }
}

export type StateInput<TState extends { input?: any }> = TState extends { input: infer Input }
    ? Input
    : void

export type StateValue<TState extends { value?: any }> = TState extends { value: infer Value }
    ? Value
    : undefined

export type MachineStates<TStates extends StatesBase<keyof TStates>> = {
    [K in keyof TStates]: (
        input: StateInput<TStates[K]>,
        next: MachineNext<TStates, K>,
    ) => StateValue<TStates[K]>
}

export type MachineInitial<TStates extends StatesBase<keyof TStates>> = {
    [K in keyof TStates]:
        | { type: K; input: StateInput<TStates[K]> }
        | (TStates[K] extends { input: any } ? never : K)
}[keyof TStates]

export type MachineState<TStates extends StatesBase<keyof TStates>, TKey extends keyof TStates> = {
    [K in keyof TStates]: {
        readonly type: K
        readonly value: StateValue<TStates[K]>
        readonly to: MachineNext<TStates, K>
    }
}[TKey]

export type PossibleNextKeys<
    TStates extends StatesBase<keyof TStates>,
    TKey extends keyof TStates,
> = Exclude<
    // @ts-expect-error
    Extract<keyof TStates, TStates[TKey] extends { to: infer To } ? To[number] : any>,
    TKey | symbol
>

export type MachineNext<TStates extends StatesBase<keyof TStates>, TKey extends keyof TStates> = {
    readonly [K in PossibleNextKeys<TStates, TKey>]: (input: StateInput<TStates[K]>) => void
} & (<K extends PossibleNextKeys<TStates, TKey>>(
    ...args: TStates[K] extends { input: infer Input }
        ? [to: K, input: Input]
        : [to: K, input?: undefined]
) => void)

/**
 */
export function createStateMachine<T extends StatesBase<keyof T>>(options: {
    states: MachineStates<T>
    initial: MachineInitial<T>
}): Accessor<MachineState<T, keyof T>> & MachineState<T, keyof T> {
    const { states, initial } = options

    const [payload, setPayload] = createSignal(
        (typeof initial === 'object'
            ? { type: initial.type, input: initial.input }
            : { type: initial, input: undefined }) as {
            type: keyof T
            input: any
        },
        { equals: (a, b) => a.type === b.type },
    )

    function to(type: keyof T, input: any) {
        setPayload({ type, input })
    }

    for (const key of Object.keys(states)) {
        // @ts-expect-error
        to[key as any] = (input: any) => to(key, input)
    }

    const memo = createMemo(() => {
        const { type, input } = payload()
        return { type, value: states[type](input, to as any), to }
    }) as any

    Object.defineProperties(memo, {
        type: { get: () => memo().type },
        value: { get: () => memo().value },
        to: { value: to },
    })

    return memo
}
