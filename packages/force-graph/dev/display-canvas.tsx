import * as s from '@nothing-but/solid/signal'
import { event, math, trig } from '@nothing-but/utils'
import type { Position } from '@nothing-but/utils/types'
import { createEventListener, createEventListenerMap } from '@solid-primitives/event-listener'
import { createMachine, type MachineStates } from '@solid-primitives/state-machine'
import { createEffect, createMemo, createSignal, onCleanup, type JSX } from 'solid-js'
import { Portal } from 'solid-js/web'
import * as fg from '../src/index.js'

interface CanvasState {
    el: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    graph: fg.Graph
    size: number
    ar: Position
    grid_pos: Position
    /**
     * min
     * 1 - 7
     *     max
     */
    scale: number // TODO user configurable
}

const MIN_SCALE = 1
const MAX_SCALE = 7
const SCALE_RANGE = MAX_SCALE - MIN_SCALE

function makeCanvasState(el: HTMLCanvasElement, graph: fg.Graph): CanvasState | Error {
    const ctx = el.getContext('2d')
    if (!ctx) return new Error('Could not get canvas context')

    const canvas: CanvasState = {
        el,
        graph,
        ctx,
        size: 0,
        ar: { x: 1, y: 1 },
        grid_pos: { x: 0, y: 0 },
        scale: 1,
    }

    updateCanvasSize(canvas, el.width, el.height)

    return canvas
}

const calcNodeRadius = (canvas_size: number): number => canvas_size / 240
const calcEdgeWidth = (canvas_size: number): number => canvas_size / 2000

function updateCanvasSize(canvas: CanvasState, width: number, height: number): void {
    canvas.el.width = width
    canvas.el.height = height

    canvas.size = Math.max(width, height)

    const ar = width / height
    if (ar < 1) {
        canvas.ar = { x: ar, y: 1 }
    } else {
        canvas.ar = { x: 1, y: height / width }
    }
}

function eventToGraphPos(state: CanvasState, e: PointerEvent | WheelEvent): Position {
    const ratio = event.ratioInElement(e, state.el)
    return pointRatioToGraphPos(state, ratio)
}

