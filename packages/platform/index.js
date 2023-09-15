const w = typeof document === 'undefined' ? {document: {}, navigator: {userAgent: ''}} : window
const n = w.navigator
const ua = n.userAgent

/*

    Devices

*/

/**
 * Is Android Device
 * @type {boolean}
 */
export const isAndroid = /*#__PURE__*/ /Android/.test(ua)

/**
 * Is Windows Device
 * @type {boolean}
 */
export const isWindows = /*#__PURE__*/ /(win32|win64|windows|wince)/i.test(ua)

/**
 * Is Mac Device
 * @type {boolean}
 */
export const isMac = /*#__PURE__*/ /(macintosh|macintel|macppc|mac68k|macos)/i.test(ua)

/**
 * Is IPhone Device
 * @type {boolean}
 */
export const isIPhone = /*#__PURE__*/ /iphone/i.test(ua)

/**
 * Is IPad Device
 * @type {boolean}
 */
export const isIPad = /*#__PURE__*/ /ipad/i.test(ua) && n.maxTouchPoints > 1

/**
 * Is IPod Device
 * @type {boolean}
 */
export const isIPod = /*#__PURE__*/ /ipod/i.test(ua)

/**
 * Is IOS Device
 * @type {boolean}
 */
export const isIOS = isIPhone || isIPad || isIPod

/**
 * Is Apple Device
 * @type {boolean}
 */
export const isAppleDevice = isIOS || isMac

/**
 * is a Mobile Browser
 * @type {boolean}
 */
export const isMobile = /*#__PURE__*/ /Mobi/.test(ua)

/*

    Browsers

*/

/**
 * Browser is Mozilla Firefox
 * @type {boolean}
 */
export const isFirefox = /*#__PURE__*/ /^(?!.*Seamonkey)(?=.*Firefox).*/i.test(ua)

/**
 * Browser is Opera
 * @type {boolean}
 */
export const isOpera = (!!w.opr && !!w.opr.addons) || !!w.opera || /*#__PURE__*/ / OPR\//.test(ua)

/**
 * Browser is Safari
 * @type {boolean}
 */
export const isSafari =
    !!n.vendor && n.vendor.includes('Apple') && ua && !ua.includes('CriOS') && !ua.includes('FxiOS')

/** Browser is Internet Explorer 6-11 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const isIE = /*@cc_on!@*/ false || !!w.document.documentMode

/**
 * is Chromium-based browser
 * @type {boolean}
 */
export const isChromium = !!w.chrome

/**
 * Browser is Edge
 * @type {boolean}
 */
export const isEdge = /*#__PURE__*/ /Edg/.test(ua) && isChromium

/**
 * Browser is Chrome
 * @type {boolean}
 */
export const isChrome = isChromium && n.vendor === 'Google Inc.' && !isOpera && !isEdge

/**
 * Browser is Brave
 * @type {boolean}
 */
export const isBrave = !!n.brave && n.brave.isBrave && n.brave.isBrave.name === 'isBrave'

/*

    Rendering Engines

*/

/**
 * Browser using Gecko Rendering Engine
 * @type {boolean}
 */
export const isGecko = /*#__PURE__*/ /Gecko\/[0-9.]+/.test(ua)

/**
 * Browser using Blink Rendering Engine
 * @type {boolean}
 */
export const isBlink = /*#__PURE__*/ /Chrome\/[0-9.]+/.test(ua)

/**
 * Browser using WebKit Rendering Engine
 * @type {boolean}
 */
export const isWebKit = /*#__PURE__*/ /AppleWebKit\/[0-9.]+/.test(ua) && !isBlink

/**
 * Browser using Presto Rendering Engine
 * @type {boolean}
 */
export const isPresto = /*#__PURE__*/ /Opera\/[0-9.]+/.test(ua)

/**
 * Browser using Trident Rendering Engine
 * @type {boolean}
 */
export const isTrident = /*#__PURE__*/ /Trident\/[0-9.]+/.test(ua)

/**
 * Browser using EdgeHTML Rendering Engine
 * @type {boolean}
 */
export const isEdgeHTML = /*#__PURE__*/ /Edge\/[0-9.]+/.test(ua)
