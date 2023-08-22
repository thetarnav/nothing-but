import * as s from '@nothing-but/solid/signal'
import { event, math, misc, trig } from '@nothing-but/utils'
import type { Position } from '@nothing-but/utils/types'
import { createEventListener, createEventListenerMap } from '@solid-primitives/event-listener'
import { createMachine, type MachineStates } from '@solid-primitives/state-machine'
import { createEffect, onCleanup } from 'solid-js'
import {
    Graph,
    Node,
    changeNodePosition,
    findClosestNodeLinear,
    makeFrameAnimation,
    pauseFrameAnimation,
    startFrameAnimation,
    stopFrameAnimation,
} from './index.js'

interface CanvasOptions {
    readonly el: HTMLCanvasElement
    readonly ctx: CanvasRenderingContext2D
    readonly graph: Graph
    readonly max_scale: number
    readonly init_scale: number
    readonly init_grid_pos: Position
    readonly target_fps: number
    readonly nodeLabel: (node: Node) => string
    readonly trackNodes: () => void
    readonly onNodeClick: (node: Node) => void
}

export const default_canvas_options = {
    max_scale: 7,
    init_scale: 1,
    init_grid_pos: trig.ZERO,
    target_fps: 44,
    nodeLabel: (node: Node) => String(node.key),
    onNodeClick: misc.noop,
} as const satisfies Partial<CanvasOptions>

interface CanvasState {
    readonly options: CanvasOptions
    size: number
    width: number
    height: number
    /**
     * camera translate from the center of the canvas in graph plane
     * Default: `{ x: 0, y: 0 }`
     */
    translate: Position
    /**
     * from 1 to max_scale
     */
    scale: number
    // TODO this should be a part of render & interaction connection
    hoveredNode(): Node | null
}

function makeCanvasState(options: CanvasOptions): CanvasState {
    const el = options.el

    const canvas: CanvasState = {
        options,
        size: 0,
        width: 0,
        height: 0,
        translate: trig.vector(options.init_grid_pos),
        scale: clampCanvasScale(options, options.init_scale),
        hoveredNode() {
            return null
        },
    }

    updateCanvasSize(canvas, el.width, el.height)

    return canvas
}

function clampCanvasScale(options: CanvasOptions, new_scale: number): number {
    return math.clamp(new_scale, 1, options.max_scale)
}
function updateTranslate(canvas: CanvasState, x: number, y: number): void {
    const size = canvas.options.graph.grid.size,
        { scale, width, height, translate } = canvas,
        radius = size / 2,
        ar_offset_x = arMargin(width / height) * (size / scale),
        ar_offset_y = arMargin(height / width) * (size / scale)

    translate.x = math.clamp(
        x,
        radius / scale - radius - ar_offset_x,
        radius - radius / scale + ar_offset_x,
    )
    translate.y = math.clamp(
        y,
        radius / scale - radius - ar_offset_y,
        radius - radius / scale + ar_offset_y,
    )
}

function updateCanvasSize(canvas: CanvasState, width: number, height: number): void {
    canvas.width = canvas.options.el.width = width
    canvas.height = canvas.options.el.height = height
    canvas.size = Math.max(width, height)
    updateTranslate(canvas, canvas.translate.x, canvas.translate.y)
}

function nodeRadius(canvas_size: number): number {
    return canvas_size / 240
}
function pointerNodeRadius(canvas_size: number, grid_size: number): number {
    const radius = nodeRadius(canvas_size)
    const margin = 5
    return ((radius + margin) / canvas_size) * grid_size
}

function edgeWidth(canvas_size: number, scale: number): number {
    return (canvas_size / 8000 / scale) * 3
}

function arMargin(ar: number): number {
    return (1 - Math.min(1, ar)) / 2
}

function eventToPointRatio(
    canvas: CanvasState,
    e: PointerEvent | WheelEvent | MouseEvent,
): Position {
    const { width, height } = canvas

    const ratio = event.ratioInElement(e, canvas.options.el)

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
): Position {
    const ratio = eventToPointRatio(canvas, e)
    return pointRatioToGraph(canvas, ratio)
}

function pointRatioToGraph(canvas: CanvasState, pos: Position): Position {
    const { scale, translate } = canvas,
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
        add user position
    */
    x += translate.x
    y += translate.y

    return { x, y }
}

interface BaseInput {
    canvas: CanvasState
    trigger: VoidFunction
}

interface Events {
    ESCAPE?(event: KeyboardEvent): void
    SPACE?(event: KeyboardEvent): void
    SPACE_UP?(event: KeyboardEvent): void

