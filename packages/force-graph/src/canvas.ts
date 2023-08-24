import {Ev} from '@nothing-but/dom'
import {Misc, Num, T, Trig} from '@nothing-but/utils'
import {Graph} from './index.js'

interface Options {
    readonly el: HTMLCanvasElement
    readonly ctx: CanvasRenderingContext2D
    readonly graph: Graph.Graph
    readonly max_scale: number
    readonly init_scale: number
    readonly init_grid_pos: T.Position
    readonly nodeLabel: (node: Graph.Node) => string
    readonly onNodeClick: (node: Graph.Node) => void
}

export const default_options = {
    max_scale: 7,
    init_scale: 1,
    init_grid_pos: Trig.ZERO,
    nodeLabel: (node: Graph.Node) => String(node.key),
    onNodeClick: Misc.noop,
} as const satisfies Partial<Options>

interface CanvasState {
    readonly options: Options
    max_size: number
    size: T.Size
    /**
     * camera translate from the center of the canvas in graph plane
     * Default: `{ x: 0, y: 0 }`
     */
    translate: T.Position
    /**
     * from 1 to max_scale
     */
    scale: number
    // TODO this should be a part of render & interaction connection
    hoveredNode(): Graph.Node | null
}

export function canvasState(options: Options): CanvasState {
    const el = options.el

    const canvas: CanvasState = {
        options,
        max_size: 0,
        size: getCanvasSize(el),
        translate: Trig.vector(options.init_grid_pos),
        scale: clampCanvasScale(options, options.init_scale),
        hoveredNode() {
            return null
        },
    }

    updateCanvasSize(canvas, canvas.size)

    return canvas
}

function clampCanvasScale(options: Options, new_scale: number): number {
    return Num.clamp(new_scale, 1, options.max_scale)
}
function updateTranslate(canvas: CanvasState, x: number, y: number): void {
    const grid_size = canvas.options.graph.grid.size,
        {scale, size, translate} = canvas,
        radius = grid_size / 2,
        ar_offset_x = arMargin(size.width / size.height) * (grid_size / scale),
        ar_offset_y = arMargin(size.height / size.width) * (grid_size / scale)

    translate.x = Num.clamp(
        x,
        radius / scale - radius - ar_offset_x,
        radius - radius / scale + ar_offset_x,
    )
    translate.y = Num.clamp(
        y,
        radius / scale - radius - ar_offset_y,
        radius - radius / scale + ar_offset_y,
    )
}

export function updateCanvasSize(canvas: CanvasState, size: T.Size): void {
    canvas.size = size
    canvas.options.el.width = size.width
    canvas.options.el.height = size.height
    canvas.max_size = Math.max(size.width, size.height)
    updateTranslate(canvas, canvas.translate.x, canvas.translate.y)
}

export function nodeRadius(canvas_size: number): number {
    return canvas_size / 240
}
export function pointerNodeRadius(canvas_size: number, grid_size: number): number {
    const radius = nodeRadius(canvas_size)
    const margin = 5
    return ((radius + margin) / canvas_size) * grid_size
}

export function edgeWidth(canvas_size: number, scale: number): number {
    return (canvas_size / 8000 / scale) * 3
}

export function arMargin(ar: number): number {
    return (1 - Math.min(1, ar)) / 2
}

export function eventToPointRatio(
    canvas: CanvasState,
    e: PointerEvent | WheelEvent | MouseEvent,
): T.Position {
    const ratio = Ev.ratioInElement(e, canvas.options.el)

    /*
        correct for aspect ratio by shifting the shorter side's axis
    */
    ratio.x =
        ratio.x * Math.min(1, canvas.size.width / canvas.size.height) +
        arMargin(canvas.size.width / canvas.size.height)
    ratio.y =
        ratio.y * Math.min(1, canvas.size.height / canvas.size.width) +
        arMargin(canvas.size.height / canvas.size.width)

    return ratio
}

function eventToPointGraph(
    canvas: CanvasState,
    e: PointerEvent | WheelEvent | MouseEvent,
): T.Position {
    const ratio = eventToPointRatio(canvas, e)
    return pointRatioToGraph(canvas, ratio)
}

