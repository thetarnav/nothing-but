import {eslint, getType} from "./utils"

export const require_instanceof_member = eslint.ESLintUtils.RuleCreator.withoutDocs({
	meta: {
		type: "problem",
		schema: [],
		messages: {
			require_instanceof_member:
				"Values tested with `instanceof` should have a union type including the tested class as a member.",
		},
	},
	defaultOptions: [],
	create(ctx) {
		const services = ctx.sourceCode.parserServices
		if (!services.program) return {}

		const checker = services.program.getTypeChecker()

		return {
			BinaryExpression(node) {
				if (node.operator !== "instanceof") return

				const left_type = getType(node.left, checker, services)
				const right_type = getType(node.right, checker, services)

				if (
					left_type.isUnion() &&
					left_type.types.some(type => type.symbol === right_type.symbol)
				) {
					return
				}

				ctx.report({node, messageId: "require_instanceof_member"})
			},
		}
	},
})