    POINTER_DOWN?(event: PointerEvent): void
    POINTER_UP?(event: PointerEvent | null): void
}

const enum Mode {
    Default = 'default',
    DraggingNode = 'dragging_node',
    MoveSpace = 'move_space',
    MoveDragging = 'move_dragging',
    MoveMultiTouch = 'move_multi_touch',
}

type ModeStates = MachineStates<{
    [Mode.Default]: {
        to: Mode.DraggingNode | Mode.MoveSpace | Mode.MoveDragging
        input: BaseInput
        value: DefaultMode
    }
    [Mode.DraggingNode]: {
        to: Mode.Default | Mode.MoveMultiTouch
        input: BaseInput & {
            node: Node
            e: PointerEvent
            point_graph: Position
            point_ratio: Position
        }
        value: Events
    }
    [Mode.MoveSpace]: {
        to: Mode.Default | Mode.MoveDragging
        input: BaseInput
        value: Events
    }
    [Mode.MoveDragging]: {
        to: Mode.Default | Mode.MoveSpace | Mode.MoveMultiTouch
        input: BaseInput & {
            from: Mode.Default | Mode.MoveSpace
            init_ratio: Position
            pointer_id: number
        }
        value: Events
    }
    [Mode.MoveMultiTouch]: {
        to: Mode.MoveDragging | Mode.Default
        input: BaseInput & {
            from: MoveDragging['from']
            pointer_id_0: number
            init_ratio_0: Position
            e: PointerEvent
        }
        value: Events
    }
}>

interface DefaultMode extends Events {
    hover_node: Node | null
}

interface MoveDragging {
    canvas: CanvasState
    from: Mode.Default | Mode.MoveSpace
    init_ratio: Position
    last_ratio: Position
    init_graph_position: Position
    pointer_id: number
}

function handleMoveEvent(state: MoveDragging, trigger: VoidFunction, e: PointerEvent): void {
    if (e.pointerId !== state.pointer_id) return

    e.preventDefault()
    e.stopPropagation()

    const { canvas } = state

    const ratio = eventToPointRatio(canvas, e)
    state.last_ratio = ratio

    const delta = trig.difference(state.init_ratio, ratio)
    trig.multiply(delta, canvas.options.graph.grid.size / canvas.scale)

    updateTranslate(
        canvas,
        state.init_graph_position.x + delta.x,
        state.init_graph_position.y + delta.y,
    )

    trigger()
}

const moveDragging: ModeStates[Mode.MoveDragging] = (input, to) => {
    const { canvas, trigger } = input

    const state: MoveDragging = {
        canvas: canvas,
        from: input.from,
        init_ratio: input.init_ratio,
        last_ratio: input.init_ratio,
        init_graph_position: trig.vector(input.canvas.translate),
        pointer_id: input.pointer_id,
    }

    createEventListener(document, 'pointermove', e => {
        handleMoveEvent(state, trigger, e)
    })

    let space_lifted = false

    return {
        SPACE(e) {
            e.preventDefault()
        },
        SPACE_UP() {
            space_lifted = true
        },
        POINTER_UP(e) {
            if (e instanceof PointerEvent && e.pointerId !== input.pointer_id) return

            to(space_lifted ? Mode.Default : input.from, input)
        },
        POINTER_DOWN(e) {
            to(Mode.MoveMultiTouch, {
                e,
                canvas,
                trigger,
                from: input.from,
                pointer_id_0: input.pointer_id,
                init_ratio_0: state.last_ratio,
            })
        },
    }
}

interface MultiTouch {
    canvas: CanvasState
    pointer_id_0: number
    pointer_id_1: number
    init_ratio_0: Position
    init_ratio_1: Position
    last_ratio_0: Position
    last_ratio_1: Position
    init_scale: number
    init_dist: number
    init_graph_position: Position
}

function handleMultiTouchEvent(state: MultiTouch, trigger: VoidFunction, e: PointerEvent): void {
    if (e.pointerId !== state.pointer_id_0 && e.pointerId !== state.pointer_id_1) return

    e.preventDefault()
    e.stopPropagation()

    const { canvas } = state

    let ratio_0 = state.last_ratio_0
    let ratio_1 = state.last_ratio_1

    if (e.pointerId === state.pointer_id_0) {
        state.last_ratio_0 = ratio_0 = eventToPointRatio(canvas, e)
    } else {
        state.last_ratio_1 = ratio_1 = eventToPointRatio(canvas, e)
    }

    let scale = state.init_scale * (trig.distance(ratio_0, ratio_1) / state.init_dist)
    scale = clampCanvasScale(canvas.options, scale)
    canvas.scale = scale

    const delta = trig.average(
        trig.difference(state.init_ratio_0, ratio_0),
        trig.difference(state.init_ratio_1, ratio_1),
    )
    trig.multiply(delta, canvas.options.graph.grid.size / scale)

    updateTranslate(
        canvas,
        state.init_graph_position.x + delta.x,
        state.init_graph_position.y + delta.y,
    )

    trigger()
}

