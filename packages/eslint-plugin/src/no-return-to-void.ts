import {eslint, getType, isVoidReturnType, ts} from "./utils"

export const no_return_to_void = eslint.ESLintUtils.RuleCreator.withoutDocs({
	meta: {
		type: "problem",
		schema: [],
		messages: {
			no_return_to_void:
				"This callback is expected to not return anything, but it returns a value.",
		},
	},
	defaultOptions: [],
	create(context) {
		const services = context.parserServices
		if (!services || !services.program) return {}

		const checker = services.program.getTypeChecker()

		const handleFunction: eslint.TSESLint.RuleFunction<
			eslint.TSESTree.ArrowFunctionExpression | eslint.TSESTree.FunctionExpression
		> = node => {
			const {parent} = node
			if (parent.type !== eslint.AST_NODE_TYPES.CallExpression) return

			const arg_index = parent.arguments.indexOf(node)
			if (arg_index === -1) return

			const callee_ts_node = services.esTreeNodeToTSNodeMap.get(parent)
			if (!ts.isCallLikeExpression(callee_ts_node)) return

			/* Care only about the active call signature */
			const call_signature = checker.getResolvedSignature(callee_ts_node)
			if (!call_signature) return

			const arg = call_signature.getParameters()[arg_index]
			if (!arg) return

			const arg_type = arg.valueDeclaration
			if (!arg_type) return

			const arg_return_type = checker.getTypeAtLocation(arg_type)
			if (!isVoidReturnType(arg_return_type)) return

			const type = getType(node, checker, services)
			if (isVoidReturnType(type)) return

			context.report({node, messageId: "no_return_to_void"})
		}

		return {
			ArrowFunctionExpression: handleFunction,
			FunctionExpression: handleFunction,
		}
	},
})
