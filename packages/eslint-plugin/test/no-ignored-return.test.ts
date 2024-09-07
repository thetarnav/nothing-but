import * as rule       from "../src/no-ignored-return.js"
import { rule_tester } from "./setup.js"

rule_tester.run("no-ignored-return", rule.no_ignored_return, {
	valid: [
		{
			name: "captured",
			code: /*javascript*/ `
                declare function func(): boolean

                const res = func()
            `,
		},
		{
			name: "void",
			code: /*javascript*/ `
                declare function func(): void

                func()
            `,
		},
		{
			name: "overload",
			code: /*javascript*/ `
                declare function func(a: string, b: string): void
                declare function func(a: number): void

                func()
            `,
		},
		{
			name: "arrow captured",
			code: /*javascript*/ `
                const func = () => true

                const res = func()
            `,
		},
		{
			name: "arrow void",
			code: /*javascript*/ `
                const func = () => {}

                func()
            `,
		},
		{
			name: "object declaration",
			code: /*javascript*/ `
                declare function func(): boolean

                const obj = {
                    prop: func()
                }
            `,
		},
		{
			name: "property assignment",
			code: /*javascript*/ `
                declare function func(): boolean

                obj.prop = func()
            `,
		},
		{
			name: "if",
			code: /*javascript*/ `
                declare function func(): boolean

                if (func()) {}
            `,
		},
		{
			name: "parameter",
			code: /*javascript*/ `
                declare function func(): boolean

                function foo(a = func()) {}
            `,
		},
		{
			name: "call as parameter",
			code: /*javascript*/ `
                declare function funcA(a: boolean): void
                declare function funcB(): boolean

                funcA(funcB())
            `,
		},
		{
			name: "no function type",
			code: /*javascript*/ `
                func(123)
            `,
		},
		{
			name: "array methods",
			code: /*javascript*/ `
                const arr = []
                arr.push(4);
                arr.pop();
                arr.shift();
                arr.unshift(4);
                [].splice(0, 1);
                [].sort();
                [].reverse();
            `,
		},
		{
			name: "map methods",
			code: /*javascript*/ `
                const map = new Map()
                map.set(1, 2)
                map.delete(1)
            `,
		},
		{
			name: "set methods",
			code: /*javascript*/ `
                const set = new Set()
                set.add(1)
                set.delete(1)
            `,
		},
		{
			name: "nested object",
			code: /*javascript*/ `
                const obj = {
                    prop: {
                        nested(): void {}
                    }
                }

                obj.prop.nested()
            `,
		},
		{
			name: ".call() and .apply()",
			code: /*javascript*/ `
                function foo(a: number): void {}

                foo.call(null, 123)
                foo.apply(null, [123])
            `,
		},
		{
			name: ".call() and .apply() with return value",
			code: /*javascript*/ `
                function foo(a: number): number {}

                void foo.call(null, 123)
                const x = foo.apply(null, [123])
            `,
		},
		{
			name: ".call() and .apply() with arr.length",
			code: /*javascript*/ `
                const array = [1, 2, 3]

                array.push.apply(array, [1, 2])
            `,
		},
		{
			name: "logical expression assignment",
			code: /*javascript*/ `
                function condition(): boolean {}
                const some_bool: boolean = true

                const res = condition() && condition()
                const res = some_bool && condition()
            `,
		},
		{
			name: "logical expression void",
			code: /*javascript*/ `
                function condition(): boolean {}
                const some_bool: boolean = true

                void (condition() && condition())
                void (some_bool && condition())
            `,
		},
		{
			name: "never return type",
			code: /*javascript*/ `
				function func(): never {}
				func()
			`,
		},
	],
	invalid: [
		{
			name: "not captured",
			code: /*javascript*/ `
                declare function func(): boolean
                func()
            `,
			errors: [{messageId: "use_return_value"}],
		},
		{
			name: "returns union",
			code: /*javascript*/ `
                declare function func(): boolean | void
                func()
            `,
			errors: [{messageId: "use_return_value"}],
		},
		{
			name: "overload",
			code: /*javascript*/ `
                declare function func(): void
                declare function func(a: number): boolean
                func()
            `,
			errors: [{messageId: "use_return_value"}],
		},
		{
			name: "arrow",
			code: /*javascript*/ `
                const func = () => true
                func()
            `,
			errors: [{messageId: "use_return_value"}],
		},
		{
			name: "nested object",
			code: /*javascript*/ `
                const obj = {
                    prop: {
                        nested(): boolean {}
                    }
                }

                obj.prop.nested()
            `,
			errors: [{messageId: "use_return_value"}],
		},
		{
			name: ".call() and .apply() with return value",
			code: /*javascript*/ `
                function foo(a: number): number {}

                foo.call(null, 123)
                foo.apply(null, [123])
            `,
			errors: [{messageId: "use_return_value"}, {messageId: "use_return_value"}],
		},
		{
			name: "logical expression action",
			code: /*javascript*/ `
                function condition(): boolean {}
                function action(): void {}

                condition() && action()
            `,
			errors: [{messageId: "use_return_value"}],
		},
		{
			name: "multi logical expression",
			code: /*javascript*/ `
                function condition(): boolean {}

                condition() && condition() && condition()
            `,
			errors: [{messageId: "use_return_value"}],
		},
	],
})