const moveMultiTouch: ModeStates[Mode.MoveMultiTouch] = (input, to) => {
    const { canvas, trigger } = input

    const init_ratio_0 = input.init_ratio_0
    const init_ratio_1 = eventToPointRatio(canvas, input.e)

    const state: MultiTouch = {
        canvas,
        pointer_id_0: input.pointer_id_0,
        pointer_id_1: input.e.pointerId,
        init_ratio_0,
        init_ratio_1,
        last_ratio_0: init_ratio_0,
        last_ratio_1: init_ratio_1,
        init_scale: canvas.scale,
        init_dist: trig.distance(init_ratio_0, init_ratio_1),
        init_graph_position: trig.vector(canvas.translate),
    }

    createEventListener(document, 'pointermove', e => {
        handleMultiTouchEvent(state, trigger, e)
    })

    return {
        POINTER_UP(e) {
            if (e == null) {
                to(Mode.Default, input)
                return
            }

            let pointer_id: number
            let ratio: Position

            if (e.pointerId === state.pointer_id_0) {
                pointer_id = state.pointer_id_1
                ratio = state.last_ratio_1
            } else if (e.pointerId === state.pointer_id_1) {
                pointer_id = state.pointer_id_0
                ratio = state.last_ratio_0
            } else {
                return
            }

            to(Mode.MoveDragging, {
                from: input.from,
                canvas,
                trigger,
                init_ratio: ratio,
                pointer_id,
            })
        },
    }
}

function handleWheelEvent(canvas: CanvasState, trigger: VoidFunction, e: WheelEvent): void {
    e.preventDefault()

    /*
        keep the same graph point under the cursor
    */
    const graph_point_before = eventToPointGraph(canvas, e)

    let { scale } = canvas

    /*
        Use a sine function slow down the zooming as it gets closer to the min and max zoom
        y = sin(x • π) where x is the current zoom % and y is the delta multiplier
        the current zoom need to be converted to a % with a small offset
        because sin(0) = sin(π) = 0 which would completely stop the zooming
    */
    const offset = 1 / ((canvas.options.max_scale - 1) * 2),
        scale_with_offset = math.map_range(scale, 1, canvas.options.max_scale, offset, 1 - offset),
        zoom_mod = Math.sin(scale_with_offset * Math.PI)

    scale += e.deltaY * -0.005 * zoom_mod
    scale = clampCanvasScale(canvas.options, scale)
    canvas.scale = scale

    const graph_point_after = eventToPointGraph(canvas, e)
    const delta = trig.difference(graph_point_before, graph_point_after)

    updateTranslate(
        canvas,
        canvas.translate.x + delta.x + e.deltaX * (0.1 / scale),
        canvas.translate.y + delta.y,
    )

    trigger()
}

