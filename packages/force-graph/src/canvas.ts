import {T, event, num, trig} from '@nothing-but/utils'
import {graph} from './index.js'

export type Options = {
    readonly el: HTMLCanvasElement
    readonly ctx: CanvasRenderingContext2D
    readonly graph: graph.Graph
    readonly max_scale: number
    readonly init_scale: number
    readonly init_grid_pos: T.Position
}

export const DEFAULT_OPTIONS = {
    max_scale: 7,
    init_scale: 1,
    init_grid_pos: trig.ZERO,
} as const satisfies Partial<Options>

export type CanvasState = Options & {
    /**
     * camera translate from the center of the canvas in graph plane
     * Default: `{ x: 0, y: 0 }`
     */
    translate: T.Position
    /**
     * from 1 to max_scale
     */
    scale: number
    hovered_node: graph.Node | null
}

export function canvasState(options: Options): CanvasState {
    const canvas: CanvasState = {
        ...options,
        translate: {...options.init_grid_pos},
        scale: clampCanvasScale(options, options.init_scale),
        hovered_node: null,
    }

    updateTranslate(canvas, canvas.translate.x, canvas.translate.y)

    return canvas
}

function clampCanvasScale(options: Options, new_scale: number): number {
    return num.clamp(new_scale, 1, options.max_scale)
}

export function updateTranslate(canvas: CanvasState, x: number, y: number): void {
    const grid_size = canvas.graph.grid.size,
        {width, height} = canvas.el,
        {scale, translate} = canvas,
        radius = grid_size / 2,
        ar_offset_x = arMargin(width / height) * (grid_size / scale),
        ar_offset_y = arMargin(height / width) * (grid_size / scale)

    translate.x = num.clamp(
        x,
        radius / scale - radius - ar_offset_x,
        radius - radius / scale + ar_offset_x,
    )
    translate.y = num.clamp(
        y,
        radius / scale - radius - ar_offset_y,
        radius - radius / scale + ar_offset_y,
    )
}

