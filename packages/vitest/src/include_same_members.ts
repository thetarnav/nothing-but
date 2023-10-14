import * as v from 'vitest'

v.expect.extend({
    toIncludeSameMembers(received, expected) {
        if (!Array.isArray(received) || !Array.isArray(expected)) {
            return {
                pass: false,
                message: () => `Expected ${received} and ${expected} to be arrays`,
            }
        }

        if (received.length < expected.length) {
            const missing = expected.filter(a => !received.some(b => this.equals(a, b)))

            return {
                pass: false,
                message: () =>
                    `${received}\nis shorter than\n${expected}.\nReceived: ${
                        received.length
                    }\nExpected: ${expected.length}\nMissing: ${missing.length && missing}`,
            }
        }

        if (received.length > expected.length) {
            const extra = received.filter(a => !expected.some(b => this.equals(b, a)))

            return {
                pass: false,
                message: () =>
                    `${received}\nis longer than\n${expected}.\nReceived: ${
                        received.length
                    }\nExpected: ${expected.length}\nExtra: ${extra.length && extra}`,
            }
        }

        for (const secondValue of expected) {
            const index = received.findIndex(firstValue => this.equals(secondValue, firstValue))

            if (index === -1) {
                return {
                    pass: false,
                    message: () => `${received} does not include member ${secondValue}`,
                }
            }
        }

        return {
            pass: true,
            message: () => `${received} includes same members as ${expected}`,
        }
    },
})

interface CustomMatchers<R = unknown> {
    toIncludeSameMembers(arr: unknown[]): R
}

declare module 'vitest' {
    interface Assertion<T = any> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
}
