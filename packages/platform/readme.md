# @nothing-but/platform

A set of const boolean variables identifying device and browser type.

## Installation

```bash
npm install @nothing-but/platform
# or
pnpm add @nothing-but/platform
# or
yarn add @nothing-but/platform
```

## How to use it

```ts
import {isWebKit, isFirefox} from '@nothing-but/platform'

if (!isFirefox) {
    // won't run on the Mozilla Firefox Browser
}

if (isWebKit) {
    // run WebKit Engine specific code
}
```

> **Note:** This package is tree-shakable, all unused variables will be removed from the bundle.

> **Note:** On the server, all variables will be `false`.

## List of variables

### Devices

-   `isAndroid` — Is Android Device

-   `isWindows` — Is Windows Device

-   `isMac` — Is Mac Device

-   `isIPhone` — Is IPhone Device

-   `isIPad` — Is IPad Device

-   `isIPod` — Is IPod Device

-   `isIOS` — Is IOS Device

-   `isAppleDevice` — Is Apple Device

-   `isMobile` — is a Mobile Browser

### Browsers

-   `isFirefox` — Browser is Mozilla Firefox

-   `isOpera` — Browser is Opera

-   `isSafari` — Browser is Safari

-   `isIE` — Browser is Internet Explorer

-   `isChromium` — is Chromium-based browser

-   `isEdge` — Browser is Edge

-   `isChrome` — Browser is Chrome

-   `isBrave` — Browser is Brave

### Rendering Engines

-   `isGecko` — Browser using Gecko Rendering Engine

-   `isBlink` — Browser using Blink Rendering Engine

-   `isWebKit` — Browser using WebKit Rendering Engine

-   `isPresto` — Browser using Presto Rendering Engine

-   `isTrident` — Browser using Trident Rendering Engine

-   `isEdgeHTML` — Browser using EdgeHTML Rendering Engine

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
