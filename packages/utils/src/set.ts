export function intersection<T, U>(a: Set<T>, b: Set<U>): Set<T & U> {
    const result = new Set<T & U>()
    for (const item of a) {
        if (b.has(item as any)) result.add(item as any)
    }
    return result
}

export function difference<T, U>(a: Set<T>, b: Set<U>): Set<Exclude<T, U>> {
    const result = new Set<any>()
    for (const item of a) {
        if (!b.has(item as any)) result.add(item)
    }
    return result
}

export function union<T, U>(a: Set<T>, b: Set<U>): Set<T | U> {
    const result = new Set<T | U>(a)
    for (const item of b) result.add(item)
    return result
}
