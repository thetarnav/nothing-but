import * as vi from 'vitest'
import * as rx from '../src'

vi.describe('.', () => {
    vi.test('observable', () => {
        const obs = new rx.Observable<number>()

        const captured: number[] = []

        rx.subscribe(obs, v => {
            captured.push(v)
        })
        vi.expect(captured).toEqual([])

        rx.publish(obs, 1)
        vi.expect(captured).toEqual([1])

        rx.publish(obs, 2)
        vi.expect(captured).toEqual([1, 2])
    })

    vi.test('observable signal', () => {
        const obs = rx.signal(0)

        const captured: number[] = []

        rx.subscribe(obs, sig => {
            captured.push(sig.value)
        })
        vi.expect(captured).toEqual([])

        rx.set(obs, 1)
        vi.expect(captured).toEqual([1])

        rx.set(obs, 2)
        vi.expect(captured).toEqual([1, 2])

        obs.value = 3
        vi.expect(captured).toEqual([1, 2])

        rx.publish(obs, obs)
        vi.expect(captured).toEqual([1, 2, 3])
    })

    vi.test('effects', async () => {
        const count = rx.signal(1)

        const runs: [number, number, number] = [0, 0, 0]
        const captured: [any, any, any] = [null, null, null]

        const scheduler = new rx.Scheduler()

        const root = rx.effect(
            rx.signal(),
            v => {
                captured[0] = v
                runs[0] += 1

                rx.effect(count, n => {
                    captured[1] = n
                    runs[1] += 1
                })

                const eff = rx.effect(count, n => {
                    captured[2] = n
                    runs[2] += 1
                })
                rx.schedule(eff)
            },
            scheduler,
        )
        vi.expect(runs).toEqual([0, 0, 0])

        rx.schedule(root)
        vi.expect(runs).toEqual([0, 0, 0])

        rx.flush(scheduler)
        vi.expect(captured).toEqual([undefined, null, 1])
        vi.expect(runs).toEqual([1, 0, 1])

        rx.set(count, 1)
        vi.expect(runs).toEqual([1, 0, 1])

        rx.set(count, 2)
        vi.expect(runs).toEqual([1, 0, 1])

        rx.flush(scheduler)
        vi.expect(captured).toEqual([undefined, 2, 2])
        vi.expect(runs).toEqual([1, 1, 2])

        rx.set(count, 3)
        vi.expect(runs).toEqual([1, 1, 2])

        await new Promise<void>(resolve => {
            queueMicrotask(() => {
                vi.expect(captured).toEqual([undefined, 3, 3])
                vi.expect(runs).toEqual([1, 2, 3])
                resolve()
            })
        })
    })

    // vi.test('derived', () => {
    //     const count = rx.signal(1)
    //     const doubled = rx.derived(count, n => n * 2)

    //     vi.expect(doubled.value).toBe(2)
    //     rx.set(count, 2)
    //     vi.expect(doubled.value).toBe(4)
    // })
})
