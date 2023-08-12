import { math } from '@nothing-but/utils'
import { Position } from '@nothing-but/utils/types'
import { resolveElements } from '@solid-primitives/refs'
import { RootPoolFactory, createRootPool } from '@solid-primitives/rootless'
import { createEffect, createMemo, createSignal, onCleanup, onMount, type JSX } from 'solid-js'
import * as FG from '../src/index.js'

export function SvgForceGraph(props: {
    graph: FG.Graph
    node: RootPoolFactory<FG.Node, JSX.Element>
    active?: boolean
    targetFPS?: number
}): JSX.Element {
    const isActive = 'active' in props ? () => props.active : () => false

    const useNodeEl = createRootPool(props.node)
    const nodeEls = resolveElements(() => props.graph.nodes.map(useNodeEl)).toArray

    const useLine = createRootPool(
        () => (<line class="stroke-cyan-7/25 stroke-0.1%" />) as SVGLineElement,
    )
    const lines = createMemo(() => props.graph.edges.map(useLine))

    const posToP = (xy: number, grid_size: number) => ((xy + grid_size / 2) / grid_size) * 100 + '%'

    function updateElements() {
        const els = nodeEls(),
            line_els = lines(),
            { nodes, edges, options } = props.graph,
            { grid_size } = options

        for (let i = 0; i < edges.length; i++) {
            const { a, b } = edges[i]!
            const line = line_els[i]!

            if (a.moved) {
                line.x1.baseVal.valueAsString = posToP(a.position.x, grid_size)
                line.y1.baseVal.valueAsString = posToP(a.position.y, grid_size)
            }

            if (b.moved) {
                line.x2.baseVal.valueAsString = posToP(b.position.x, grid_size)
                line.y2.baseVal.valueAsString = posToP(b.position.y, grid_size)
            }
        }

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]!

            if (!node.moved) continue

            const { x, y } = node.position
            const el = els[i]! as HTMLElement

            el.style.left = posToP(x, grid_size)
            el.style.top = posToP(y, grid_size)

            node.moved = false
        }
    }

    onMount(() => {
        const animation = FG.makeFrameAnimation(props.graph, updateElements, props.targetFPS ?? 44)

        const init = createMemo(() => {
            props.graph // track graph prop

            const [init, setInit] = createSignal(true)
            const timeout = setTimeout(() => setInit(false), 2000)
            onCleanup(() => clearTimeout(timeout))

            return init
        })

        updateElements()

        createEffect(() => {
            if (isActive() || init()()) {
                FG.startFrameAnimation(animation)
            } else {
                FG.pauseFrameAnimation(animation)
            }
        })

        onCleanup(() => {
            FG.stopFrameAnimation(animation)
        })
    })

    return (
        <>
            <svg class="absolute w-full h-full">{lines()}</svg>
            {nodeEls()}
        </>
    )
}

interface CanvasState {
    ctx: CanvasRenderingContext2D
    size: number
    position: Position
    scale: number
}

function pointToCanvas(state: CanvasState, grid_size: number, xy: number): number {
    const { size, scale, position } = state
    return (xy / grid_size + position.x) * scale * size + size / 2
}

function updateCanvas(state: CanvasState, graph: FG.Graph): void {
    const { ctx, size, scale } = state,
        { nodes, edges, options } = graph,
        { grid_size } = options

    ctx.clearRect(0, 0, size, size)

    for (const edge of edges) {
        const { a, b } = edge
        const edges_mod = math.clamp(a.edges.length + b.edges.length, 1, 30) / 30
        const opacity = 0.2 + (edges_mod / 10) * 2

        ctx.strokeStyle = `rgba(129, 140, 248, ${opacity})`
        ctx.lineWidth = (size / 2000) * scale
        ctx.beginPath()
        ctx.moveTo(
            pointToCanvas(state, grid_size, a.position.x),
            pointToCanvas(state, grid_size, a.position.y),
        )
        ctx.lineTo(
            pointToCanvas(state, grid_size, b.position.x),
            pointToCanvas(state, grid_size, b.position.y),
        )
        ctx.stroke()
    }

    for (const node of nodes) {
        const { x, y } = node.position
        const edges_mod = math.clamp(node.edges.length, 1, 30) / 30
        const opacity = 0.6 + (edges_mod / 10) * 4

        ctx.fillStyle = `rgba(248, 113, 113, ${opacity})`
        ctx.beginPath()
        ctx.ellipse(
            pointToCanvas(state, grid_size, x),
            pointToCanvas(state, grid_size, y),
            (size / 240) * scale,
            (size / 240) * scale,
            0,
            0,
            Math.PI * 2,
        )
        ctx.fill()
    }
}

export function CanvasForceGraph(props: {
    graph: FG.Graph
    trackNodes: () => void
    active: () => boolean
    targetFPS?: number
}): JSX.Element {
    const { graph, targetFPS = 44, active, trackNodes } = props

    const init_size = graph.options.grid_size

    const canvas = (
        <canvas class="absolute w-full h-full" width={init_size} height={init_size} />
    ) as HTMLCanvasElement

    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error('canvas is not supported')
    }

    const canvas_state = {
        ctx,
        size: init_size,
        position: { x: 0, y: 0 },
        scale: 2,
    }

    {
        const ro = new ResizeObserver(() => {
            const { width, height } = canvas.getBoundingClientRect()
            const size = Math.min(width, height)

            canvas.width = size
            canvas.height = size
            canvas_state.size = size
        })
        ro.observe(canvas)
        onCleanup(() => ro.disconnect())
    }

    {
        canvas.addEventListener('pointerdown', e => {
            const x = e.offsetX / canvas_state.size,
                y = e.offsetY / canvas_state.size

            const closest = FG.findClosestNode(graph, { x, y })

            console.log(x, y, closest)
        })
    }

    {
        const animation = FG.makeFrameAnimation(
            graph,
            () => updateCanvas(canvas_state, graph),
            targetFPS,
        )
        updateCanvas(canvas_state, graph)

        const init = createMemo(() => {
            trackNodes() // track changes to nodes

            const [init, setInit] = createSignal(true)
            const timeout = setTimeout(() => setInit(false), 2000)
            onCleanup(() => clearTimeout(timeout))

            return init
        })

        createEffect(() => {
            if (active() || init()()) {
                FG.startFrameAnimation(animation)
            } else {
                FG.pauseFrameAnimation(animation)
            }
        })

        onCleanup(() => {
            FG.stopFrameAnimation(animation)
        })
    }

    return canvas
}
