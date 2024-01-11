const w =
	typeof document === "undefined"
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

/** Is Windows Device */
export const is_windows: boolean = /*#__PURE__*/ /(win32|win64|windows|wince)/i.test(ua)

/** Is Mac Device */
export const is_mac: boolean = /*#__PURE__*/ /(macintosh|macintel|macppc|mac68k|macos)/i.test(ua)

/** Is IPhone Device */
export const is_iphone: boolean = /*#__PURE__*/ /iphone/i.test(ua)

/** Is IPad Device */
export const is_ipad: boolean = /*#__PURE__*/ /ipad/i.test(ua) && n.maxTouchPoints > 1

/** Is IPod Device */
export const is_ipod: boolean = /*#__PURE__*/ /ipod/i.test(ua)

/** Is IOS Device */
export const is_ios: boolean = is_iphone || is_ipad || is_ipod

/** Is Apple Device */
export const is_apple: boolean = is_ios || is_mac

/** is a Mobile Browser */
export const is_mobile: boolean = /*#__PURE__*/ /Mobi/.test(ua)

/*

    Browsers

*/

/** Browser is Mozilla Firefox */
export const is_firefox: boolean = /*#__PURE__*/ /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(ua)

/** Browser is Opera */
export const is_opera: boolean =
	(!!w.opr && !!w.opr.addons) || !!w.opera || /*#__PURE__*/ / OPR\//.test(ua)

/** Browser is Safari */
export const is_safari: boolean = !!(
	n.vendor &&
	n.vendor.includes("Apple") &&
	ua &&
	!ua.includes("CriOS") &&
	!ua.includes("FxiOS")
)

/** Browser is Internet Explorer 6-11 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const is_ie = /*@cc_on!@*/ false || !!w.document.documentMode

/** is Chromium-based browser */
export const is_chromium: boolean = !!w.chrome

/** Browser is Edge */
export const is_edge: boolean = /*#__PURE__*/ /Edg/.test(ua) && is_chromium

/** Browser is Chrome */
export const is_chrome: boolean = is_chromium && n.vendor === "Google Inc." && !is_opera && !is_edge

/** Browser is Brave */
export const is_brave: boolean = !!(
	n.brave &&
	n.brave.isBrave &&
	n.brave.isBrave.name === "isBrave"
)

/*

    Rendering Engines

*/

/** Browser using Gecko Rendering Engine */
export const is_gecko: boolean = /*#__PURE__*/ /Gecko\/[0-9.]+/.test(ua)

/** Browser using Blink Rendering Engine */
export const is_blink: boolean = /*#__PURE__*/ /Chrome\/[0-9.]+/.test(ua)

/** Browser using WebKit Rendering Engine */
export const is_webkit: boolean = /*#__PURE__*/ /AppleWebKit\/[0-9.]+/.test(ua) && !is_blink

/** Browser using Presto Rendering Engine */
export const is_presto: boolean = /*#__PURE__*/ /Opera\/[0-9.]+/.test(ua)

/** Browser using Trident Rendering Engine */
export const is_trident: boolean = /*#__PURE__*/ /Trident\/[0-9.]+/.test(ua)

/** Browser using EdgeHTML Rendering Engine */
export const is_edge_html: boolean = /*#__PURE__*/ /Edge\/[0-9.]+/.test(ua)
