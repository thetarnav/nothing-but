import * as t     from "bun:test"
import * as array from "../src/array.js"

void t.describe("top_n_with", () => {
	t.test("x => x", () => {
		let input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
		let r = array.top_n_with(input, 3, x => x)
		t.expect(r).toEqual([9, 8, 7])
	})

	t.test("x => -x", () => {
		let input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
		let r = array.top_n_with(input, 3, x => -x)
		t.expect(r).toEqual([1, 2, 3])
	})

	t.test("x => x % 3", () => {
		let input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
		let r = array.top_n_with(input, 3, x => x % 3)
		t.expect(r).toEqual([2, 5, 8])
	})

	t.test("smaller input", () => {
		let input = [1, 2]
		let r = array.top_n_with(input, 3, x => x)
		t.expect(r).toEqual([2, 1])
	})

	t.test("empty input", () => {
		let input: number[] = []
		let r = array.top_n_with(input, 3, x => x)
		t.expect(r).toEqual([])
	})

	t.test("1 n x => x", () => {
		let input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
		let r = array.top_n_with(input, 1, x => x)
		t.expect(r).toEqual([9])
	})

	t.test("1 n x => -x", () => {
		let input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
		let r = array.top_n_with(input, 1, x => -x)
		t.expect(r).toEqual([1])
	})

	t.test("0 n", () => {
		let input = [1, 2, 3, 4, 5, 6, 7, 8, 9]
		let r = array.top_n_with(input, 0, x => x)
		t.expect(r).toEqual([])
	})
})
