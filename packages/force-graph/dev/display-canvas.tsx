import * as s from '@nothing-but/solid/signal'
import { ease, event, math, trig } from '@nothing-but/utils'
import type { Position } from '@nothing-but/utils/types'
import { createEventListener, createEventListenerMap } from '@solid-primitives/event-listener'
import { createMachine, type MachineStates } from '@solid-primitives/state-machine'
import { batch, createEffect, createMemo, createSignal, onCleanup, type JSX } from 'solid-js'
import { Portal } from 'solid-js/web'
import * as fg from '../src/index.js'

interface CanvasState {
    el: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    graph: fg.Graph
    size: s.Signal<number>
    position: s.Signal<Position>
    zoom: s.Signal<{
        /**
         * min
         * 0 - 1
         *     max
         */
        ratio: number
        /**
         * min
         * 1 - 6
         *     max
         */
        scale: number // TODO user configurable
    }>
}

const calcZoomScale = (zoom: number): number => 1 + ease.in_out_cubic(zoom) * 5
const calcNodeRadius = (canvas_size: number): number => canvas_size / 240
const calcEdgeWidth = (canvas_size: number): number => canvas_size / 2000

function makeCanvasState(canvas: HTMLCanvasElement, graph: fg.Graph): CanvasState | Error {
    const ctx = canvas.getContext('2d')
    if (!ctx) return new Error('Could not get canvas context')

    const init_size = Math.min(canvas.width, canvas.height)

    return {
        el: canvas,
        graph,
        ctx,
        size: s.signal(init_size),
        position: s.signal({ x: 0, y: 0 }),
        zoom: s.signal({
            ratio: 0,
            scale: calcZoomScale(0),
        }),
    }
}

function eventToGraphPos(state: CanvasState, e: PointerEvent | WheelEvent): Position {
    const ratio = event.ratioInElement(e, state.el)
    return pointRatioToGraphPos(state, ratio)
}

function pointRatioToGraphPos(state: CanvasState, pos: Position): trig.Vector {
    const { scale } = state.zoom.read(),
        grid_size = state.graph.grid.size,
        scaled_size = grid_size / scale,
        grid_pos = state.position.read()

    const graph_click_pos = trig.vec_map(
        pos,
        n => n * scaled_size + grid_size / 2 - scaled_size / 2,
    )

    graph_click_pos.x += grid_pos.x
    graph_click_pos.y += grid_pos.y

    return graph_click_pos
}

