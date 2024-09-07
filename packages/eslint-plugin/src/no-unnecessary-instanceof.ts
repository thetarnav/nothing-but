import {eslint, ts} from "./utils"

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

		if (!services || !services.program) return {}

		const checker = services.program.getTypeChecker()

		return {
			BinaryExpression(node) {
				if (!services.esTreeNodeToTSNodeMap) return

				if (node.operator !== "instanceof") return

				const left_type = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node.left))
				if (left_type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return

				if (!left_type.isUnion()) {
					ctx.report({node: node.left, messageId: "not_a_union"})
					return
				}

				const right_type = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node.right))
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
