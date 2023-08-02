import { createMemo, createSignal, type Accessor } from 'solid-js'

export type MachineStatesBase<TStateNames extends PropertyKey> = {
    [K in TStateNames]: { input: any; value: any; to?: TStateNames[] }
}

export type MachineStates<TStates extends MachineStatesBase<keyof TStates>> = {
    [K in keyof TStates]: (
        input: TStates[K]['input'],
        next: MachineNext<TStates, K>,
    ) => TStates[K]['value']
}

export type MachineInitial<TStates extends MachineStatesBase<keyof TStates>> = {
    [K in keyof TStates]:
        | { type: K; input: TStates[K]['input'] }
        | (TStates[K]['input'] extends void ? K : never)
}[keyof TStates]

export type MachineState<
    TStates extends MachineStatesBase<keyof TStates>,
    TKey extends keyof TStates,
> = {
    [K in keyof TStates]: {
        readonly type: K
        readonly value: TStates[K]['value']
        readonly to: MachineNext<TStates, K>
    }
}[TKey]

export type PossibleNextStates<
    TStates extends MachineStatesBase<keyof TStates>,
    TKey extends keyof TStates,
> = Exclude<
    // @ts-expect-error
    Extract<keyof TStates, TStates[TKey] extends { to: infer To } ? To[number] : any>,
    TKey | symbol
>

export type MachineNext<
    TStates extends MachineStatesBase<keyof TStates>,
    TKey extends keyof TStates,
> = {
    readonly [K in PossibleNextStates<TStates, TKey>]: (input: TStates[K]['input']) => void
} & (<K extends PossibleNextStates<TStates, TKey>>(
    ...args: TStates[K]['input'] extends void
        ? [to: K, input?: void | undefined]
        : [to: K, input: TStates[K]['input']]
) => void)

// type MachinePrev<TStates extends MachineStatesBase, TKey extends keyof TStates> = MachineState<
//     TStates,
//     Exclude<
//         {
//             [K in keyof TStates]: TStates[K] extends { to: infer To }
//                 ? TKey extends To[number]
//                     ? K
//                     : never
//                 : K
//         }[keyof TStates],
//         TKey
//     >
// >

/**
 */
export function createStateMachine<T extends MachineStatesBase<keyof T>>(options: {
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
