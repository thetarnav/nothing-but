import {RuleTester} from "@typescript-eslint/rule-tester"
import * as path    from "node:path"
import * as t       from "bun:test"

RuleTester.afterAll = t.afterAll
RuleTester.it       = t.it
RuleTester.itOnly   = t.it.only
RuleTester.describe = t.describe

export const rule_tester = new RuleTester({
	languageOptions: {
		parserOptions: {
			project: path.resolve(__dirname, "resources", "tsconfig.json"),
			tsconfigRootDir: path.resolve(__dirname, "resources"),
		},
	}
})
