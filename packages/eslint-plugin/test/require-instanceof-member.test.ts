import {RuleTester} from "@typescript-eslint/rule-tester"
import path from "node:path"

import * as rule from "../src/require-instanceof-member.js"

const ruleTester = new RuleTester({
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: path.resolve(__dirname, "resources", "tsconfig.json"),
		tsconfigRootDir: path.resolve(__dirname, "resources"),
	},
})

// prettier-ignore
ruleTester.run("require-instanceof-member", rule.require_instanceof_member, {
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
	],
	invalid: [
		{	name: "class",
		 	code: /*javascript*/ `
				class A {}
				const b = new A()
				if (b instanceof A) {}
			`,
			errors: [{messageId: "require_instanceof_member"}],
		},
		{	name: "primitive",
			code: /*javascript*/ `
				const b = Math.random() > 0.5 ? 1 : "1"
				if (b instanceof Number) {}
			`,
			errors: [{messageId: "require_instanceof_member"}],
		},
		{	name: "union",
			code: /*javascript*/ `
				class A {}
				class B {}
				const b = Math.random() > 0.5 ? new A() : new B()
				if (b instanceof Number) {}
			`,
			errors: [{messageId: "require_instanceof_member"}],
		},
	],
})