interface BaseInput {
    canvas: CanvasState
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
        to: Mode.Default
        input: BaseInput & {
            node: fg.Node
            pointer_id: number
            init_graph_point: Position
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
            pointer_id_1: number
            init_ratio_0: Position
            init_ratio_1: Position
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

function handleMoveEvent(state: MoveDragging, e: PointerEvent): void {
    if (e.pointerId !== state.pointer_id) return

    e.preventDefault()
    e.stopPropagation()

    const { canvas } = state

    const ratio = event.ratioInElement(e, canvas.el)
    state.last_ratio = ratio

    const delta = trig.vec_difference(state.init_ratio, ratio)
    trig.vec_mut(delta, n => n * (canvas.graph.grid.size / canvas.zoom.read().scale))

    s.mutate(canvas.position, pos => {
        pos.x = state.init_graph_position.x + delta.x
        pos.y = state.init_graph_position.y + delta.y
    })
}

const moveDragging: ModeStates[Mode.MoveDragging] = (input, to) => {
    const { canvas } = input

    const state: MoveDragging = {
        canvas: canvas,
        from: input.from,
        init_ratio: input.init_ratio,
        last_ratio: input.init_ratio,
        init_graph_position: trig.vector(input.canvas.position.read()),
        pointer_id: input.pointer_id,
    }

    createEventListener(document, 'pointermove', e => {
        handleMoveEvent(state, e)
    })

    return {
        POINTER_UP(e) {
            if (e instanceof PointerEvent && e.pointerId !== input.pointer_id) return

            to(input.from, { canvas })
        },
        POINTER_DOWN(e) {
            e.preventDefault()
            e.stopPropagation()

            to(Mode.MoveMultiTouch, {
                canvas,
                from: input.from,
                pointer_id_0: input.pointer_id,
                pointer_id_1: e.pointerId,
                init_ratio_0: state.last_ratio,
                init_ratio_1: event.ratioInElement(e, canvas.el),
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
    init_zoom: number
    init_dist: number
    init_graph_position: Position
}

const handleMultiTouchEvent = (state: MultiTouch, e: PointerEvent): void => {
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

    const delta_0 = trig.vec_difference(state.init_ratio_0, ratio_0)
    const delta_1 = trig.vec_difference(state.init_ratio_1, ratio_1)

    const zoom = canvas.zoom.read()
    let prev = zoom.ratio
    zoom.ratio = (state.init_zoom + 1) * (trig.distance(ratio_0, ratio_1) / state.init_dist) - 1
    zoom.scale = calcZoomScale(zoom.ratio)

    const delta = trig.vec_average(delta_0, delta_1)
    trig.vec_mut(delta, n => n * (canvas.graph.grid.size / canvas.zoom.read().scale))

    const pos = canvas.position.read()
    pos.x = state.init_graph_position.x + delta.x
    pos.y = state.init_graph_position.y + delta.y

    batch(() => {
        s.trigger(canvas.position)
        s.trigger(canvas.zoom)
    })
}

const moveMultiTouch: ModeStates[Mode.MoveMultiTouch] = (input, to) => {
    const { canvas } = input

    const state: MultiTouch = {
        canvas,
        pointer_id_0: input.pointer_id_0,
        pointer_id_1: input.pointer_id_1,
        init_ratio_0: input.init_ratio_0,
        init_ratio_1: input.init_ratio_1,
        last_ratio_0: input.init_ratio_0,
        last_ratio_1: input.init_ratio_1,
        init_zoom: canvas.zoom.read().ratio,
        init_dist: trig.distance(input.init_ratio_0, input.init_ratio_1),
        init_graph_position: trig.vector(input.canvas.position.read()),
    }

    createEventListener(document, 'pointermove', e => {
        handleMultiTouchEvent(state, e)
    })

    return {
        POINTER_UP(e) {
            if (e == null) {
                to(Mode.Default, input)
                return
            }

            let pointer_id: number
            let ratio: Position

            if (e.pointerId === input.pointer_id_0) {
                pointer_id = input.pointer_id_1
                ratio = state.last_ratio_1
            } else if (e.pointerId === input.pointer_id_1) {
                pointer_id = input.pointer_id_0
                ratio = state.last_ratio_0
            } else {
                return
            }

            to(Mode.MoveDragging, {
                from: input.from,
                canvas,
                init_ratio: ratio,
                pointer_id,
            })
        },
    }
}

function handleWheelEvent(state: CanvasState, e: WheelEvent): void {
    e.preventDefault()

    const graph_point_before = eventToGraphPos(state, e)

    const zoom = state.zoom.read()
    zoom.ratio = math.clamp(zoom.ratio + e.deltaY * -0.0005, 0, 1)
    zoom.scale = calcZoomScale(zoom.ratio)

    /*
        keep the same graph point under the cursor
    */
    const graph_point_after = eventToGraphPos(state, e)
    const delta = trig.vec_difference(graph_point_before, graph_point_after)

    const pos = state.position.read()
    pos.x += delta.x + e.deltaX * (0.1 / zoom.scale)
    pos.y += delta.y

    batch(() => {
        s.trigger(state.zoom)
        s.trigger(state.position)
    })
}

const mode_states: ModeStates = {
    [Mode.Default]({ canvas: state }, to) {
        return {
            POINTER_DOWN(e) {
                e.preventDefault()
                e.stopPropagation()

                const canvas_size = state.size.read()
                const pointer_id = e.pointerId
                const point_graph = eventToGraphPos(state, e)

                const click_max_dist =
                    ((calcNodeRadius(canvas_size) + 5) / canvas_size) *
                    state.graph.options.grid_size

                const node = fg.findClosestNodeLinear(
                    state.graph.nodes,
                    point_graph,
                    click_max_dist,
                )

                if (node) {
                    to(Mode.DraggingNode, {
                        canvas: state,
                        node,
                        pointer_id,
                        init_graph_point: point_graph,
                    })
                } else {
                    to(Mode.MoveDragging, {
                        from: Mode.Default,
                        canvas: state,
                        init_ratio: event.ratioInElement(e, state.el),
                        pointer_id: e.pointerId,
                    })
                }
            },
            SPACE(e) {
                e.preventDefault()
                to(Mode.MoveSpace, { canvas: state })
            },
        }
    },
    [Mode.DraggingNode]({ canvas: canvas, node, pointer_id, init_graph_point }, to) {
        node.locked = true
        onCleanup(() => (node.locked = false))

        /*
            Smoothly move the node to the pointer position
        */
        const init_pos_delta = trig.vec_difference(init_graph_point, node.position)
        let last_graph_pos = init_graph_point
        const interval = setInterval(() => {
            trig.vec_mut(init_pos_delta, v => v * 0.95)
            fg.changeNodePosition(
                canvas.graph.grid,
                node,
                last_graph_pos.x - init_pos_delta.x,
                last_graph_pos.y - init_pos_delta.y,
            )

            const d = trig.distance(trig.ZERO, init_pos_delta)
            if (d < 0.1) {
                clearInterval(interval)
                init_pos_delta.x = 0
                init_pos_delta.y = 0
            }
        })
        onCleanup(() => clearInterval(interval))

        createEventListener(document, 'pointermove', e => {
            if (e.pointerId !== pointer_id) return

            e.preventDefault()
            e.stopPropagation()

            const goal_graph_e_pos = eventToGraphPos(canvas, e)
            last_graph_pos = goal_graph_e_pos
            const graph_e_pos = trig.vec_difference(goal_graph_e_pos, init_pos_delta)

            fg.changeNodePosition(canvas.graph.grid, node, graph_e_pos.x, graph_e_pos.y)
        })

        return {
            POINTER_UP(e) {
                if (e instanceof PointerEvent && e.pointerId !== pointer_id) return

                to(Mode.Default, { canvas })
            },
        }
    },
    [Mode.MoveSpace]({ canvas }, to) {
        return {
            SPACE(e) {
                e.preventDefault()
            },
            SPACE_UP(e) {
                to(Mode.Default, { canvas })
            },
            POINTER_DOWN(e) {
                e.preventDefault()
                e.stopPropagation()

                to(Mode.MoveDragging, {
                    from: Mode.MoveSpace,
                    canvas: canvas,
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

function updateCanvas(state: CanvasState): void {
    const { ctx, graph } = state,
        { scale } = state.zoom.read(),
        { nodes, edges } = graph,
        canvas_size = state.size.read(),
        grid_size = graph.grid.size,
        grid_pos = state.position.read()

    const node_radius = calcNodeRadius(canvas_size)
    const edge_width = calcEdgeWidth(canvas_size)

    /*
        clear
    */
    ctx.resetTransform()
    ctx.clearRect(0, 0, canvas_size, canvas_size)

    /*
        transform - scale and translate
    */
    const correct_origin = -(scale - 1) * (canvas_size / 2)
    ctx.setTransform(
        scale,
        0,
        0,
        scale,
        correct_origin - (grid_pos.x / grid_size) * canvas_size * scale,
        correct_origin - (grid_pos.y / grid_size) * canvas_size * scale,
    )

    /*
        border
    */
    ctx.strokeStyle = 'yellow'
    ctx.setLineDash(line_dash_dashed)
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, canvas_size, canvas_size)
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
            (a.position.x / grid_size) * canvas_size,
            (a.position.y / grid_size) * canvas_size,
        )
        ctx.lineTo(
            (b.position.x / grid_size) * canvas_size,
            (b.position.y / grid_size) * canvas_size,
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
            (x / grid_size) * canvas_size,
            (y / grid_size) * canvas_size,
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

    {
        const ro = new ResizeObserver(() => {
            const { width, height } = canvas_el.getBoundingClientRect()
            const size = Math.min(width, height) * window.devicePixelRatio

            canvas_el.width = size
            canvas_el.height = size

            s.set(canvas.size, size)
        })
        ro.observe(canvas_el)
        onCleanup(() => ro.disconnect())
    }

    const mode = createMachine({
        states: mode_states,
        initial: {
            type: Mode.Default,
            input: { canvas },
        },
    })

    createEventListenerMap(canvas_el, {
        pointerdown(e) {
            mode.value.POINTER_DOWN?.(e)
        },
        wheel(e) {
            handleWheelEvent(canvas, e)
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
                case ' ': {
                    mode.value.SPACE?.(e)
                    break
                }
            }
        },
        keyup(e) {
            if (event.shouldIgnoreKeydown(e)) return

            if (e.key === ' ') {
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
            canvas.size.read()
            canvas.zoom.read()
            canvas.position.read()

            requestAnimationFrame(() => updateCanvas(canvas))
        })

        onCleanup(() => {
            fg.stopFrameAnimation(animation)
        })
    }

    return canvas_el
}