const mode_states: ModeStates = {
    [Mode.Default](input, to) {
        const { canvas, trigger } = input

        const value: DefaultMode = {
            hover_node: null,
            POINTER_DOWN(e) {
                const point_ratio = eventToPointRatio(canvas, e),
                    point_graph = pointRatioToGraph(canvas, point_ratio)

                const pointer_node_radius = pointerNodeRadius(
                    canvas.size,
                    canvas.options.graph.grid.size,
                )

                const node = findClosestNodeLinear(
                    canvas.options.graph.nodes,
                    point_graph,
                    pointer_node_radius,
                )

                if (node) {
                    to(Mode.DraggingNode, {
                        canvas,
                        trigger,
                        node,
                        e,
                        point_graph,
                        point_ratio,
                    })
                } else {
                    to(Mode.MoveDragging, {
                        from: Mode.Default,
                        canvas,
                        trigger,
                        init_ratio: point_ratio,
                        pointer_id: e.pointerId,
                    })
                }
            },
            SPACE(e) {
                e.preventDefault()
                to(Mode.MoveSpace, input)
            },
        }

        createEventListener(canvas.options.el, 'mousemove', e => {
            if (e.buttons !== 0) return

            const point_graph = eventToPointGraph(canvas, e)
            const pointer_node_radius = pointerNodeRadius(
                canvas.size,
                canvas.options.graph.grid.size,
            )

            const node = findClosestNodeLinear(
                canvas.options.graph.nodes,
                point_graph,
                pointer_node_radius,
            )

            const prev_hover_node = value.hover_node
            if (prev_hover_node === node) return

            value.hover_node = node ?? null
            trigger()
        })
        onCleanup(() => {
            value.hover_node = null
        })

        return value
    },
    [Mode.DraggingNode](input, to) {
        const { canvas, trigger, node } = input

        node.anchor = true
        onCleanup(() => (node.anchor = false))

        const goal_node_pos_delta = trig.difference(input.point_graph, node.position)

        let goal_graph_node_pos = input.point_graph
        let goal_point_ratio = input.point_ratio

        /*
        Smoothly move the node to the pointer position
        */
        const interval = setInterval(() => {
            trig.multiply(goal_node_pos_delta, 0.95)
            changeNodePosition(
                canvas.options.graph.grid,
                node,
                goal_graph_node_pos.x - goal_node_pos_delta.x,
                goal_graph_node_pos.y - goal_node_pos_delta.y,
            )

            const d = trig.distance(trig.ZERO, goal_node_pos_delta)
            if (d < 0.1) {
                clearInterval(interval)
                goal_node_pos_delta.x = 0
                goal_node_pos_delta.y = 0
            }
        })
        onCleanup(() => clearInterval(interval))

        let click_prevented = false

        const pointer_id = input.e.pointerId
        const down_event_pos = { x: input.e.clientX, y: input.e.clientY }

        createEventListener(document, 'pointermove', e => {
            if (e.pointerId !== pointer_id) return

            goal_point_ratio = eventToPointRatio(canvas, e)
            goal_graph_node_pos = pointRatioToGraph(canvas, goal_point_ratio)
            const graph_node_pos = trig.difference(goal_graph_node_pos, goal_node_pos_delta)

            if (!click_prevented) {
                const dist = trig.distance(down_event_pos, { x: e.clientX, y: e.clientY })

                if (dist > 14) {
                    click_prevented = true
                }
            }

            changeNodePosition(canvas.options.graph.grid, node, graph_node_pos.x, graph_node_pos.y)
        })

        return {
            POINTER_UP(e) {
                if (e instanceof PointerEvent && e.pointerId !== pointer_id) return

                if (!click_prevented) {
                    canvas.options.onNodeClick(node)
                }

                to(Mode.Default, input)
            },
            POINTER_DOWN(e) {
                to(Mode.MoveMultiTouch, {
                    e,
                    canvas,
                    trigger,
                    from: Mode.Default,
                    pointer_id_0: pointer_id,
                    init_ratio_0: goal_point_ratio,
                })
            },
        }
    },
    [Mode.MoveSpace](input, to) {
        const { canvas, trigger } = input

        return {
            SPACE(e) {
                e.preventDefault()
            },
            SPACE_UP() {
                to(Mode.Default, input)
            },
            POINTER_DOWN(e) {
                to(Mode.MoveDragging, {
                    from: Mode.MoveSpace,
                    canvas,
                    trigger,
                    init_ratio: eventToPointRatio(canvas, e),
                    pointer_id: e.pointerId,
                })
            },
        }
    },
    [Mode.MoveDragging]: moveDragging,
    [Mode.MoveMultiTouch]: moveMultiTouch,
}

export function drawEdges(canvas: CanvasState): void {
    const { ctx, graph } = canvas.options

    const edge_width = edgeWidth(canvas.size, canvas.scale)

    for (const { a, b } of graph.edges) {
        const opacity = 0.2 + ((a.mass + b.mass - 2) / 100) * 2 * canvas.scale

        ctx.strokeStyle =
            a.anchor || b.anchor
                ? `rgba(129, 140, 248, ${opacity})`
                : `rgba(150, 150, 150, ${opacity})`
        ctx.lineWidth = edge_width
        ctx.beginPath()
        ctx.moveTo(
            (a.position.x / graph.grid.size) * canvas.size,
            (a.position.y / graph.grid.size) * canvas.size,
        )
        ctx.lineTo(
            (b.position.x / graph.grid.size) * canvas.size,
            (b.position.y / graph.grid.size) * canvas.size,
        )
        ctx.stroke()
    }
}