function pointRatioToGraphPos(canvas: CanvasState, pos: Position): Position {
    const { scale, grid_pos, ar } = canvas,
        grid_size = canvas.graph.grid.size

    let x = pos.x
    let y = pos.y

    /*
        correct for aspect ratio by shifting the shorter side's axis
    */
    x = x * ar.x + (1 - ar.x) / 2
    y = y * ar.y + (1 - ar.y) / 2

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
    x += grid_pos.x
    y += grid_pos.y

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
        value: Events
    }
    [Mode.DraggingNode]: {
        to: Mode.Default | Mode.MoveMultiTouch
        input: BaseInput & {
            node: fg.Node
            pointer_id: number
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

    const ratio = event.ratioInElement(e, canvas.el)
    state.last_ratio = ratio

    const delta = trig.difference(state.init_ratio, ratio)
    trig.multiply(delta, canvas.graph.grid.size / canvas.scale)

    canvas.grid_pos.x = state.init_graph_position.x + delta.x
    canvas.grid_pos.y = state.init_graph_position.y + delta.y

    trigger()
}

const moveDragging: ModeStates[Mode.MoveDragging] = (input, to) => {
    const { canvas, trigger } = input

    const state: MoveDragging = {
        canvas: canvas,
        from: input.from,
        init_ratio: input.init_ratio,
        last_ratio: input.init_ratio,
        init_graph_position: trig.vector(input.canvas.grid_pos),
        pointer_id: input.pointer_id,
    }

    createEventListener(document, 'pointermove', e => {
        handleMoveEvent(state, trigger, e)
    })

    return {
        SPACE(e) {
            e.preventDefault()
        },
        POINTER_UP(e) {
            if (e instanceof PointerEvent && e.pointerId !== input.pointer_id) return

            to(input.from, { canvas, trigger })
        },
        POINTER_DOWN(e) {
            e.preventDefault()
            e.stopPropagation()

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
        state.last_ratio_0 = ratio_0 = event.ratioInElement(e, canvas.el)
    } else {
        state.last_ratio_1 = ratio_1 = event.ratioInElement(e, canvas.el)
    }

    let scale = state.init_scale * (trig.distance(ratio_0, ratio_1) / state.init_dist)
    scale = math.clamp(scale, MIN_SCALE, MAX_SCALE)

    const delta = trig.average(
        trig.difference(state.init_ratio_0, ratio_0),
        trig.difference(state.init_ratio_1, ratio_1),
    )
    trig.multiply(delta, canvas.graph.grid.size / scale)

    canvas.grid_pos.x = state.init_graph_position.x + delta.x
    canvas.grid_pos.y = state.init_graph_position.y + delta.y
    canvas.scale = scale

    trigger()
}

const moveMultiTouch: ModeStates[Mode.MoveMultiTouch] = (input, to) => {
    const { canvas, trigger } = input

    const init_ratio_0 = input.init_ratio_0
    const init_ratio_1 = event.ratioInElement(input.e, canvas.el)

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
        init_graph_position: trig.vector(canvas.grid_pos),
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
    const graph_point_before = eventToGraphPos(canvas, e)

    let { scale } = canvas

    /*
        Use a sine function slow down the zooming as it gets closer to the min and max zoom
        y = sin(x • π) where x is the current zoom % and y is the delta multiplier
        the current zoom need to be converted to a % with a small offset
        because sin(0) = sin(π) = 0 which would completely stop the zooming
    */
    const offset = 1 / (SCALE_RANGE * 2),
        scale_with_offset = math.map_range(scale, MIN_SCALE, MAX_SCALE, offset, 1 - offset),
        zoom_mod = Math.sin(scale_with_offset * Math.PI)
    scale += e.deltaY * -0.005 * zoom_mod
    scale = math.clamp(scale, MIN_SCALE, MAX_SCALE)

    canvas.scale = scale

    const graph_point_after = eventToGraphPos(canvas, e)
    const delta = trig.difference(graph_point_before, graph_point_after)

    canvas.grid_pos.x += delta.x + e.deltaX * (0.1 / scale)
    canvas.grid_pos.y += delta.y

    trigger()
}

const mode_states: ModeStates = {
    [Mode.Default]({ canvas, trigger }, to) {
        return {
            POINTER_DOWN(e) {
                e.preventDefault()
                e.stopPropagation()

                const point_ratio = event.ratioInElement(e, canvas.el),
                    point_graph = pointRatioToGraphPos(canvas, point_ratio)

                let click_max_dist = calcNodeRadius(canvas.size) + 5
                click_max_dist /= canvas.size
                click_max_dist *= canvas.graph.options.grid_size

                const node = fg.findClosestNodeLinear(
                    canvas.graph.nodes,
                    point_graph,
                    click_max_dist,
                )

                if (node) {
                    to(Mode.DraggingNode, {
                        canvas,
                        trigger,
                        node,
                        pointer_id: e.pointerId,
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
                to(Mode.MoveSpace, { canvas, trigger })
            },
        }
    },
    [Mode.DraggingNode](input, to) {
        const { canvas, trigger, node, pointer_id } = input

        node.locked = true
        onCleanup(() => (node.locked = false))

        const goal_node_pos_delta = trig.difference(input.point_graph, node.position)

        let goal_graph_node_pos = input.point_graph
        let goal_point_ratio = input.point_ratio

        /*
            Smoothly move the node to the pointer position
        */
        const interval = setInterval(() => {
            trig.multiply(goal_node_pos_delta, 0.95)
            fg.changeNodePosition(
                canvas.graph.grid,
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

        createEventListener(document, 'pointermove', e => {
            if (e.pointerId !== pointer_id) return

            e.preventDefault()
            e.stopPropagation()

            goal_point_ratio = event.ratioInElement(e, canvas.el)
            goal_graph_node_pos = pointRatioToGraphPos(canvas, goal_point_ratio)
            const graph_node_pos = trig.difference(goal_graph_node_pos, goal_node_pos_delta)

            fg.changeNodePosition(canvas.graph.grid, node, graph_node_pos.x, graph_node_pos.y)
        })

        return {
            POINTER_UP(e) {
                if (e instanceof PointerEvent && e.pointerId !== pointer_id) return

                to(Mode.Default, { canvas, trigger })
            },
            POINTER_DOWN(e) {
                e.preventDefault()
                e.stopPropagation()

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
    [Mode.MoveSpace]({ canvas, trigger }, to) {
        return {
            SPACE(e) {
                e.preventDefault()
            },
            SPACE_UP(e) {
                to(Mode.Default, { canvas, trigger })
            },
            POINTER_DOWN(e) {
                e.preventDefault()
                e.stopPropagation()

                to(Mode.MoveDragging, {
                    from: Mode.MoveSpace,
                    canvas,
                    trigger,
                    init_ratio: event.ratioInElement(e, canvas.el),
                    pointer_id: e.pointerId,
                })
            },
        }
    },
    [Mode.MoveDragging]: moveDragging,
    [Mode.MoveMultiTouch]: moveMultiTouch,
}

const line_dash_dashed = [8, 16] as const
const line_dash_empty = [] as const

function updateCanvas(canvas: CanvasState): void {
    const { ctx, graph, scale, grid_pos } = canvas,
        { nodes, edges, grid } = graph

    const node_radius = calcNodeRadius(canvas.size)
    const edge_width = calcEdgeWidth(canvas.size)

    /*
        clear
    */
    ctx.resetTransform()
    ctx.clearRect(0, 0, canvas.size, canvas.size)

    /*
        origin (top-left corner) gets shifted away from the center
    */
    const correct_origin = (1 - scale) * (canvas.size / 2)
    let translate_x = correct_origin
    let translate_y = correct_origin

    /*
        subtract user position (to move camera in the opposite direction)
    */
    const scaled_canvas_size = canvas.size * scale
    translate_x -= (grid_pos.x / grid.size) * scaled_canvas_size
    translate_y -= (grid_pos.y / grid.size) * scaled_canvas_size

    /*
        correct for aspect ratio by shifting the shorter side's axis
    */
    translate_x += ((canvas.ar.x - 1) / 2) * canvas.size
    translate_y += ((canvas.ar.y - 1) / 2) * canvas.size

    ctx.setTransform(scale, 0, 0, scale, translate_x, translate_y)

    /*
        border
    */
    ctx.strokeStyle = 'yellow'
    ctx.setLineDash(line_dash_dashed)
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, canvas.size, canvas.size)
    ctx.setLineDash(line_dash_empty)

    /*
        edges
    */
    for (const { a, b } of edges) {
        const edges_mod = math.clamp(a.edges.length + b.edges.length, 1, 30) / 30
        const opacity = 0.2 + (edges_mod / 10) * 2

        ctx.strokeStyle =
            a.locked || b.locked
                ? `rgba(129, 140, 248, ${opacity})`
                : `rgba(150, 150, 150, ${opacity})`
        ctx.lineWidth = edge_width
        ctx.beginPath()
        ctx.moveTo(
            (a.position.x / grid.size) * canvas.size,
            (a.position.y / grid.size) * canvas.size,
        )
        ctx.lineTo(
            (b.position.x / grid.size) * canvas.size,
            (b.position.y / grid.size) * canvas.size,
        )
        ctx.stroke()
    }

    /*
        nodes
    */
    for (const node of nodes) {
        const { x, y } = node.position
        const edges_mod = math.clamp(node.edges.length, 1, 30) / 30
        const opacity = 0.6 + (edges_mod / 10) * 4

        ctx.fillStyle = node.locked
            ? `rgba(129, 140, 248, ${opacity})`
            : `rgba(248, 113, 113, ${opacity})`
        ctx.beginPath()
        ctx.ellipse(
            (x / grid.size) * canvas.size,
            (y / grid.size) * canvas.size,
            node_radius,
            node_radius,
            0,
            0,
            Math.PI * 2,
        )
        ctx.fill()
    }
}

export function CanvasForceGraph(props: {
    graph: fg.Graph
    trackNodes: () => void
    targetFPS?: number
}): JSX.Element {
    const { graph, targetFPS = 44, trackNodes } = props

    const init_size = graph.options.grid_size

    const canvas_el = (
        <canvas class="absolute w-full h-full" width={init_size} height={init_size} />
    ) as HTMLCanvasElement

    const canvas = makeCanvasState(canvas_el, graph)
    if (canvas instanceof Error) throw canvas

    const signal = s.signal()
    const trigger = () => s.trigger(signal)

    {
        const ro = new ResizeObserver(() => {
            const pixel_ratio = window.devicePixelRatio
            const rect = canvas_el.getBoundingClientRect()

            updateCanvasSize(canvas, rect.width * pixel_ratio, rect.height * pixel_ratio)

            trigger()
        })
        ro.observe(canvas_el)
        onCleanup(() => ro.disconnect())
    }

    const mode = createMachine({
        states: mode_states,
        initial: {
            type: Mode.Default,
            input: { canvas, trigger },
        },
    })

    createEventListenerMap(canvas_el, {
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

    /*
        DEBUG
    */
    ;<Portal>
        <div class="fixed top-5 left-5">{mode.type}</div>
    </Portal>

    {
        const animation = fg.makeFrameAnimation(graph, () => updateCanvas(canvas), targetFPS)
        updateCanvas(canvas)

        const init = createMemo(() => {
            trackNodes() // track changes to nodes

            const [init, setInit] = createSignal(true)
            const timeout = setTimeout(() => setInit(false), 2000)
            onCleanup(() => clearTimeout(timeout))

            return init
        })

        const active = createMemo(() => mode.type === Mode.DraggingNode || init()())

        createEffect(() => {
            if (active()) {
                fg.startFrameAnimation(animation)
            } else {
                fg.pauseFrameAnimation(animation)
            }
        })

        createEffect(() => {
            if (active()) return

            // track changes to the canvas
            signal.read()

            requestAnimationFrame(() => updateCanvas(canvas))
        })

        onCleanup(() => {
            fg.stopFrameAnimation(animation)
        })
    }

    return canvas_el
}
