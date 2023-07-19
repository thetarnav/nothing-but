import { math } from '.'

/**
 * Check shallow array equality
 */
export function equals(a: readonly unknown[], b: readonly unknown[]): boolean {
    return a === b || (a.length === b.length && a.every((e, i) => e === b[i]))
}

export function wrap<T>(arr: readonly T[], index: number): T | undefined {
    return arr[math.remainder(index, arr.length)]
}

/**
 * Checks if both arrays contain the same values.
 * Order doesn't matter.
 * Arrays must not contain duplicates. (be the same lengths)
 */
export function includesSameMembers(a: readonly unknown[], b: readonly unknown[]) {
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

export function mutateFilter<T, S extends T>(
    array: T[],
    predicate: (value: T, index: number, array: T[]) => value is S,
): void
export function mutateFilter<T>(
    array: T[],
    predicate: (value: T, index: number, array: T[]) => unknown,
): void
export function mutateFilter<T>(
    array: T[],
    predicate: (value: T, index: number, array: T[]) => unknown,
): void {
    const temp = array.filter(predicate)
    array.length = 0
    array.push.apply(array, temp)
}

export function remove<T>(array: T[], item: T): void {
    array.splice(array.indexOf(item), 1)
}

export const pickRandom = <T>(arr: readonly T[]): T | undefined => arr[math.randomInt(arr.length)]

export function pickRandomExclidingOne<T>(arr: readonly T[], excluding: T): T | undefined {
    let pick_index = math.randomInt(arr.length),
        pick = arr[pick_index]

    if (pick === excluding) {
        pick_index = (pick_index + 1) % arr.length
        pick = arr[pick_index]
    }

    return pick
}

export function* randomIterate<T>(arr: readonly T[]) {
    const copy = arr.slice()
    while (copy.length) {
        const index = math.randomInt(copy.length)
        yield copy.splice(index, 1)[0]
    }
}

export function binarySearch<T>(arr: readonly T[], item: T): number | undefined {
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

export function binarySearchWith<T>(
    arr: readonly T[],
    item: T,
    getComparable: (item: T) => number,
): number | undefined {
    const search_for = getComparable(item)

    let low = 0,
        high = arr.length - 1,
        mid: number,
        guess_item: T,
        guess_for: number

    while (low <= high) {
        mid = (low + high) >> 1
        guess_item = arr[mid]!
        guess_for = getComparable(guess_item)

        if (guess_item === item) {
            return mid
        } else if (guess_for === search_for) {
            //
            let i = mid - 1
            for (; i >= 0 && getComparable(arr[i]!) === guess_for; i--) {
                if (arr[i] === item) return i
            }

            i = mid + 1
            for (; i < arr.length && getComparable(arr[i]!) === guess_for; i++) {
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

export function binaryInsertUnique<T>(arr: T[], item: T): void {
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

export function binaryInsert<T>(arr: T[], item: T): void {
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

export function binaryInsertWith<T>(arr: T[], item: T, getComparable: (item: T) => number): void {
    const search_for = getComparable(item)

    let low = 0,
        high = arr.length - 1,
        mid: number,
        guess_item: T,
        guess_for: number

    while (low <= high) {
        mid = Math.floor((low + high) / 2)
        guess_item = arr[mid]!
        guess_for = getComparable(guess_item)

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