export function drawDotNodes(canvas: CanvasState): void {
    const { ctx, graph } = canvas.options

    const node_radius = nodeRadius(canvas.size)

    for (const node of graph.nodes) {
        const { x, y } = node.position
        const opacity = 0.6 + (node.mass / 10) * 4

        ctx.fillStyle = node.anchor
            ? `rgba(129, 140, 248, ${opacity})`
            : `rgba(248, 113, 113, ${opacity})`
        ctx.beginPath()
        ctx.ellipse(
            (x / graph.grid.size) * canvas.size,
            (y / graph.grid.size) * canvas.size,
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
    const { ctx, graph, nodeLabel } = canvas.options

    const hovered_node = canvas.hoveredNode()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (const node of graph.nodes) {
        const { x, y } = node.position
        const opacity = 0.6 + ((node.mass - 1) / 50) * 4

        ctx.font = `${
            canvas.size / 200 + (((node.mass - 1) / 5) * (canvas.size / 100)) / canvas.scale
        }px sans-serif`
        ctx.fillStyle =
            node.anchor || hovered_node === node
                ? `rgba(129, 140, 248, ${opacity})`
                : `rgba(248, 113, 113, ${opacity})`

        ctx.fillText(
            nodeLabel(node),
            (x / graph.grid.size) * canvas.size,
            (y / graph.grid.size) * canvas.size,
        )
    }
}

function drawCanvas(canvas: CanvasState, options: CanvasOptions): void {
    const { ctx, graph } = options,
        { scale, translate: grid_pos } = canvas

    /*
        clear
    */
    ctx.resetTransform()
    ctx.clearRect(0, 0, canvas.size, canvas.size)

    /*
        origin (top-left corner) gets shifted away from the center
    */
    const correct_origin = ((1 - scale) * canvas.size) / 2
    let translate_x = correct_origin
    let translate_y = correct_origin

    /*
        subtract user position (to move camera in the opposite direction)
    */
    translate_x -= (grid_pos.x / graph.grid.size) * canvas.size * scale
    translate_y -= (grid_pos.y / graph.grid.size) * canvas.size * scale

    /*
        correct for aspect ratio by shifting the shorter side's axis
    */
    translate_x += -arMargin(canvas.width / canvas.height) * canvas.size
    translate_y += -arMargin(canvas.height / canvas.width) * canvas.size

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

export function createCanvasForceGraph(options: CanvasOptions): CanvasState {
    const { el: el, graph } = options

    const canvas = makeCanvasState(options)

    const signal = s.signal()
    const trigger = () => s.trigger(signal)

    {
        const ro = new ResizeObserver(() => {
            const pixel_ratio = window.devicePixelRatio
            const rect = el.getBoundingClientRect()

            updateCanvasSize(canvas, rect.width * pixel_ratio, rect.height * pixel_ratio)

            trigger()
        })
        ro.observe(el)
        onCleanup(() => ro.disconnect())
    }

    const mode = createMachine({
        states: mode_states,
        initial: {
            type: Mode.Default,
            input: { canvas, trigger },
        },
    })

    canvas.hoveredNode = () => (mode.type === Mode.Default ? mode.value.hover_node : null)

    createEventListenerMap(el, {
        pointerdown(e) {
            mode.value.POINTER_DOWN?.(e)
        },
        wheel(e) {
            handleWheelEvent(canvas, trigger, e)
        },
    })

    createEventListenerMap(document, {
        pointerup(e) {
            mode.value.POINTER_UP?.(e)
        },
        pointercancel(e) {
            mode.value.POINTER_UP?.(e)
        },
        contextmenu() {
            mode.value.POINTER_UP?.(null)
        },
        keydown(e) {
            if (event.shouldIgnoreKeydown(e)) return

            switch (e.key) {
                case 'Escape': {
                    mode.value.ESCAPE?.(e)
                    break
                }
                case 'Control': {
                    mode.value.SPACE?.(e)
                    break
                }
            }
        },
        keyup(e) {
            if (event.shouldIgnoreKeydown(e)) return

            if (e.key === 'Control') {
                mode.value.SPACE_UP?.(e)
            }
        },
    })

    const boundUpdateCanvas = () => drawCanvas(canvas, options)

    const animation = makeFrameAnimation(graph, boundUpdateCanvas, options.target_fps)
    boundUpdateCanvas()

    const init = s.memo(() => {
        options.trackNodes() // track changes to nodes

        const init = s.signal(true)
        const timeout = setTimeout(() => s.set(init, false), 2000)
        onCleanup(() => clearTimeout(timeout))

        return init.read
    })

    const active = s.memo(() => mode.type === Mode.DraggingNode || init.read()())

    createEffect(() => {
        if (active.read()) {
            startFrameAnimation(animation)
        } else {
            pauseFrameAnimation(animation)
        }
    })

    createEffect(() => {
        if (active.read()) return

        // track changes to the canvas
        signal.read()
        mode()

        requestAnimationFrame(boundUpdateCanvas)
    })

    onCleanup(() => {
        stopFrameAnimation(animation)
    })

    return canvas
}
