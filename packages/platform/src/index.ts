const w =
    typeof document === 'undefined'
        ? ({document: {}, navigator: {userAgent: ''}} as Window)
        : window
const n = w.navigator
const ua = n.userAgent

declare global {
    interface Window {
        chrome?: unknown
        opera?: unknown
        opr?: {addons: unknown}
    }
    interface Document {
        documentMode?: unknown
    }
    interface Navigator {
        brave?: {isBrave?: () => unknown}
    }
}

/*

    Devices

*/

/* Is Android Device */
export const isAndroid: boolean = /*#__PURE__*/ /Android/.test(ua)

/* Is Windows Device */
export const isWindows: boolean = /*#__PURE__*/ /(win32|win64|windows|wince)/i.test(ua)

/* Is Mac Device */
export const isMac: boolean = /*#__PURE__*/ /(macintosh|macintel|macppc|mac68k|macos)/i.test(ua)

/* Is IPhone Device */
export const isIPhone: boolean = /*#__PURE__*/ /iphone/i.test(ua)

/* Is IPad Device */
export const isIPad: boolean = /*#__PURE__*/ /ipad/i.test(ua) && n.maxTouchPoints > 1

/* Is IPod Device */
export const isIPod: boolean = /*#__PURE__*/ /ipod/i.test(ua)

/* Is IOS Device */
export const isIOS: boolean = isIPhone || isIPad || isIPod

/* Is Apple Device */
export const isAppleDevice: boolean = isIOS || isMac

/* is a Mobile Browser */
export const isMobile: boolean = /*#__PURE__*/ /Mobi/.test(ua)

/*

    Browsers

*/

/* Browser is Mozilla Firefox */
export const isFirefox: boolean = /*#__PURE__*/ /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(ua)

/* Browser is Opera */
export const isOpera: boolean =
    (!!w.opr && !!w.opr.addons) || !!w.opera || /*#__PURE__*/ / OPR\//.test(ua)

/* Browser is Safari */
export const isSafari: boolean = !!(
    n.vendor &&
    n.vendor.includes('Apple') &&
    ua &&
    !ua.includes('CriOS') &&
    !ua.includes('FxiOS')
)

/** Browser is Internet Explorer 6-11 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const isIE = /*@cc_on!@*/ false || !!w.document.documentMode

/* is Chromium-based browser */
export const isChromium: boolean = !!w.chrome

/* Browser is Edge */
export const isEdge: boolean = /*#__PURE__*/ /Edg/.test(ua) && isChromium

/* Browser is Chrome */
export const isChrome: boolean = isChromium && n.vendor === 'Google Inc.' && !isOpera && !isEdge

/* Browser is Brave */
export const isBrave: boolean = !!(n.brave && n.brave.isBrave && n.brave.isBrave.name === 'isBrave')

/*

    Rendering Engines

*/

/* Browser using Gecko Rendering Engine */
export const isGecko: boolean = /*#__PURE__*/ /Gecko\/[0-9.]+/.test(ua)

/* Browser using Blink Rendering Engine */
export const isBlink: boolean = /*#__PURE__*/ /Chrome\/[0-9.]+/.test(ua)

/* Browser using WebKit Rendering Engine */
export const isWebKit: boolean = /*#__PURE__*/ /AppleWebKit\/[0-9.]+/.test(ua) && !isBlink

/* Browser using Presto Rendering Engine */
export const isPresto: boolean = /*#__PURE__*/ /Opera\/[0-9.]+/.test(ua)

/* Browser using Trident Rendering Engine */
export const isTrident: boolean = /*#__PURE__*/ /Trident\/[0-9.]+/.test(ua)

/* Browser using EdgeHTML Rendering Engine */
export const isEdgeHTML: boolean = /*#__PURE__*/ /Edge\/[0-9.]+/.test(ua)
