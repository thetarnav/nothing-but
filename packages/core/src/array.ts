import { math } from '.'

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
