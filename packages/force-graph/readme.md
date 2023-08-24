# Force Graph

**`@nothing-but/force-graph`**

https://nothing-but.vercel.app

TODO:

-   [x] node key
-   [x] node mass
-   [x] delta time (simulation iterations)
-   [x] grid config
-   [x] link strength
-   [ ] link directions (arrows)
-   [x] stop simulation when inactive (alpha)
-   [ ] adding/removing nodes
-   [ ] make the graph bigger
-   [x] canvas rendering
    -   [x] dispaly node labels
    -   [ ] custom rendering of nodes/edges
    -   [x] custom aspect ratios
    -   [x] move to lib
    -   [ ] remove solid dependency
    -   [ ] avoid closures - recreating functions
-   [x] ~~svg rendering~~ (deprecated for now, canvas is way faster)
-   [x] interaction
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
    -   [ ] seaprate from rendering
