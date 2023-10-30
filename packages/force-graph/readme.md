# Force Graph

**`@nothing-but/force-graph`**

https://nothing-but.vercel.app

TODO:

-   [x] node key
-   [x] node mass
-   [x] delta time (simulation iterations)
-   [x] grid config
-   [x] link strength
-   [x] stop simulation when inactive (alpha)
-   [x] adding/removing nodes
-   [x] make the graph bigger
-   [x] canvas rendering
    -   [x] dispaly node labels
    -   [x] custom aspect ratios
    -   [x] move to lib
    -   [x] remove solid dependency
    -   [ ] link directions (arrows)
    -   [x] custom rendering of nodes/edges
-   [x] ~~svg rendering~~ (deprecated for now, canvas is way faster)
-   [x] interaction - gestures
    -   [x] dragging nodes
        -   [x] touch
    -   [x] movement gestures
        -   [x] with space
        -   [x] without space
        -   [x] touch
        -   [x] clamp to graph
    -   [x] zoom gestures
        -   [x] zoom to mouse position
        -   [x] touch
    -   [x] hover
    -   [x] click
    -   [x] avoid closures - recreating functions
    -   [x] separate from rendering
        -   [ ] separate from canvas
        -   [ ] standard interfaces? (strategy pattern)
    -   [ ] classes (has internal lifecycle)
    -   [x] escape key to reset
    -   [ ] try immediate mode api (instead of callbacks, handle interactions in the next frame)
-   [ ] frame animation class
