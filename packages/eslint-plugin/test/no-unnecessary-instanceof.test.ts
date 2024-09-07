import * as rule from "../src/no-unnecessary-instanceof.js"
import { rule_tester } from "./setup.js"

rule_tester.run("no-unnecessary-instanceof", rule.no_unnecessary_instanceof, {
	valid: [
		{	name: "union",
			code: /*javascript*/ `
				class A {}
				class B {}
				const b = Math.random() > 0.5 ? new A() : new B()
				if (b instanceof A) {}
			`},
		{ 	name: "unknown",
			code: /*javascript*/ `
				const a = ({}) as unknown
				if (a instanceof Error) {}
			`},
		{ 	name: "any",
			code: /*javascript*/ `
				const a = ({}) as any
				if (a instanceof Error) {}
			`},
		{ 	name: "error",
			code: /*javascript*/ `
				const a = 123 as Error | number
				if (a instanceof Error) {}
			`},
	],
	invalid: [
		{	name: "class",
		 	code: /*javascript*/ `
				class A {}
				const b = new A()
				if (b instanceof A) {}
			`,
			errors: [{messageId: "not_a_union"}],
		},
		{	name: "primitive",
			code: /*javascript*/ `
				const b = Math.random() > 0.5 ? 1 : "1"
				if (b instanceof Number) {}
			`,
			errors: [{messageId: "no_unnecessary_instanceof"}],
		},
		{	name: "not a class",
			code: /*javascript*/ `
				const b = Math.random() > 0.5 ? 1 : "1"
				if (b instanceof number) {}
			`,
			errors: [{messageId: "not_a_class"}],
		},
		{	name: "union",
			code: /*javascript*/ `
				class A {}
				class B {}
				const b = Math.random() > 0.5 ? new A() : new B()
				if (b instanceof Number) {}
			`,
			errors: [{messageId: "no_unnecessary_instanceof"}],
		},
	],
})
