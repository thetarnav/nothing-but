import {UnionToIntersection} from "@nothing-but/utils/types"
import {Accessor, createMemo, untrack} from "solid-js"

type EventsUnion<T> = T extends {[key: string]: any}
    ? {
          [K in keyof T]-?: T[K] extends (...args: any) => infer R
              ? [event: K, args: Parameters<T[K]>, result: R]
              : T[K] extends infer U
                ? U extends (...args: infer A) => infer R
                    ? [event: K, args: A, result: R | void]
                    : never
                : never
      }[keyof T]
    : never

type RequiredEventsUnion<T> = T extends {[key: string]: any}
    ? {
          [K in keyof T]-?: true
      }
    : never

type EventsTable<T> = {
    [E in EventsUnion<T> as E[0]]: [args: UnionToIntersection<E[1]>, result: E[2]]
}

type Emit<T> = <E extends keyof EventsTable<T>>(
    e: E,
    // @ts-expect-error
    ...args: EventsTable<T>[E][0]
) => EventsTable<T>[E][1] | (RequiredEventsUnion<T>[E] extends true ? never : void)

export function createEmit<T>(source: Accessor<T>): Emit<T> {
    const callbacks = createMemo(() => {
        const v = source(),
            cbs = {} as any

        if (v && typeof v === "object") {
            for (const [key, value] of Object.entries(v)) {
                if (typeof value === "function") {
                    cbs[key] = value
                }
            }
        }

        return cbs
    })

    return ((e: any, ...args: any[]) => untrack(() => callbacks()[e]?.(...args))) as any
}
