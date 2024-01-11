import * as v from "vitest"

v.expect.extend({
	// @ts-ignore
	toBeInRange(received: unknown, min: unknown, max: unknown, inclusive: unknown) {
		inclusive = inclusive ?? false

		if (typeof received !== "number") {
			return {
				pass: false,
				message: () => `Expected ${received} (received) to be a number`,
			}
		}
		if (typeof min !== "number") {
			return {
				pass: false,
				message: () => `Expected ${min} (min) to be a number.`,
			}
		}
		if (typeof max !== "number") {
			return {
				pass: false,
				message: () => `Expected ${max} (max) to be a number.`,
			}
		}
		if (typeof inclusive !== "boolean") {
			return {
				pass: false,
				message: () => `Expected ${inclusive} (inclusive) to be a boolean.`,
			}
		}

		if (inclusive) {
			return {
				pass: received >= min && received <= max,
				message: () => `Expected ${received} to be between ${min} and ${max} inclusive.`,
			}
		}

		return {
			pass: received > min && received < max,
			message: () => `Expected ${received} to be between ${min} and ${max}.`,
		}
	},
})

interface CustomMatchers<R = unknown> {
	toBeInRange(min: number, max: number, inclusive?: boolean): R
}

declare module "vitest" {
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}

// keeps "vitest" import
export type Assertion = v.Assertion
