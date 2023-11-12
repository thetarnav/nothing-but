import * as utl from '@nothing-but/utils'
import * as solid from 'solid-js'

const Shell: solid.FlowComponent = props => {
    return (
        <div class="min-h-110vh min-w-110vw">
            <div class="w-screen h-screen center-child flex-col">
                <div
                    ref={utl.event.preventMobileScrolling}
                    class="relative aspect-3/4 sm:aspect-4/3 w-90vmin m-auto relative overflow-hidden overscroll-none touch-none b b-solid b-red rounded-md"
                >
                    {props.children}
                </div>
            </div>
        </div>
    )
}

export const App: solid.Component = () => {
    const el = (<canvas class="absolute w-full h-full" />) as HTMLCanvasElement

    const gl = el.getContext('webgl2')
    if (!gl) throw new Error('webgl2 is not supported')

    const ro = new ResizeObserver(() => {
        utl.canvas.resizeCanvasToDisplaySize(el)
    })
    ro.observe(el)
    void solid.onCleanup(() => ro.disconnect())

    const loop = utl.raf.makeAnimationLoop(time => {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
    })
    utl.raf.loopStart(loop)

    return <Shell>{el}</Shell>
}
