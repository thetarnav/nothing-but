import {Num} from './index.js'

/**
 * Check shallow array equality
 */
export function equals(a: readonly unknown[], b: readonly unknown[]): boolean {
    return a === b || (a.length === b.length && a.every((e, i) => e === b[i]))
}

export function wrap<T>(arr: readonly T[], index: number): T | undefined {
    return arr[Num.remainder(index, arr.length)]
}

/**
 * Map an array, but only keep non-nullish values.
 *
 * Useful for combining `map` and `filter` into one operation.
 */
export function map_non_nullable<T, U>(array: readonly T[], fn: (item: T) => U): NonNullable<U>[] {
    const result: NonNullable<U>[] = Array(array.length)
    let i = 0
    for (const item of array) {
        const mapped = fn(item)
        if (mapped != null) {
            result[i] = mapped
            i += 1
        }
    }
    result.length = i
    return result
}

/**
 * Checks if both arrays contain the same values.
 * Order doesn't matter.
 * Arrays must not contain duplicates. (be the same lengths)
 */
export function includes_same_members(a: readonly unknown[], b: readonly unknown[]) {
    if (a === b) return true
    if (a.length !== b.length) return false

    const copy = b.slice()
    let found = 0

    a_loop: for (let i = 0; i < a.length; i++) {
        const a_item = a[i]

        for (let j = found; j < b.length; j++) {
            const b_item = copy[j]

            if (a_item === b_item) {
                ;[copy[j], copy[found]] = [copy[found], copy[j]]
                found = j + 1
                continue a_loop
            }
        }

        return false
    }

    return true
}

export function deduped<T>(array: readonly T[]): T[] {
    return Array.from(new Set(array))
}

export function mutate_filter<T, S extends T>(
    array: T[],
    predicate: (value: T, index: number, array: T[]) => value is S,
): void
export function mutate_filter<T>(
    array: T[],
    predicate: (value: T, index: number, array: T[]) => unknown,
): void
export function mutate_filter<T>(
    array: T[],
    predicate: (value: T, index: number, array: T[]) => unknown,
): void {
    const temp = array.filter(predicate)
    array.length = 0
    // eslint-disable-next-line @nothing-but/no-ignored-return
    array.push.apply(array, temp)
}

export function remove<T>(array: T[], item: T): void {
    array.splice(array.indexOf(item), 1)
}

export const pick_random = <T>(arr: readonly T[]): T | undefined => arr[Num.random_int(arr.length)]

export function pick_random_excliding_one<T>(arr: readonly T[], excluding: T): T | undefined {
    let pick_index = Num.random_int(arr.length),
        pick = arr[pick_index]

    if (pick === excluding) {
        pick_index = (pick_index + 1) % arr.length
        pick = arr[pick_index]
    }

    return pick
}

export function* random_iterate<T>(arr: readonly T[]) {
    const copy = arr.slice()
    while (copy.length) {
        const index = Num.random_int(copy.length)
        yield copy.splice(index, 1)[0]
    }
}

export function binary_search<T>(arr: readonly T[], item: T): number | undefined {
    let low = 0,
        high = arr.length - 1,
        mid: number,
        guess: T

    while (low <= high) {
        mid = Math.floor((low + high) / 2)
        guess = arr[mid]!

        if (guess === item) {
            return mid
        } else if (guess > item) {
            high = mid - 1
        } else {
            low = mid + 1
        }
    }

    return
}

export function binary_search_with<T>(
    arr: readonly T[],
    item: T,
    get_comparable: (item: T) => number,
): number | undefined {
    const search_for = get_comparable(item)

    let low = 0,
        high = arr.length - 1,
        mid: number,
        guess_item: T,
        guess_for: number

    while (low <= high) {
        mid = (low + high) >> 1
        guess_item = arr[mid]!
        guess_for = get_comparable(guess_item)

        if (guess_item === item) {
            return mid
        } else if (guess_for === search_for) {
            //
            let i = mid - 1
            for (; i >= 0 && get_comparable(arr[i]!) === guess_for; i--) {
                if (arr[i] === item) return i
            }

            i = mid + 1
            for (; i < arr.length && get_comparable(arr[i]!) === guess_for; i++) {
                if (arr[i] === item) return i
            }
        } else if (guess_for > search_for) {
            high = mid - 1
        } else {
            low = mid + 1
        }
    }

    return
}

export function binary_insert_unique<T>(arr: T[], item: T): void {
    let low = 0,
        high = arr.length - 1,
        mid: number,
        guess: T

    while (low <= high) {
        mid = Math.floor((low + high) / 2)
        guess = arr[mid]!

        if (guess === item) {
            return
        } else if (guess > item) {
            high = mid - 1
        } else {
            low = mid + 1
        }
    }

    arr.splice(low, 0, item)
}

export function binary_insert<T>(arr: T[], item: T): void {
    let low = 0,
        high = arr.length - 1,
        mid: number,
        guess: T

    while (low <= high) {
        mid = Math.floor((low + high) / 2)
        guess = arr[mid]!

        if (guess === item) {
            arr.splice(mid, 0, item)
            return
        } else if (guess > item) {
            high = mid - 1
        } else {
            low = mid + 1
        }
    }

    arr.splice(low, 0, item)
}

export function binary_insert_with<T>(
    arr: T[],
    item: T,
    get_comparable: (item: T) => number,
): void {
    const search_for = get_comparable(item)

    let low = 0,
        high = arr.length - 1,
        mid: number,
        guess_item: T,
        guess_for: number

    while (low <= high) {
        mid = Math.floor((low + high) / 2)
        guess_item = arr[mid]!
        guess_for = get_comparable(guess_item)

        if (guess_for === search_for) {
            arr.splice(mid, 0, item)
            return
        } else if (guess_for > search_for) {
            high = mid - 1
        } else {
            low = mid + 1
        }
    }

    arr.splice(low, 0, item)
}