function pointRatioToGraph(canvas: CanvasState, pos: T.Position): T.Position {
    const {scale, translate} = canvas,
        grid_size = canvas.options.graph.grid.size

    let x = pos.x
    let y = pos.y

    /*
        to graph plane, correct for scale shifting the origin
    */
    const scaled_grid_size = grid_size / scale
    const correct_origin = grid_size / 2 - scaled_grid_size / 2
    x = x * scaled_grid_size + correct_origin
    y = y * scaled_grid_size + correct_origin

    /*
        add user T.Position
    */
    x += translate.x
    y += translate.y

    return {x, y}
}

export function drawEdges(canvas: CanvasState): void {
    const {ctx, graph} = canvas.options

    const edge_width = edgeWidth(canvas.max_size, canvas.scale)

    for (const {a, b} of graph.edges) {
        const opacity = 0.2 + ((a.mass + b.mass - 2) / 100) * 2 * canvas.scale

        ctx.strokeStyle =
            a.anchor || b.anchor
                ? `rgba(129, 140, 248, ${opacity})`
                : `rgba(150, 150, 150, ${opacity})`
        ctx.lineWidth = edge_width
        ctx.beginPath()
        ctx.moveTo(
            (a.position.x / graph.grid.size) * canvas.max_size,
            (a.position.y / graph.grid.size) * canvas.max_size,
        )
        ctx.lineTo(
            (b.position.x / graph.grid.size) * canvas.max_size,
            (b.position.y / graph.grid.size) * canvas.max_size,
        )
        ctx.stroke()
    }
}

export function drawDotNodes(canvas: CanvasState): void {
    const {ctx, graph} = canvas.options

    const node_radius = nodeRadius(canvas.max_size)

    for (const node of graph.nodes) {
        const {x, y} = node.position
        const opacity = 0.6 + (node.mass / 10) * 4

        ctx.fillStyle = node.anchor
            ? `rgba(129, 140, 248, ${opacity})`
            : `rgba(248, 113, 113, ${opacity})`
        ctx.beginPath()
        ctx.ellipse(
            (x / graph.grid.size) * canvas.max_size,
            (y / graph.grid.size) * canvas.max_size,
            node_radius,
            node_radius,
            0,
            0,
            Math.PI * 2,
        )
        ctx.fill()
    }
}

export function drawTextNodes(canvas: CanvasState): void {
    const {ctx, graph, nodeLabel} = canvas.options

    const hovered_node = canvas.hoveredNode()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (const node of graph.nodes) {
        const {x, y} = node.position
        const opacity = 0.6 + ((node.mass - 1) / 50) * 4

        ctx.font = `${
            canvas.max_size / 200 + (((node.mass - 1) / 5) * (canvas.max_size / 100)) / canvas.scale
        }px sans-serif`
        ctx.fillStyle =
            node.anchor || hovered_node === node
                ? `rgba(129, 140, 248, ${opacity})`
                : `rgba(248, 113, 113, ${opacity})`

        ctx.fillText(
            nodeLabel(node),
            (x / graph.grid.size) * canvas.max_size,
            (y / graph.grid.size) * canvas.max_size,
        )
    }
}

export function drawCanvas(canvas: CanvasState): void {
    const {ctx, graph} = canvas.options,
        {scale, translate: grid_pos} = canvas

    /*
        clear
    */
    ctx.resetTransform()
    ctx.clearRect(0, 0, canvas.max_size, canvas.max_size)

    /*
        origin (top-left corner) gets shifted away from the center
    */
    const correct_origin = ((1 - scale) * canvas.max_size) / 2
    let translate_x = correct_origin
    let translate_y = correct_origin

    /*
        subtract user T.Position (to move camera in the opposite direction)
    */
    translate_x -= (grid_pos.x / graph.grid.size) * canvas.max_size * scale
    translate_y -= (grid_pos.y / graph.grid.size) * canvas.max_size * scale

    /*
        correct for aspect ratio by shifting the shorter side's axis
    */
    translate_x += -arMargin(canvas.size.width / canvas.size.height) * canvas.max_size
    translate_y += -arMargin(canvas.size.height / canvas.size.width) * canvas.max_size

    ctx.setTransform(scale, 0, 0, scale, translate_x, translate_y)

    /*
        edges
    */
    drawEdges(canvas)

    /*
        nodes
    */
    drawTextNodes(canvas)
}

