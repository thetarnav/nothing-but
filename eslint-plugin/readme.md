# @nothing-but/eslint-plugin

## `no-ignored-return`

If a function returns a value, then that value must be used.

TODO:

-   [x] nested methods `utl.raf.makeAnimationLoop`
-   [x] `fn.apply()` and `fn.call()` methods
-   [x] `bool && returningFunc()` expressions
-   [x] `never` doesn't need to be used
-   [ ] ignore `super()`
-   [ ] awaiting `Promise<some_value>`

## `no-return-to-void`

If a callback should return `void`, then it should not return anything.

TODO:

-   [x] Arrow functions
-   [x] Anonymous functions
-   [x] Overloads
-   [x] Fix `.then` (unions)

## `ignore-void-return`

If a function returns `void`, the return value shouldn't be used.

TODO TODO

## `no-unnecessary-instanceof`

Values tested with `instanceof` should have a union type with the tested class as a member.

-   [ ] Allow extended types

## `no-ignored-params`

Require that all callback parameters are used.

TODO:

-   [ ] implement

Resources:

-   [solidjs-community/eslint-plugin-solid](https://github.com/solidjs-community/eslint-plugin-solid)
-   [SonarSource/eslint-plugin-sonarjs](https://github.com/SonarSource/eslint-plugin-sonarjs/blob/master/package.json)
-   [typescript-eslint/typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/index.ts)
-   https://typescript-eslint.io/developers/custom-rules/#testing
-   https://astexplorer.net/
