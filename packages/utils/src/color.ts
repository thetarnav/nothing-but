/** Represents a color in the RGB color space. */
export class RGB {
	/**
	 * Creates an instance of the RGB class.
	 *
	 * @param r - The red component of the RGB color.
	 * @param g - The green component of the RGB color.
	 * @param b - The blue component of the RGB color.
	 */
	constructor(
		public r: number,
		public g: number,
		public b: number,
	) {}

	/** Returns a string representation of the RGB color in the format "rgb(r g b)". */
	toString = rgb_to_string.bind(null, this)
}

/** Represents a color in the RGBA color space. Extends the RGB class and adds an alpha component. */
export class RGBA extends RGB {
	/**
	 * Creates an instance of the RGBA class.
	 *
	 * @param r - The red component of the RGBA color.
	 * @param g - The green component of the RGBA color.
	 * @param b - The blue component of the RGBA color.
	 * @param a - The alpha component (opacity) of the RGBA color.
	 */
	constructor(
		r: number,
		g: number,
		b: number,
		public a: number,
	) {
		super(r, g, b)
	}

	/** Returns a string representation of the RGBA color in the format "rgb(r g b / a)". */
	toString = rgba_to_string.bind(null, this)
}

/**
 * Converts an RGB color to a string representation.
 *
 * @param   rgb - The RGB color to be converted.
 * @returns     A string in the format "rgb(r g b)" representing the RGB color.
 */
export function rgb_to_string(rgb: RGB): string {
	return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`
}

/**
 * Converts an RGBA color to a string representation.
 *
 * @param   rgba - The RGBA color to be converted.
 * @returns      A string in the format "rgb(r g b / a)" representing the RGBA color.
 */
export function rgba_to_string(rgba: RGBA): string {
	return `rgb(${rgba.r} ${rgba.g} ${rgba.b} / ${rgba.a})`
}

/**
 * Converts an RGB color to an RGBA color with the specified alpha component.
 *
 * @param   rgb - The RGB color to be converted.
 * @param   a   - The alpha component (opacity) of the resulting RGBA color.
 * @returns     A new RGBA color with the same RGB components and the specified alpha.
 */
export function rgb_to_rgba(rgb: RGB, a: number): RGBA {
	return new RGBA(rgb.r, rgb.g, rgb.b, a)
}

/**
 * Converts an RGB color to a numeric representation (32-bit integer).
 *
 * @param   rgb - The RGB color to be converted.
 * @returns     A numeric value representing the RGB color.
 */
export function rgb_int(rgb: RGB): number {
	return (rgb.r << 16) | (rgb.g << 8) | rgb.b
}

/**
 * Converts a numeric representation (32-bit integer) to an RGB color.
 *
 * @param   value - The numeric value representing the RGB color.
 * @returns       A new RGB color with components extracted from the numeric value.
 */
export function rgb_int_to_rgb(value: number): RGB {
	return new RGB((value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff)
}

/**
 * Converts an RGBA color to a numeric representation (32-bit integer).
 *
 * @param   rgba - The RGBA color to be converted.
 * @returns      A numeric value representing the RGBA color.
 */
export function rgba_int(rgba: RGBA): number {
	return (rgba.r << 24) | (rgba.g << 16) | (rgba.b << 8) | rgba.a
}

/**
 * Converts a numeric representation (32-bit integer) to an RGBA color.
 *
 * @param   value - The numeric value representing the RGBA color.
 * @returns       A new RGBA color with components extracted from the numeric value.
 */
export function rgba_int_to_rgba(value: number): RGBA {
	return new RGBA((value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff)
}

/**
 * Converts an RGB color and an alpha component to a numeric representation (32-bit integer).
 *
 * @param   rgb - The RGB color to be converted.
 * @param   a   - The alpha component (opacity) of the resulting RGBA color.
 * @returns     A numeric value representing the RGBA color with the specified alpha.
 */
export function rgb_to_rgba_int(rgb: RGB, a: number): number {
	return (rgb_int(rgb) << 8) | a
}

/**
 * Converts an RGB color to a CSS-compatible string representation.
 *
 * @param   rgb - The RGB color to be converted.
 * @returns     A string in the format "r g b" representing the RGB color.
 */
export function rgb_value(rgb: RGB): string {
	return `${rgb.r} ${rgb.g} ${rgb.b}`
}

/**
 * Converts an RGB color to a hexadecimal string representation.
 *
 * @param   rgb - The RGB color to be converted.
 * @returns     A string in the format "#rrggbb" representing the RGB color in hexadecimal notation.
 */
export function rgb_to_hex(rgb: RGB): string {
	return "#" + rgb.r.toString(16) + rgb.g.toString(16) + rgb.b.toString(16)
}

/**
 * Converts an RGBA color to a hexadecimal string representation.
 *
 * @param   rgba - The RGBA color to be converted.
 * @returns      A string in the format "#rrggbbaa" representing the RGBA color in hexadecimal
 *   notation.
 */
export function rgba_to_hex(rgba: RGBA): string {
	return (
		"#" + rgba.r.toString(16) + rgba.g.toString(16) + rgba.b.toString(16) + rgba.a.toString(16)
	)
}

/**
 * Converts a hex color to an rgb color
 *
 * @example hexToRGBA('#ff0000') // { r: 255, g: 0, b: 0 } hexToRGBA('#f00') // { r: 255, g: 0, b: 0
 * }
 */
export function hex_to_rgb(hex: string): RGB {
	if (hex[0] === "#") hex = hex.slice(1)
	if (hex.length < 6) {
		const r = parseInt(hex[0]!, 16)
		const g = parseInt(hex[1]!, 16)
		const b = parseInt(hex[2]!, 16)
		return new RGB(r, g, b)
	}
	const r = parseInt(hex.slice(0, 2), 16)
	const g = parseInt(hex.slice(2, 4), 16)
	const b = parseInt(hex.slice(4, 6), 16)
	return new RGB(r, g, b)
}

/**
 * Converts a hex color to an rgba color
 *
 * @example hexToRGBA('#ff0000') // { r: 255, g: 0, b: 0, a: 1 } hexToRGBA('#ff000000') // { r: 255,
 * g: 0, b: 0, a: 0 } hexToRGBA('#f00') // { r: 255, g: 0, b: 0, a: 1 } hexToRGBA('#f000') // { r:
 * 255, g: 0, b: 0, a: 0 }
 */
export function hex_to_rgba(hex: string): RGBA {
	if (hex[0] === "#") hex = hex.slice(1)
	if (hex.length < 6) {
		const r = parseInt(hex[0]!, 16)
		const g = parseInt(hex[1]!, 16)
		const b = parseInt(hex[2]!, 16)
		const a = hex[3] ? parseInt(hex[3], 16) / 255 : 1
		return new RGBA(r, g, b, a)
	}
	const r = parseInt(hex.slice(1, 3), 16)
	const g = parseInt(hex.slice(3, 5), 16)
	const b = parseInt(hex.slice(5, 7), 16)
	const a = hex.length > 7 ? parseInt(hex.slice(7, 9), 16) / 255 : 1
	return new RGBA(r, g, b, a)
}
