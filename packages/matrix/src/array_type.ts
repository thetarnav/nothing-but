export let array_constructor: typeof Float32Array | typeof Array =
	typeof Float32Array !== "undefined" ? Float32Array : Array

/**
 * Sets the global array constructor used when creating new vectors and matrices
 *
 * @param constructor Array type, such as Float32Array or Array
 */
export function set_matrix_array_constructor(
	constructor: Float32ArrayConstructor | ArrayConstructor,
): void {
	array_constructor = constructor
}