const enum Mode {
    Default,
    DraggingNode,
    MovingSpace,
    MovingDragging,
    MovingMultiTouch,
}

interface ModeState {
    readonly canvas: CanvasState
    readonly trigger: () => void
    mode:
        | DefaultState
        | DraggingNodeState
        | MovingSpaceState
        | MovingDraggingState
        | MovingMultiTouchState
}

interface BaseStateValue<TMode extends Mode> {
    type: TMode

    escape?(event: KeyboardEvent): void
    space?(event: KeyboardEvent): void
    spaceUp?(event: KeyboardEvent): void

    pointerDown?(event: PointerEvent): void
    pointerUp?(event: PointerEvent | null): void

    cleanup(): void
}

interface DefaultState extends BaseStateValue<Mode.Default> {
    hover_node: Graph.Node | null
}

interface DraggingNodeState extends BaseStateValue<Mode.DraggingNode> {}

interface MovingSpaceState extends BaseStateValue<Mode.MovingSpace> {}

function defaultState(mode_state: ModeState): DefaultState {
    const {canvas, trigger} = mode_state

    const removeListener = Ev.listener(canvas.options.el, 'mousemove', e => {
        if (e.buttons !== 0) return

        const point_graph = eventToPointGraph(canvas, e)
        const pointer_node_radius = pointerNodeRadius(
            canvas.max_size,
            canvas.options.graph.grid.size,
        )

        const node = Graph.findClosestNodeLinear(
            canvas.options.graph.nodes,
            point_graph,
            pointer_node_radius,
        )

        const prev_hover_node = value.hover_node
        if (prev_hover_node === node) return

        value.hover_node = node ?? null
        trigger()
    })

    const value: DefaultState = {
        type: Mode.Default,
        hover_node: null,
        pointerDown(e) {
            const point_ratio = eventToPointRatio(canvas, e),
                point_graph = pointRatioToGraph(canvas, point_ratio)

            const pointer_node_radius = pointerNodeRadius(
                canvas.max_size,
                canvas.options.graph.grid.size,
            )

            const node = Graph.findClosestNodeLinear(
                canvas.options.graph.nodes,
                point_graph,
                pointer_node_radius,
            )

            mode_state.mode.cleanup()
            mode_state.mode = node
                ? draggingNodeState(mode_state, {
                      node,
                      e,
                      point_graph,
                      point_ratio,
                  })
                : moveDraggingState(mode_state, {
                      from: Mode.Default,
                      init_ratio: point_ratio,
                      pointer_id: e.pointerId,
                  })
        },
        space(e) {
            e.preventDefault()
            mode_state.mode.cleanup()
            mode_state.mode = movingSpaceState(mode_state)
        },
        cleanup() {
            removeListener()
            value.hover_node = null
        },
    }

    return value
}

