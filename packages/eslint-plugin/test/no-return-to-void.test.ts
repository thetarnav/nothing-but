import * as rule from "../src/no-return-to-void.js"
import { rule_tester } from "./setup.js"

rule_tester.run("no-return-to-void", rule.no_return_to_void, {
	valid: [
		{
			name: "arrow: empty callback",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => {})
            `,
		},
		{
			name: "arrow: return nothing",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => {
                    return
                })
            `,
		},
		{
			name: "arrow: return expected value",
			code: /*javascript*/ `
                declare function func(callback: () => number): boolean
                func(() => 123)
            `,
		},
		{
			name: "arrow: return expected value (2)",
			code: /*javascript*/ `
                declare function func(thing: number, callback: () => number): boolean
                func(312, () => 123)
            `,
		},
		{
			name: "arrow: return expected value (3)",
			code: /*javascript*/ `
                declare function func(callback: () => number | void): boolean
                func(() => 123)
            `,
		},
		{
			name: "function: empty callback",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(function() {})
            `,
		},
		{
			name: "function: return nothing",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(function()  {
                    return
                })
            `,
		},
		{
			name: "function: return expected value",
			code: /*javascript*/ `
                declare function func(callback: () => number): boolean
                func(function() {return 123})
            `,
		},
		{
			name: "function: return expected value (2)",
			code: /*javascript*/ `
                declare function func(thing: number, callback: () => number): boolean
                func(312, function() {return 123})
            `,
		},
		{
			name: "function: return expected value (3)",
			code: /*javascript*/ `
                declare function func(callback: () => number | void): boolean
                func(function() {return 123})
            `,
		},
		{
			name: "arrow: overloads",
			code: /*javascript*/ `
                declare function func(callback: () => void, b: 2): boolean
                declare function func(callback: () => number, b: 1): boolean
                func(() => 123, 1)
            `,
		},
		{
			name: "function: overloads",
			code: /*javascript*/ `
                declare function func(callback: () => void, b: 2): boolean
                declare function func(callback: () => number, b: 1): boolean
                func(function() {return 123}, 1)
            `,
		},
		{
			name: "optional callback",
			code: /*javascript*/ `
			declare function func(cb: (() => number) | number): void
			func(() => 123)
			`,
		},
	],
	invalid: [
		{
			name: "arrow: => number",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => 123)
            `,
			errors: [{messageId: "no_return_to_void"}],
		},
		{
			name: "arrow: returns a number",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => {
                    return 123
                })
            `,
			errors: [{messageId: "no_return_to_void"}],
		},
		{
			name: "arrow: => math.random()",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => Math.random())
            `,
			errors: [{messageId: "no_return_to_void"}],
		},
		{
			name: "arrow: returns a number or void",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => {
                    if (Math.random() > 0.5) return
                    return 123
                })
            `,
			errors: [{messageId: "no_return_to_void"}],
		},
		{
			name: "function: returns a number",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(function() {return 123})
            `,
			errors: [{messageId: "no_return_to_void"}],
		},
		{
			name: "function: => math.random()",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(function() {return Math.random()})
            `,
			errors: [{messageId: "no_return_to_void"}],
		},
		{
			name: "function: returns a number or void",
			code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(function() {
                    if (Math.random() > 0.5) return
                    return 123
                })
            `,
			errors: [{messageId: "no_return_to_void"}],
		},
		{
			name: "arrow: overloads",
			code: /*javascript*/ `
                declare function func(callback: () => void, b: 2): boolean
                declare function func(callback: () => number, b: 1): boolean
                func(() => 123, 2)
            `,
			errors: [{messageId: "no_return_to_void"}],
		},
		{
			name: "function: overloads",
			code: /*javascript*/ `
                declare function func(callback: () => void, b: 2): boolean
                declare function func(callback: () => number, b: 1): boolean
                func(function() {return 123}, 2)
            `,
			errors: [{messageId: "no_return_to_void"}],
		},
	],
})
