import type { Component } from 'solid-js'
import { graph, trig } from './lib'

export const App: Component = () => {
    const nodes: graph.GraphNode[] = [
        new graph.GraphNode(new trig.Vector(0, 0)),
        new graph.GraphNode(new trig.Vector(5, 0)),
        new graph.GraphNode(new trig.Vector(35, -10)),
    ]

    return (
        <div class="w-80vw h-80vw m-10vw bg-dark-9 relative">
            {nodes.map((node, i) => (
                <div
                    class="absolute w-4 h-4 rounded-full bg-red -mt-2 -ml-2"
                    style={{
                        left: `${node.position.x + 50}%`,
                        top: `${50 - node.position.y}%`,
                    }}
                ></div>
            ))}
        </div>
    )
}