function draggingNodeState(
    mode_state: ModeState,
    input: {
        node: Graph.Node
        e: PointerEvent
        point_graph: T.Position
        point_ratio: T.Position
    },
): DraggingNodeState {
    const {node} = input
    const {canvas} = mode_state

    node.anchor = true

    const goal_node_pos_delta = Trig.difference(input.point_graph, node.position)

    let goal_graph_node_pos = input.point_graph
    let goal_point_ratio = input.point_ratio

    /*
        Smoothly move the node to the pointer T.Position
        */
    const interval = setInterval(() => {
        Trig.multiply(goal_node_pos_delta, 0.95)
        Graph.changeNodePosition(
            canvas.options.graph.grid,
            node,
            goal_graph_node_pos.x - goal_node_pos_delta.x,
            goal_graph_node_pos.y - goal_node_pos_delta.y,
        )

        const d = Trig.distance(Trig.ZERO, goal_node_pos_delta)
        if (d < 0.1) {
            clearInterval(interval)
            goal_node_pos_delta.x = 0
            goal_node_pos_delta.y = 0
        }
    })

    let click_prevented = false

    const pointer_id = input.e.pointerId
    const down_event_pos = {x: input.e.clientX, y: input.e.clientY}

    const removeListener = Ev.listener(document, 'pointermove', e => {
        if (e.pointerId !== pointer_id) return

        goal_point_ratio = eventToPointRatio(canvas, e)
        goal_graph_node_pos = pointRatioToGraph(canvas, goal_point_ratio)
        const graph_node_pos = Trig.difference(goal_graph_node_pos, goal_node_pos_delta)

        if (!click_prevented) {
            const dist = Trig.distance(down_event_pos, {x: e.clientX, y: e.clientY})

            if (dist > 14) {
                click_prevented = true
            }
        }

        Graph.changeNodePosition(
            canvas.options.graph.grid,
            node,
            graph_node_pos.x,
            graph_node_pos.y,
        )
    })

    return {
        type: Mode.DraggingNode,
        pointerUp(e) {
            if (e instanceof PointerEvent && e.pointerId !== pointer_id) return

            if (!click_prevented) {
                canvas.options.onNodeClick(node)
            }

            mode_state.mode.cleanup()
            mode_state.mode = defaultState(mode_state)
        },
        pointerDown(e) {
            mode_state.mode.cleanup()
            mode_state.mode = moveMultiTouchState(mode_state, {
                e,
                from: Mode.Default,
                pointer_id_0: pointer_id,
                init_ratio_0: goal_point_ratio,
            })
        },
        cleanup() {
            node.anchor = false
            clearInterval(interval)
            removeListener()
        },
    }
}

function movingSpaceState(mode_state: ModeState): MovingSpaceState {
    const {canvas} = mode_state

    return {
        type: Mode.MovingSpace,
        space(e) {
            e.preventDefault()
        },
        spaceUp() {
            mode_state.mode.cleanup()
            mode_state.mode = defaultState(mode_state)
        },
        pointerDown(e) {
            mode_state.mode.cleanup()
            mode_state.mode = moveDraggingState(mode_state, {
                from: Mode.MovingSpace,
                init_ratio: eventToPointRatio(canvas, e),
                pointer_id: e.pointerId,
            })
        },
        cleanup: Misc.noop,
    }
}

interface MovingDraggingState extends BaseStateValue<Mode.MovingDragging> {
    canvas: CanvasState
    from: Mode.Default | Mode.MovingSpace
    init_ratio: T.Position
    last_ratio: T.Position
    init_graph_position: T.Position
    pointer_id: number
    space_lifted: boolean
}

function handleMoveEvent(state: MovingDraggingState, trigger: () => void, e: PointerEvent): void {
    if (e.pointerId !== state.pointer_id) return

    e.preventDefault()
    e.stopPropagation()

    const {canvas} = state

    const ratio = eventToPointRatio(canvas, e)
    state.last_ratio = ratio

    const delta = Trig.difference(state.init_ratio, ratio)
    Trig.multiply(delta, canvas.options.graph.grid.size / canvas.scale)

    updateTranslate(
        canvas,
        state.init_graph_position.x + delta.x,
        state.init_graph_position.y + delta.y,
    )

    trigger()
}

function moveDraggingState(
    mode_state: ModeState,
    input: {
        from: Mode.Default | Mode.MovingSpace
        init_ratio: T.Position
        pointer_id: number
    },
): MovingDraggingState {
    const {canvas, trigger} = mode_state

    const removeListener = Ev.listener(document, 'pointermove', e => {
        handleMoveEvent(state, trigger, e)
    })

    const state: MovingDraggingState = {
        type: Mode.MovingDragging,
        canvas: canvas,
        from: input.from,
        init_ratio: input.init_ratio,
        last_ratio: input.init_ratio,
        init_graph_position: Trig.vector(canvas.translate),
        pointer_id: input.pointer_id,
        space_lifted: false,
        space(e) {
            e.preventDefault()
        },
        spaceUp() {
            state.space_lifted = true
        },
        pointerUp(e) {
            if (e instanceof PointerEvent && e.pointerId !== input.pointer_id) return

            mode_state.mode.cleanup()
            mode_state.mode =
                state.space_lifted || input.from === Mode.Default
                    ? defaultState(mode_state)
                    : movingSpaceState(mode_state)
        },
        pointerDown(e) {
            mode_state.mode.cleanup()
            mode_state.mode = moveMultiTouchState(mode_state, {
                e,
                from: input.from,
                pointer_id_0: input.pointer_id,
                init_ratio_0: state.last_ratio,
            })
        },
        cleanup() {
            removeListener()
        },
    }

    return state
}

