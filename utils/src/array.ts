import {num} from "./index.js"

/**
 * Basic array-like interface. has a length and can be indexed by number.
 *
 * Can be used with {@link Array}, {@link Uint8Array}, etc.
 */
interface ArrayLike<T> {
	readonly length: number
	readonly [Symbol.iterator]: () => IterableIterator<number>
	[index: number]: T
}
interface ReadonlyArrayLike<T> {
	readonly length: number
	readonly [Symbol.iterator]: () => IterableIterator<number>
	readonly [index: number]: T
}
export type NumArray = ArrayLike<number>
export type ReadonlyNumArray = ReadonlyArrayLike<number>

/** Check shallow array equality */
export function equals(a: ReadonlyArrayLike<unknown>, b: ReadonlyArrayLike<unknown>): boolean {
	if (a === b) return true
	if (a.length !== b.length) return false
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false
	}
	return true
}

export function wrap<T>(arr: readonly T[], index: number): T | undefined {
	return arr[num.remainder(index, arr.length)]
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
 * Checks if both arrays contain the same values. Order doesn't matter. Arrays must not contain
 * duplicates. (be the same lengths)
 */
export function includes_same_members(a: readonly unknown[], b: readonly unknown[]): boolean {
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
	array.push.apply(array, temp)
}

export function unordered_remove(array: any[], idx: number): void {
	[array[idx], array[array.length-1]] = [array[array.length-1], array[idx]]
	array.length -= 1
}

export function remove<T>(array: T[], item: T): void {
	array.splice(array.indexOf(item), 1)
}

export const pick_random = <T>(arr: readonly T[]): T | undefined => arr[num.random_int(arr.length)]

export function pick_random_excliding_one<T>(arr: readonly T[], excluding: T): T | undefined {
	let pick_index = num.random_int(arr.length),
		pick = arr[pick_index]

	if (pick === excluding) {
		pick_index = (pick_index + 1) % arr.length
		pick = arr[pick_index]
	}

	return pick
}

export function* random_iterate<T>(arr: readonly T[]): Generator<T> {
	const copy = arr.slice()
	while (copy.length) {
		const index = num.random_int(copy.length)
		yield copy.splice(index, 1)[0]!
	}
}

/**
 * Push to the end of the array, but shift all items to the left, removing the first item and
 * keeping the length the same.
 */
export function fixedPush<T>(arr: ArrayLike<T>, value: T): void {
	const end = arr.length - 1
	for (let i = 0; i < end; i += 1) {
		arr[i] = arr[i + 1]!
	}
	arr[end] = value
}

/**
 * Push to the end of the array, but shift all items to the left, removing the first item and
 * keeping the length the same.
 */
export function fixedPushMany<T>(arr: ArrayLike<T>, ...values: T[]): void {
	const end = arr.length - values.length
	for (let i = 0; i < end; i += 1) {
		arr[i] = arr[i + values.length]!
	}
	for (let i = 0; i < values.length; i += 1) {
		arr[end + i] = values[i]!
	}
}

/**
 * Push to the start of the array, and shift all items to the right, removing the last item and
 * keeping the length the same.
 */
export function fixedUnshift<T>(arr: ArrayLike<T>, value: T): void {
	for (let i = arr.length - 1; i > 0; i -= 1) {
		arr[i] = arr[i - 1]!
	}
	arr[0] = value
}

/**
 * Push to the start of the array, and shift all items to the right, removing the last item and
 * keeping the length the same.
 */
export function fixedUnshiftMany<T>(arr: ArrayLike<T>, ...values: T[]): void {
	const end = arr.length - values.length
	for (let i = end - 1; i >= 0; i -= 1) {
		arr[i + values.length] = arr[i]!
	}
	for (let i = 0; i < values.length; i += 1) {
		arr[i] = values[i]!
	}
}

/**
 * Returns a new array with {@link top_n} top items from the given {@link arr}. The score is
 * determined by the {@link getScore} function. The returned array is sorted from highest to lowest
 * score.
 */
export const top_n_with = <T>(
	arr: readonly T[],
	top_n: number,
	getScore: (item: T) => number,
): T[] => {
	if (top_n <= 0) return []

	/* highest to lowest */
	const top_items = new Array<T>(top_n)
	const top_scores = new Array<number>(top_n).fill(-Infinity)

	for (let i = 0; i < arr.length; i++) {
		const item = arr[i]!
		const score = getScore(item)

		if (score < top_scores[top_n - 1]!) continue

		let j = top_n - 2
		while (j >= 0 && top_scores[j]! < score) {
			top_items[j + 1] = top_items[j]!
			top_scores[j + 1] = top_scores[j]!
			j--
		}

		top_items[j + 1] = item
		top_scores[j + 1] = score
	}
	top_items.length = Math.min(top_n, arr.length)

	return top_items
}

export function binary_search<T>(arr: readonly T[], item: T): number | undefined {
	let low = 0,
		high = arr.length - 1,
		mid: number,
		guess: T

	while (low <= high) {
		mid = (low + high) >> 1
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
		mid = (low + high) >> 1
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
		mid = (low + high) >> 1
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
		mid = (low + high) >> 1
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
