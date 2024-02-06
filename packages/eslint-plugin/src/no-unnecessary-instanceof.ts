import {eslint, getType, ts} from "./utils"

export const no_unnecessary_instanceof = eslint.ESLintUtils.RuleCreator.withoutDocs({
	meta: {
		type: "problem",
		schema: [],
		messages: {
			not_a_union: "Left side of `instanceof` should be a union type.",
			not_a_class: "Right side of `instanceof` should be a class.",
			no_unnecessary_instanceof:
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
				if (left_type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return

				if (!left_type.isUnion()) {
					ctx.report({node: node.left, messageId: "not_a_union"})
					return
				}

				const right_type = getType(node.right, checker, services)
				if (left_type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return

				const constructs = right_type.getConstructSignatures()
				if (constructs.length === 0) {
					ctx.report({node: node.right, messageId: "not_a_class"})
					return
				}

				for (const c of constructs) {
					const ct = c.getReturnType()

					for (const ut of left_type.types) {
						if (
							ut.symbol === ct.symbol &&
							// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
							ut.symbol !== undefined
						) {
							return
						}
					}
				}

				ctx.report({node, messageId: "no_unnecessary_instanceof"})
			},
		}
	},
})
