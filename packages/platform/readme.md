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
import {is_webkit, is_firefox} from '@nothing-but/platform'

if (!is_firefox) {
    // won't run on the Mozilla Firefox Browser
}

if (is_webkit) {
    // run WebKit Engine specific code
}
```

> **Note:** This package is tree-shakable, all unused variables will be removed from the bundle.

> **Note:** On the server, all variables will be `false`.

## List of variables

### Devices

-   `is_android` — Is Android Device

-   `is_windows` — Is Windows Device

-   `is_mac` — Is Mac Device

-   `is_iphone` — Is IPhone Device

-   `is_ipad` — Is IPad Device

-   `is_ipod` — Is IPod Device

-   `is_ios` — Is IOS Device

-   `is_apple_device` — Is Apple Device

-   `is_mobile` — is a Mobile Browser

### Browsers

-   `is_firefox` — Browser is Mozilla Firefox

-   `is_opera` — Browser is Opera

-   `is_safari` — Browser is Safari

-   `is_ie` — Browser is Internet Explorer

-   `is_chromium` — is Chromium-based browser

-   `is_edge` — Browser is Edge

-   `is_chrome` — Browser is Chrome

-   `is_brave` — Browser is Brave

### Rendering Engines

-   `is_gecko` — Browser using Gecko Rendering Engine

-   `is_blink` — Browser using Blink Rendering Engine

-   `is_webkit` — Browser using WebKit Rendering Engine

-   `is_presto` — Browser using Presto Rendering Engine

-   `is_trident` — Browser using Trident Rendering Engine

-   `is_edge_html` — Browser using EdgeHTML Rendering Engine

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)
