# @nothing-but/eslint-plugin

## `no-ignored-return`

If a function returns a value, then that value must be used.

TODO:

-   [x] nested methods `utl.raf.makeAnimationLoop`
-   [x] `fn.apply()` and `fn.call()` methods
-   [ ] `bool && returningFunc()` expressions

## `no-return-to-void`

If a callback should return `void`, then it should not return anything.

TODO:

-   [x] Arrow functions
-   [ ] Function declarations
-   [ ] Anonymous functions
-   [ ] Overloads (not sure how to know which one is the active one)

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