interface MovingMultiTouchState extends BaseStateValue<Mode.MovingMultiTouch> {
    canvas: CanvasState
    pointer_id_0: number
    pointer_id_1: number
    init_ratio_0: T.Position
    init_ratio_1: T.Position
    last_ratio_0: T.Position
    last_ratio_1: T.Position
    init_scale: number
    init_dist: number
    init_graph_position: T.Position
}

function handleMultiTouchEvent(
    state: MovingMultiTouchState,
    trigger: () => void,
    e: PointerEvent,
): void {
    if (e.pointerId !== state.pointer_id_0 && e.pointerId !== state.pointer_id_1) return

    e.preventDefault()
    e.stopPropagation()

    const {canvas} = state

    let ratio_0 = state.last_ratio_0
    let ratio_1 = state.last_ratio_1

    if (e.pointerId === state.pointer_id_0) {
        state.last_ratio_0 = ratio_0 = eventToPointRatio(canvas, e)
    } else {
        state.last_ratio_1 = ratio_1 = eventToPointRatio(canvas, e)
    }

    let scale = state.init_scale * (Trig.distance(ratio_0, ratio_1) / state.init_dist)
    scale = clampCanvasScale(canvas.options, scale)
    canvas.scale = scale

    const delta = Trig.average(
        Trig.difference(state.init_ratio_0, ratio_0),
        Trig.difference(state.init_ratio_1, ratio_1),
    )
    Trig.multiply(delta, canvas.options.graph.grid.size / scale)

    updateTranslate(
        canvas,
        state.init_graph_position.x + delta.x,
        state.init_graph_position.y + delta.y,
    )

    trigger()
}

function moveMultiTouchState(
    mode_state: ModeState,
    input: {
        from: Mode.Default | Mode.MovingSpace
        pointer_id_0: number
        init_ratio_0: T.Position
        e: PointerEvent
    },
): MovingMultiTouchState {
    const {canvas, trigger} = mode_state

    const init_ratio_0 = input.init_ratio_0
    const init_ratio_1 = eventToPointRatio(canvas, input.e)

    const removeListener = Ev.listener(document, 'pointermove', e => {
        handleMultiTouchEvent(state, trigger, e)
    })

    const state: MovingMultiTouchState = {
        type: Mode.MovingMultiTouch,
        canvas,
        pointer_id_0: input.pointer_id_0,
        pointer_id_1: input.e.pointerId,
        init_ratio_0,
        init_ratio_1,
        last_ratio_0: init_ratio_0,
        last_ratio_1: init_ratio_1,
        init_scale: canvas.scale,
        init_dist: Trig.distance(init_ratio_0, init_ratio_1),
        init_graph_position: Trig.vector(canvas.translate),
        pointerUp(e) {
            if (e == null) {
                mode_state.mode.cleanup()
                mode_state.mode = defaultState(mode_state)
                return
            }

            let pointer_id: number
            let ratio: T.Position

            if (e.pointerId === state.pointer_id_0) {
                pointer_id = state.pointer_id_1
                ratio = state.last_ratio_1
            } else if (e.pointerId === state.pointer_id_1) {
                pointer_id = state.pointer_id_0
                ratio = state.last_ratio_0
            } else {
                return
            }

            mode_state.mode.cleanup()
            mode_state.mode = moveDraggingState(mode_state, {
                from: input.from,
                init_ratio: ratio,
                pointer_id,
            })
        },
        cleanup() {
            removeListener()
        },
    }

    return state
}