export function updateCanvasSize(canvas: CanvasState): void {
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
    const ratio = event.ratioInElement(e, canvas.el)
    const {width, height} = canvas.el

    /*
        correct for aspect ratio by shifting the shorter side's axis
    */
    ratio.x = ratio.x * Math.min(1, width / height) + arMargin(width / height)
    ratio.y = ratio.y * Math.min(1, height / width) + arMargin(height / width)

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
        grid_size = canvas.graph.grid.size

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

export const resetFrame = (canvas: CanvasState): void => {
    const {ctx, graph} = canvas,
        {scale, translate: grid_pos} = canvas,
        {width, height} = canvas.el,
        max_size = Math.max(width, height)

    /*
        clear
    */
    ctx.resetTransform()
    ctx.clearRect(0, 0, max_size, max_size)

    /*
        origin (top-left corner) gets shifted away from the center
    */
    const correct_origin = ((1 - scale) * max_size) / 2
    let translate_x = correct_origin
    let translate_y = correct_origin

    /*
        subtract user T.Position (to move camera in the opposite direction)
    */
    translate_x -= (grid_pos.x / graph.grid.size) * max_size * scale
    translate_y -= (grid_pos.y / graph.grid.size) * max_size * scale

    /*
        correct for aspect ratio by shifting the shorter side's axis
    */
    translate_x += -arMargin(width / height) * max_size
    translate_y += -arMargin(height / width) * max_size

    ctx.setTransform(scale, 0, 0, scale, translate_x, translate_y)
}

export function drawEdges(canvas: CanvasState): void {
    const {ctx, graph} = canvas,
        {width, height} = canvas.el,
        max_size = Math.max(width, height)

    const edge_width = edgeWidth(max_size, canvas.scale)

    for (const {a, b} of graph.edges) {
        const opacity = 0.2 + ((a.mass + b.mass - 2) / 100) * 2 * canvas.scale

        ctx.strokeStyle =
            a.anchor || b.anchor || canvas.hovered_node === a || canvas.hovered_node === b
                ? `rgba(129, 140, 248, ${opacity})`
                : `rgba(150, 150, 150, ${opacity})`
        ctx.lineWidth = edge_width
        ctx.beginPath()
        ctx.moveTo(
            (a.position.x / graph.grid.size) * max_size,
            (a.position.y / graph.grid.size) * max_size,
        )
        ctx.lineTo(
            (b.position.x / graph.grid.size) * max_size,
            (b.position.y / graph.grid.size) * max_size,
        )
        ctx.stroke()
    }
}

export function drawDotNodes(canvas: CanvasState): void {
    const {ctx, graph} = canvas,
        {width, height} = canvas.el,
        max_size = Math.max(width, height)

    const node_radius = nodeRadius(max_size)

    for (const node of graph.nodes) {
        const {x, y} = node.position
        const opacity = 0.6 + (node.mass / 10) * 4

        ctx.fillStyle =
            node.anchor || canvas.hovered_node === node
                ? `rgba(129, 140, 248, ${opacity})`
                : `rgba(248, 113, 113, ${opacity})`
        ctx.beginPath()
        ctx.ellipse(
            (x / graph.grid.size) * max_size,
            (y / graph.grid.size) * max_size,
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
    const {ctx, graph} = canvas,
        {width, height} = canvas.el,
        max_size = Math.max(width, height)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (const node of graph.nodes) {
        const {x, y} = node.position
        const opacity = 0.6 + ((node.mass - 1) / 50) * 4

        ctx.font = `${
            max_size / 200 + (((node.mass - 1) / 5) * (max_size / 100)) / canvas.scale
        }px sans-serif`
        ctx.fillStyle =
            node.anchor || canvas.hovered_node === node
                ? `rgba(129, 140, 248, ${opacity})`
                : `rgba(248, 113, 113, ${opacity})`

        ctx.fillText(node.label, (x / graph.grid.size) * max_size, (y / graph.grid.size) * max_size)
    }
}

export const drawCanvas = (canvas: CanvasState): void => {
    resetFrame(canvas)
    drawEdges(canvas)
    drawTextNodes(canvas)
}

export interface CanvasGesturesOptions {
    readonly canvas: CanvasState
    readonly onGesture: (e: GestureEvent) => void
}

export interface CanvasGestures extends CanvasGesturesOptions {
    mode: ModeState
    cleanup1(): void
    cleanup2(): void
}

export enum GestureEventType {
    Translate,
    NodeClick,
    NodeHover,
    NodeDrag,
    ModeChange,
}
export type TranslateEvent = {
    type: GestureEventType.Translate
}
export type NodeClickEvent = {
    type: GestureEventType.NodeClick
    node: graph.Node
}
export type NodeHoverEvent = {
    type: GestureEventType.NodeHover
    node: graph.Node | null
}
export type NodeDragEvent = {
    type: GestureEventType.NodeDrag
    node: graph.Node
    pos: T.Position
}
export type ModeChangeEvent = {
    type: GestureEventType.ModeChange
    mode: Mode
}
export type GestureEvent =
    | TranslateEvent
    | NodeClickEvent
    | NodeHoverEvent
    | NodeDragEvent
    | ModeChangeEvent

export enum Mode {
    Default,
    DraggingNode,
    MovingSpace,
    MovingDragging,
    MovingMultiTouch,
}

interface DefaultState {
    readonly type: Mode.Default
    removeListener(): void
}

function handleMouseMoveEvent(gesture: CanvasGestures, state: DefaultState, e: MouseEvent): void {
    if (e.buttons !== 0) return

    const {canvas} = gesture,
        {width, height} = canvas.el,
        max_size = Math.max(width, height)

    const point_graph = eventToPointGraph(canvas, e)
    const pointer_node_radius = pointerNodeRadius(max_size, canvas.graph.grid.size)

    const node =
        graph.findClosestNodeLinear(canvas.graph.nodes, point_graph, pointer_node_radius) ?? null

    if (canvas.hovered_node !== node) {
        canvas.hovered_node = node
        gesture.onGesture({type: GestureEventType.NodeHover, node})
    }
}

function defaultState(gesture: CanvasGestures): DefaultState {
    const {canvas} = gesture

    const removeListener = event.listener(canvas.el, 'mousemove', e => {
        handleMouseMoveEvent(gesture, state, e)
    })

    const state: DefaultState = {
        type: Mode.Default,
        removeListener,
    }

    return state
}

interface DraggingNodeState {
    readonly type: Mode.DraggingNode
    node: graph.Node
    pointer_id: number
    goal_point_ratio: T.Position
    click_prevented: boolean
    interval: ReturnType<typeof setInterval>
    removeListener(): void
}

function draggingNodeState(
    gesture: CanvasGestures,
    input: {
        node: graph.Node
        e: PointerEvent
        point_graph: T.Position
        point_ratio: T.Position
    },
): DraggingNodeState {
    const {node} = input
    const {canvas} = gesture

    node.anchor = true

    const goal_node_pos_delta = trig.difference(input.point_graph, node.position)

    let goal_graph_node_pos = input.point_graph

    /*
        Smoothly move the node to the pointer T.Position
        */
    const interval = setInterval(() => {
        trig.multiply(goal_node_pos_delta, 0.95)

        const graph_node_pos = trig.difference(goal_graph_node_pos, goal_node_pos_delta)
        gesture.onGesture({type: GestureEventType.NodeDrag, node, pos: graph_node_pos})

        const d = trig.distance(trig.ZERO, goal_node_pos_delta)
        if (d < 0.1) {
            clearInterval(interval)
            goal_node_pos_delta.x = 0
            goal_node_pos_delta.y = 0
        }
    })

    const down_event_pos = {x: input.e.clientX, y: input.e.clientY}

    const removeListener = event.listener(document, 'pointermove', e => {
        if (e.pointerId !== state.pointer_id) return

        state.goal_point_ratio = eventToPointRatio(canvas, e)
        goal_graph_node_pos = pointRatioToGraph(canvas, state.goal_point_ratio)
        const graph_node_pos = trig.difference(goal_graph_node_pos, goal_node_pos_delta)

        if (!state.click_prevented) {
            const dist = trig.distance(down_event_pos, {x: e.clientX, y: e.clientY})

            if (dist > 14) {
                state.click_prevented = true
            }
        }

        gesture.onGesture({type: GestureEventType.NodeDrag, node, pos: graph_node_pos})
    })

    const state: DraggingNodeState = {
        node,
        type: Mode.DraggingNode,
        pointer_id: input.e.pointerId,
        goal_point_ratio: input.point_ratio,
        click_prevented: false,
        interval,
        removeListener,
    }

    return state
}

interface MovingSpaceState {
    readonly type: Mode.MovingSpace
}

function movingSpaceState(): MovingSpaceState {
    return {
        type: Mode.MovingSpace,
    }
}

interface MovingDraggingState {
    readonly type: Mode.MovingDragging
    canvas: CanvasState
    from: Mode.Default | Mode.MovingSpace
    init_ratio: T.Position
    last_ratio: T.Position
    init_graph_position: T.Position
    pointer_id: number
    removeListener(): void
}

function handleMoveEvent(state: MovingDraggingState, e: PointerEvent): boolean {
    if (e.pointerId !== state.pointer_id) return false

    e.preventDefault()
    e.stopPropagation()

    const {canvas} = state

    const ratio = eventToPointRatio(canvas, e)
    state.last_ratio = ratio

    const delta = trig.difference(state.init_ratio, ratio)
    trig.multiply(delta, canvas.graph.grid.size / canvas.scale)

    updateTranslate(
        canvas,
        state.init_graph_position.x + delta.x,
        state.init_graph_position.y + delta.y,
    )

    return true
}

function moveDraggingState(
    gesture: CanvasGestures,
    input: {
        from: Mode.Default | Mode.MovingSpace
        init_ratio: T.Position
        pointer_id: number
    },
): MovingDraggingState {
    const {canvas} = gesture

    const removeListener = event.listener(document, 'pointermove', e => {
        const should_update = handleMoveEvent(state, e)
        if (should_update) {
            gesture.onGesture({type: GestureEventType.Translate})
        }
    })

    const state: MovingDraggingState = {
        type: Mode.MovingDragging,
        canvas: canvas,
        from: input.from,
        init_ratio: input.init_ratio,
        last_ratio: input.init_ratio,
        init_graph_position: trig.vector(canvas.translate),
        pointer_id: input.pointer_id,
        removeListener,
    }

    return state
}

interface MovingMultiTouchState {
    readonly type: Mode.MovingMultiTouch
    canvas: CanvasState
    from: Mode.Default | Mode.MovingSpace
    pointer_id_0: number
    pointer_id_1: number
    init_ratio_0: T.Position
    init_ratio_1: T.Position
    last_ratio_0: T.Position
    last_ratio_1: T.Position
    init_scale: number
    init_dist: number
    init_graph_position: T.Position
    removeListener(): void
}

function handleMultiTouchEvent(state: MovingMultiTouchState, e: PointerEvent): boolean {
    if (e.pointerId !== state.pointer_id_0 && e.pointerId !== state.pointer_id_1) return false

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

    let scale = state.init_scale * (trig.distance(ratio_0, ratio_1) / state.init_dist)
    scale = clampCanvasScale(canvas, scale)
    canvas.scale = scale

    const delta = trig.average(
        trig.difference(state.init_ratio_0, ratio_0),
        trig.difference(state.init_ratio_1, ratio_1),
    )
    trig.multiply(delta, canvas.graph.grid.size / scale)

    updateTranslate(
        canvas,
        state.init_graph_position.x + delta.x,
        state.init_graph_position.y + delta.y,
    )

    return true
}

function moveMultiTouchState(
    gesture: CanvasGestures,
    input: {
        from: Mode.Default | Mode.MovingSpace
        pointer_id_0: number
        init_ratio_0: T.Position
        e: PointerEvent
    },
): MovingMultiTouchState {
    const {canvas} = gesture

    const init_ratio_0 = input.init_ratio_0
    const init_ratio_1 = eventToPointRatio(canvas, input.e)

    const removeListener = event.listener(document, 'pointermove', e => {
        const should_update = handleMultiTouchEvent(state, e)
        if (should_update) {
            gesture.onGesture({type: GestureEventType.Translate})
        }
    })

    const state: MovingMultiTouchState = {
        type: Mode.MovingMultiTouch,
        canvas,
        from: input.from,
        pointer_id_0: input.pointer_id_0,
        pointer_id_1: input.e.pointerId,
        init_ratio_0,
        init_ratio_1,
        last_ratio_0: init_ratio_0,
        last_ratio_1: init_ratio_1,
        init_scale: canvas.scale,
        init_dist: trig.distance(init_ratio_0, init_ratio_1),
        init_graph_position: trig.vector(canvas.translate),
        removeListener,
    }

    return state
}

export interface ModeStateMap {
    [Mode.Default]: DefaultState
    [Mode.DraggingNode]: DraggingNodeState
    [Mode.MovingSpace]: MovingSpaceState
    [Mode.MovingDragging]: MovingDraggingState
    [Mode.MovingMultiTouch]: MovingMultiTouchState
}

const mode_state_setup_map = {
    [Mode.Default]: defaultState,
    [Mode.DraggingNode]: draggingNodeState,
    [Mode.MovingSpace]: movingSpaceState,
    [Mode.MovingDragging]: moveDraggingState,
    [Mode.MovingMultiTouch]: moveMultiTouchState,
}

export type ModeState = ModeStateMap[Mode]

export type ModeStateInput<T extends Mode> = Parameters<(typeof mode_state_setup_map)[T]> extends [
    CanvasGestures,
    ...infer U,
]
    ? U
    : []

export function changeModeState<T extends Mode>(
    gesture: CanvasGestures,
    type: T,
    ...args: ModeStateInput<T>
): void {
    cleanupModeState(gesture)
    gesture.mode = mode_state_setup_map[type](
        gesture,
        // @ts-ignore
        ...args,
    )
    gesture.onGesture({type: GestureEventType.ModeChange, mode: type})
}

export function cleanupModeState(gesture: CanvasGestures): void {
    const {mode, canvas} = gesture

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (mode.type) {
        case Mode.Default: {
            mode.removeListener()
            if (canvas.hovered_node) {
                canvas.hovered_node = null
                gesture.onGesture({type: GestureEventType.NodeHover, node: null})
            }

            break
        }
        case Mode.DraggingNode: {
            mode.node.anchor = false
            clearInterval(mode.interval)
            mode.removeListener()

            break
        }
        case Mode.MovingDragging: {
            mode.removeListener()
            break
        }
        case Mode.MovingMultiTouch: {
            mode.removeListener()
            break
        }
    }
}

function handlePointerDownEvent(gesture: CanvasGestures, e: PointerEvent): void {
    const {canvas} = gesture
    const {mode} = gesture
    const {width, height} = canvas.el
    const max_size = Math.max(width, height)

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (mode.type) {
        case Mode.Default: {
            const point_ratio = eventToPointRatio(canvas, e),
                point_graph = pointRatioToGraph(canvas, point_ratio)

            const pointer_node_radius = pointerNodeRadius(max_size, canvas.graph.grid.size)

            const node = graph.findClosestNodeLinear(
                canvas.graph.nodes,
                point_graph,
                pointer_node_radius,
            )

            if (node) {
                changeModeState(gesture, Mode.DraggingNode, {
                    node,
                    e,
                    point_graph,
                    point_ratio,
                })
            } else {
                changeModeState(gesture, Mode.MovingDragging, {
                    from: Mode.Default,
                    init_ratio: point_ratio,
                    pointer_id: e.pointerId,
                })
            }
            break
        }
        case Mode.DraggingNode: {
            changeModeState(gesture, Mode.MovingMultiTouch, {
                e,
                from: Mode.Default,
                pointer_id_0: mode.pointer_id,
                init_ratio_0: mode.goal_point_ratio,
            })
            break
        }
        case Mode.MovingSpace: {
            changeModeState(gesture, Mode.MovingDragging, {
                from: Mode.MovingSpace,
                init_ratio: eventToPointRatio(canvas, e),
                pointer_id: e.pointerId,
            })
            break
        }
        case Mode.MovingDragging: {
            changeModeState(gesture, Mode.MovingMultiTouch, {
                e,
                from: mode.from,
                pointer_id_0: mode.pointer_id,
                init_ratio_0: mode.last_ratio,
            })
            break
        }
    }
}

function handlePointerUpEvent(gesture: CanvasGestures, e: PointerEvent | null): void {
    const {mode} = gesture

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (mode.type) {
        case Mode.DraggingNode: {
            if (e instanceof PointerEvent && e.pointerId !== mode.pointer_id) return

            if (!mode.click_prevented) {
                gesture.onGesture({type: GestureEventType.NodeClick, node: mode.node})
            }

            changeModeState(gesture, Mode.Default)
            break
        }
        case Mode.MovingDragging: {
            if (e instanceof PointerEvent && e.pointerId !== mode.pointer_id) return

            changeModeState(gesture, mode.from)
            break
        }
        case Mode.MovingMultiTouch: {
            if (e == null) {
                changeModeState(gesture, Mode.Default)
                return
            }

            let pointer_id: number
            let ratio: T.Position

            if (e.pointerId === mode.pointer_id_0) {
                pointer_id = mode.pointer_id_1
                ratio = mode.last_ratio_1
            } else if (e.pointerId === mode.pointer_id_1) {
                pointer_id = mode.pointer_id_0
                ratio = mode.last_ratio_0
            } else {
                return
            }

            changeModeState(gesture, Mode.MovingDragging, {
                from: mode.from,
                init_ratio: ratio,
                pointer_id,
            })
            break
        }
    }
}

function handleKeyDownEvent(gesture: CanvasGestures, e: KeyboardEvent): void {
    if (event.shouldIgnoreKeydown(e) || e.repeat) return

    const {mode} = gesture

    switch (e.key) {
        case 'Control': {
            if (mode.type !== Mode.Default) return
            e.preventDefault()
            changeModeState(gesture, Mode.MovingSpace)
            break
        }

        case 'Escape': {
            if (mode.type === Mode.Default) return
            e.preventDefault()
            changeModeState(gesture, Mode.Default)
            break
        }
    }
}

function handleKeyUpEvent(gesture: CanvasGestures, e: KeyboardEvent): void {
    if (event.shouldIgnoreKeydown(e)) return

    if (e.key !== 'Control') return

    const {mode} = gesture

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (mode.type) {
        case Mode.MovingSpace: {
            changeModeState(gesture, Mode.Default)
            break
        }
        case Mode.MovingDragging: {
            mode.from = Mode.Default
            break
        }
    }
}

function handleWheelEvent(canvas: CanvasState, e: WheelEvent): void {
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
    const offset = 1 / ((canvas.max_scale - 1) * 2),
        scale_with_offset = num.map_range(scale, 1, canvas.max_scale, offset, 1 - offset),
        zoom_mod = Math.sin(scale_with_offset * Math.PI)

    scale += e.deltaY * -0.005 * zoom_mod
    scale = clampCanvasScale(canvas, scale)
    canvas.scale = scale

    const graph_point_after = eventToPointGraph(canvas, e)
    const delta = trig.difference(graph_point_before, graph_point_after)

    updateTranslate(
        canvas,
        canvas.translate.x + delta.x + e.deltaX * (0.1 / scale),
        canvas.translate.y + delta.y,
    )
}

export function canvasGestures(options: CanvasGesturesOptions): CanvasGestures {
    const gesture: CanvasGestures = {
        canvas: options.canvas,
        onGesture: options.onGesture,
        mode: null!,
        cleanup1: null!,
        cleanup2: null!,
    }
    gesture.mode = defaultState(gesture)

    gesture.cleanup1 = event.listenerMap(options.canvas.el, {
        pointerdown(e) {
            handlePointerDownEvent(gesture, e)
        },
        wheel(e) {
            handleWheelEvent(options.canvas, e)
            gesture.onGesture({type: GestureEventType.Translate})
        },
    })

    gesture.cleanup2 = event.listenerMap(document, {
        pointerup(e) {
            handlePointerUpEvent(gesture, e)
        },
        pointercancel(e) {
            handlePointerUpEvent(gesture, e)
        },
        contextmenu() {
            handlePointerUpEvent(gesture, null)
        },
        keydown(e) {
            handleKeyDownEvent(gesture, e)
        },
        keyup(e) {
            handleKeyUpEvent(gesture, e)
        },
    })

    return gesture
}

export function cleanupCanvasGestures(gesture: CanvasGestures): void {
    gesture.cleanup1()
    gesture.cleanup2()
    cleanupModeState(gesture)
}
