const w = typeof document === "undefined"
	? ({document: {}, navigator: {userAgent: ""}} as Window)
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

/** Is Android Device */
export const is_android: boolean = /*#__PURE__*/ /Android/.test(ua)
export const IS_ANDROID = is_android

/** Is Windows Device */
export const is_windows: boolean = /*#__PURE__*/ /(win32|win64|windows|wince)/i.test(ua)
export const IS_WINDOWS = is_windows

/** Is Mac Device */
export const is_mac: boolean = /*#__PURE__*/ /(macintosh|macintel|macppc|mac68k|macos)/i.test(ua)
export const IS_MAC = is_mac

/** Is IPhone Device */
export const is_iphone: boolean = /*#__PURE__*/ /iphone/i.test(ua)
export const IS_IPHONE = is_iphone

/** Is IPad Device */
export const is_ipad: boolean = /*#__PURE__*/ /ipad/i.test(ua) && n.maxTouchPoints > 1
export const IS_IPAD = is_ipad

/** Is IPod Device */
export const is_ipod: boolean = /*#__PURE__*/ /ipod/i.test(ua)
export const IS_IPOD = is_ipod

/** Is IOS Device */
export const is_ios: boolean = is_iphone || is_ipad || is_ipod
export const IS_IOS = is_ios

/** Is Apple Device */
export const is_apple: boolean = is_ios || is_mac
export const IS_APPLE = is_apple

/** is a Mobile Browser */
export const is_mobile: boolean = /*#__PURE__*/ /Mobi/.test(ua)
export const IS_MOBILE = is_mobile

/*

    Browsers

*/

/** Browser is Mozilla Firefox */
export const is_firefox: boolean = /*#__PURE__*/ /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(ua)
export const IS_FIREFOX = is_firefox

/** Browser is Opera */
export const is_opera: boolean = (!!w.opr && !!w.opr.addons) || !!w.opera || /*#__PURE__*/ / OPR\//.test(ua)
export const IS_OPERA = is_opera

/** Browser is Safari */
export const is_safari: boolean = !!(
	n.vendor &&
	n.vendor.includes("Apple") &&
	ua &&
	!ua.includes("CriOS") &&
	!ua.includes("FxiOS")
)
export const IS_SAFARI = is_safari

/** Browser is Internet Explorer 6-11 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const is_ie = /*@cc_on!@*/ false || !!w.document.documentMode
export const IS_IE = is_ie

/** is Chromium-based browser */
export const is_chromium: boolean = !!w.chrome
export const IS_CHROMIUM = is_chromium

/** Browser is Edge */
export const is_edge: boolean = /*#__PURE__*/ /Edg/.test(ua) && is_chromium
export const IS_EDGE = is_edge

/** Browser is Chrome */
export const is_chrome: boolean = is_chromium && n.vendor === "Google Inc." && !is_opera && !is_edge
export const IS_CHROME = is_chrome

/** Browser is Brave */
export const is_brave: boolean = !!(
	n.brave &&
	n.brave.isBrave &&
	n.brave.isBrave.name === "isBrave"
)
export const IS_BRAVE = is_brave

/*

    Rendering Engines

*/

/** Browser using Gecko Rendering Engine */
export const is_gecko: boolean = /*#__PURE__*/ /Gecko\/[0-9.]+/.test(ua)
export const IS_GECKO = is_gecko

/** Browser using Blink Rendering Engine */
export const is_blink: boolean = /*#__PURE__*/ /Chrome\/[0-9.]+/.test(ua)
export const IS_BLINK = is_blink

/** Browser using WebKit Rendering Engine */
export const is_webkit: boolean = /*#__PURE__*/ /AppleWebKit\/[0-9.]+/.test(ua) && !is_blink
export const IS_WEBKIT = is_webkit

/** Browser using Presto Rendering Engine */
export const is_presto: boolean = /*#__PURE__*/ /Opera\/[0-9.]+/.test(ua)
export const IS_PRESTO = is_presto

/** Browser using Trident Rendering Engine */
export const is_trident: boolean = /*#__PURE__*/ /Trident\/[0-9.]+/.test(ua)
export const IS_TRIDENT = is_trident

/** Browser using EdgeHTML Rendering Engine */
export const is_edge_html: boolean = /*#__PURE__*/ /Edge\/[0-9.]+/.test(ua)
export const IS_EDGE_HTML = is_edge_html