function handleWheelEvent(canvas: CanvasState, trigger: () => void, e: WheelEvent): void {
    e.preventDefault()

    /*
        keep the same graph point under the cursor
    */
    const graph_point_before = eventToPointGraph(canvas, e)

    let {scale} = canvas

    /*
        Use a sine function slow down the zooming as it gets closer to the min and max zoom
        y = sin(x • π) where x is the current zoom % and y is the delta multiplier
        the current zoom need to be converted to a % with a small offset
        because sin(0) = sin(π) = 0 which would completely stop the zooming
    */
    const offset = 1 / ((canvas.options.max_scale - 1) * 2),
        scale_with_offset = Num.map_range(scale, 1, canvas.options.max_scale, offset, 1 - offset),
        zoom_mod = Math.sin(scale_with_offset * Math.PI)

    scale += e.deltaY * -0.005 * zoom_mod
    scale = clampCanvasScale(canvas.options, scale)
    canvas.scale = scale

    const graph_point_after = eventToPointGraph(canvas, e)
    const delta = Trig.difference(graph_point_before, graph_point_after)

    updateTranslate(
        canvas,
        canvas.translate.x + delta.x + e.deltaX * (0.1 / scale),
        canvas.translate.y + delta.y,
    )

    trigger()
}

export function getCanvasSize(el: HTMLCanvasElement): T.Size {
    const pixel_ratio = window.devicePixelRatio
    const rect = el.getBoundingClientRect()

    return {
        width: rect.width * pixel_ratio,
        height: rect.height * pixel_ratio,
    }
}

export function canvasResizeObserver(
    el: HTMLCanvasElement,
    callback: (size: T.Size) => void,
): () => void {
    const ro = new ResizeObserver(() => callback(getCanvasSize(el)))
    ro.observe(el)
    return ro.disconnect.bind(ro)
}

export function createCanvasForceGraph(options: Options): CanvasState {
    const {el, graph} = options

    const canvas = canvasState(options)

    const trigger = () => {}

    const removeObserver = canvasResizeObserver(el, size => {
        updateCanvasSize(canvas, size)
        trigger()
    })

    const mode_state: ModeState = {canvas, trigger, mode: null!}
    mode_state.mode = defaultState(mode_state)

    canvas.hoveredNode = () =>
        mode_state.mode.type === Mode.Default ? mode_state.mode.hover_node : null

    const cleanup1 = Ev.listenerMap(el, {
        pointerdown(e) {
            mode_state.mode.pointerDown?.(e)
        },
        wheel(e) {
            handleWheelEvent(canvas, trigger, e)
        },
    })

    const cleanup2 = Ev.listenerMap(document, {
        pointerup(e) {
            mode_state.mode.pointerUp?.(e)
        },
        pointercancel(e) {
            mode_state.mode.pointerUp?.(e)
        },
        contextmenu() {
            mode_state.mode.pointerUp?.(null)
        },
        keydown(e) {
            if (Ev.shouldIgnoreKeydown(e)) return

            switch (e.key) {
                case 'Escape': {
                    mode_state.mode.escape?.(e)
                    break
                }
                case 'Control': {
                    mode_state.mode.space?.(e)
                    break
                }
            }
        },
        keyup(e) {
            if (Ev.shouldIgnoreKeydown(e)) return

            if (e.key === 'Control') {
                mode_state.mode.spaceUp?.(e)
            }
        },
    })

    // const init = s.memo(() => {
    //     options.trackNodes() // track changes to nodes

    //     const init = s.signal(true)
    //     const timeout = setTimeout(() => s.set(init, false), 2000)
    //     onCleanup(() => clearTimeout(timeout))

    //     return init.read
    // })

    // const active = s.memo(() => mode.type === Mode.DraggingNode || init.read()())

    // createEffect(() => {
    //     if (active.read()) {
    //         startFrameAnimation(animation)
    //     } else {
    //         pauseFrameAnimation(animation)
    //     }
    // })

    // createEffect(() => {
    //     if (active.read()) return

    //     // track changes to the canvas
    //     signal.read()
    //     mode()

    //     requestAnimationFrame(boundUpdateCanvas)
    // })

    // onCleanup(() => {
    //     cleanupFrameAnimation(animation)
    // })

    return canvas
}
