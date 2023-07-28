import { bench, describe } from 'vitest'
import { array, graph, math, trig } from '../src'

const lengths = Array.from({ length: 10 }, (_, i) => 2 ** (i + 3))

const fns = {
    indexOf: (arr: graph.Node[], item: graph.Node) => arr.indexOf(item),
    indexOfDirected: (arr: graph.Node[], item: graph.Node) => {
        const mid = arr.length >> 1
        const start = item.position.x < arr[mid]!.position.x ? 0 : mid
        return arr.indexOf(item, start)
    },
    binarySearch: (arr: graph.Node[], item: graph.Node) =>
        array.binarySearchWith(arr, item, graph.getNodeX),
    binarySearchInlined: (arr: graph.Node[], item: graph.Node) => {
        const search_for = item.position.x

        let low = 0,
            high = arr.length - 1,
            mid: number,
            guess_item: graph.Node,
            guess_for: number

        while (low <= high) {
            mid = (low + high) >> 1
            guess_item = arr[mid]!
            guess_for = guess_item.position.x

            if (guess_item === item) {
                return mid
            } else if (guess_for === search_for) {
                //
                let i = mid - 1
                for (; i >= 0 && arr[i]!.position.x === guess_for; i--) {
                    if (arr[i] === item) return i
                }

                i = mid + 1
                for (; i < arr.length && arr[i]!.position.x === guess_for; i++) {
                    if (arr[i] === item) return i
                }
            } else if (guess_for > search_for) {
                high = mid - 1
            } else {
                low = mid + 1
            }
        }

        return
    },
}

lengths.forEach(n => {
    const arr = Array.from({ length: n }, (_, i) => new graph.Node(trig.vec(i * 1.00005, 0)))

    describe(`search ordered array of ${n} nodes`, () => {
        for (const [name, fn] of Object.entries(fns)) {
            bench(name, () => {
                for (let i = 0; i < n; i++) {
                    fn(arr, arr[i]!)
                }
            })
        }
    })
})
