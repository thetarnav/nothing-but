# @nothing-but/force-graph

## 0.9.5

### Patch Changes

- Updated dependencies [4debfd1]
  - @nothing-but/utils@0.17.0

## 0.9.4

### Patch Changes

- Improve `set_positions_smart`

## 0.9.1

### Patch Changes

- "@nothing-but/utils": "workspace:\*"

## 0.9.0

### Minor Changes

- c082501: Add `set_positions_smart` and other helpers

### Patch Changes

- Updated dependencies [12c6da6]
- Updated dependencies [0f86073]
  - @nothing-but/utils@0.16.0

## 0.8.4

### Patch Changes

- Cleanup

## 0.8.2

### Patch Changes

- 3a58f6b: Don't draw nodes outside of the screen

## 0.8.0

### Minor Changes

- ab1a587: Update API

### Patch Changes

- 5ca21ca: Add `spread_positions` and fix clamping max position
- Updated dependencies [05172de]
  - @nothing-but/utils@0.15.0

## 0.7.3

### Patch Changes

- Updated dependencies [8386caa]
- Updated dependencies [316fd7a]
- Updated dependencies [1a1cdfb]
- Updated dependencies [dac347e]
  - @nothing-but/utils@0.14.0

## 0.7.2

### Patch Changes

- Updated dependencies [6a27bfa]
  - @nothing-but/utils@0.13.0

## 0.7.1

### Patch Changes

- 0096d37: prefer function and interface keywords
- Updated dependencies [0096d37]
  - @nothing-but/utils@0.12.1

## 0.7.0

### Minor Changes

- a5eeb1c: Move animation module, and resize observer utils to the @nothing-but/utils package

### Patch Changes

- Updated dependencies [a5eeb1c]
- Updated dependencies [1d8e020]
  - @nothing-but/utils@0.12.0

## 0.6.0

### Minor Changes

- 13c5bd2: Single callback for all gesture events

## 0.5.0

### Minor Changes

- eca4417: Change animation API to immediate-mode-like

## 0.4.4

### Patch Changes

- Updated dependencies [c492402]
  - @nothing-but/utils@0.11.1
  - @nothing-but/dom@0.1.5

## 0.4.3

### Patch Changes

- 45f7b52: Don't fire onNodeHover if node didn't change
- Updated dependencies [bac8863]
  - @nothing-but/utils@0.11.0
  - @nothing-but/dom@0.1.4

## 0.4.2

### Patch Changes

- 1aa1b87: Export Options and CanvasState types

## 0.4.1

### Patch Changes

- 3c2d46d: Add missing type. Include `src` dir in npm package

## 0.4.0

### Minor Changes

- 0fefeda: Add `resetFrame` fn, remove `graphOptions` fn

## 0.3.0

### Minor Changes

- 0a0ab0d: Rename default_options to DEFAULT-OPTIONS

  use node.label when rendering nodes as text

- 479881d: BREAKING CHANGES

  - Remove `makeNode` in favor of `zeroNode`.
  - Rename exported submodules using snake_case.

## 0.2.4

### Patch Changes

- Updated dependencies [8fb37d2]
  - @nothing-but/utils@0.10.1
  - @nothing-but/dom@0.1.3

## 0.2.3

### Patch Changes

- Updated dependencies [50e5aea]
  - @nothing-but/utils@0.10.0
  - @nothing-but/dom@0.1.2

## 0.2.2

### Patch Changes

- 8c69205: Add "files" filed to package.json
- Updated dependencies [fa0ccd8]
- Updated dependencies [8c69205]
  - @nothing-but/utils@0.9.0
  - @nothing-but/dom@0.1.1

## 0.2.1

### Patch Changes

- 411ebde: Fixes, code cleanup and escape key

## 0.2.0

### Minor Changes

- eca569b: Remove solid dependency, change API by separating canvas state, animation, interaction and resizing from each other.

### Patch Changes

- Updated dependencies [e8b226d]
- Updated dependencies [39a7fb4]
  - @nothing-but/utils@0.8.0
  - @nothing-but/dom@0.1.0

## 0.1.1

### Patch Changes

- da0db62: Hover and API change

## 0.1.0

### Minor Changes

- 45e213b: Add canvas rendering to the package

## 0.0.10

### Patch Changes

- Updated dependencies [69bbe07]
  - @nothing-but/utils@0.7.2

## 0.0.9

### Patch Changes

- 483fe33: Ability to move around canvas without pressing space

## 0.0.8

### Patch Changes

- ed277c5: Keep the same graph position under the cursor when zooming
- Updated dependencies [ed277c5]
- Updated dependencies [ed277c5]
  - @nothing-but/utils@0.7.1

## 0.0.7

### Patch Changes

- Updated dependencies [ae3a776]
  - @nothing-but/utils@0.7.0

## 0.0.6

### Patch Changes

- Updated dependencies [bb65f58]
  - @nothing-but/utils@0.6.0

## 0.0.5

### Patch Changes

- Updated dependencies [346fe6b]
  - @nothing-but/utils@0.5.0

## 0.0.4

### Patch Changes

- fbb07d4: Add option to customize graph options

## 0.0.3

### Patch Changes

- Updated dependencies [4f6f6ef]
  - @nothing-but/utils@0.4.2

## 0.0.2

### Patch Changes

- f157f0e: Add `moved` property to nodes
- Updated dependencies [950e9fa]
  - @nothing-but/utils@0.4.1

## 0.0.1

### Patch Changes

- 6af4706: Flip y axis
- 3fcb735: Reduce edge pull streangth for edges with large amount of edges.
- 731c590: Improve perf
