/**
 * Can be single or in an array
 */
export type Many<T> = T | T[]

export type Any_Object = Record<Property_Key, any>
export type Empty_Object = Record<Property_Key, never>

export type Any_Function = (...args: any[]) => any
export type Noop = (...a: any[]) => void

export type Any_Class = abstract new (...args: any) => any

export type Property_Key = PropertyKey
export type Primitive = Property_Key | boolean | bigint | null | undefined

export type Falsy_Value = false | null | undefined
export type Truthy<T> = Exclude<T, Falsy_Value>
export type Falsy<T> = Extract<T, Falsy_Value>

/**
 * Represents a point in 2D space with x and y coordinates.
 */
export type Position = {
    x: number
    y: number
}

export type Size = {
    width: number
    height: number
}

/**
 * Infers the type of the array elements
 */
export type Items_Of<T> = T extends any[] ? T[number] : T

/** Allows to make shallow overwrites to an interface */
export type Modify<T, R> = Omit<T, keyof R> & R

/** Allows to make nested overwrites to an interface */
export type Modify_Deep<A extends Any_Object, B extends Deep_Partial_Any<A>> = {
    [K in keyof A]: B[K] extends never
        ? A[K]
        : B[K] extends Any_Object
        ? Modify_Deep<A[K], B[K]>
        : B[K]
} & (A extends Any_Object ? Omit<B, keyof A> : A)

/** Makes each property optional and turns each leaf property into any, allowing for type overrides by narrowing any. */
export type Deep_Partial_Any<T> = {
    [P in keyof T]?: T[P] extends Any_Object ? Deep_Partial_Any<T[P]> : any
}

/** Removes the `[...list]` functionality */
export type Non_Iterable<T> = T & {
    [Symbol.iterator]: never
}

/** Get the required keys of an object */
export type Required_Keys<T> = keyof {
    [K in keyof T as T extends { [_ in K]: unknown } ? K : never]: 0
}

/** Remove the first item of a tuple [1, 2, 3, 4] => [2, 3, 4] */
export type Tail<T extends any[]> = ((...t: T) => void) extends (x: any, ...u: infer U) => void
    ? U
    : never

/** `A | B => A & B` */
export type Union_To_Intersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I,
) => void
    ? I
    : never

export type Extract_If_Possible<T, U> = Extract<T, U> extends never ? U : Extract<T, U>

/** Unwraps the type definition of an object, making it more readable */
export type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : T
/** Unboxes type definition, making it more readable */
export type Unbox_Lazy<T> = T extends () => infer U ? U : T

export type Prettify<T> = { [K in keyof T]: T[K] } & {}

type Raw_Narrow<T> =
    | (T extends [] ? [] : never)
    | (T extends string | number | bigint | boolean ? T : never)
    | { [K in keyof T]: T[K] extends Function ? T[K] : Raw_Narrow<T[K]> }

export type Narrow<T extends any> = T extends [] ? T : Raw_Narrow<T>

// Magic type that when used at sites where generic types are inferred from, will prevent those sites from being involved in the inference.
// https://github.com/microsoft/TypeScript/issues/14829
// TypeScript Discord conversation: https://discord.com/channels/508357248330760243/508357248330760249/911266491024949328
export type No_Infer<T> = [T][T extends any ? 0 : never]

/**
 * Enumerate<N> creates a union of numbers from 0 to N-1
 *
 * @example
 * Enumerate<3> // 0 | 1 | 2
 */
export type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>
