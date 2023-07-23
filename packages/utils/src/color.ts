export class RGB {
    constructor(
        public r: number,
        public g: number,
        public b: number,
    ) {}

    toString = RGBToString.bind(null, this)
}

export class RGBA extends RGB {
    constructor(
        r: number,
        g: number,
        b: number,
        public a: number,
    ) {
        super(r, g, b)
    }

    toString = RGBAToString.bind(null, this)
}

export function RGBToString(rgb: RGB): string {
    return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`
}

export function RGBAToString(rgba: RGBA): string {
    return `rgb(${rgba.r} ${rgba.g} ${rgba.b} / ${rgba.a})`
}

/**
 * Converts a hex color to an rgb color
 *
 * @example
 * hexToRGBA('#ff0000') // { r: 255, g: 0, b: 0 }
 * hexToRGBA('#f00') // { r: 255, g: 0, b: 0 }
 */
export function hexToRGB(hex: string): RGB {
    if (hex[0] === '#') hex = hex.slice(1)
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
 * @example
 * hexToRGBA('#ff0000') // { r: 255, g: 0, b: 0, a: 1 }
 * hexToRGBA('#ff000000') // { r: 255, g: 0, b: 0, a: 0 }
 * hexToRGBA('#f00') // { r: 255, g: 0, b: 0, a: 1 }
 * hexToRGBA('#f000') // { r: 255, g: 0, b: 0, a: 0 }
 */
export function hexToRGBA(hex: string): RGBA {
    if (hex[0] === '#') hex = hex.slice(1)
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
