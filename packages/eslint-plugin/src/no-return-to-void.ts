import {eslint, getType, isVoidReturnType} from './utils'

export const no_return_to_void = eslint.ESLintUtils.RuleCreator.withoutDocs({
    meta: {
        type: 'problem',
        schema: [],
        messages: {
            no_return_to_void:
                'This callback is expected to not return anything, but it returns a value.',
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

            const parent_type = getType(parent.callee, checker, services)

            const call_signatures = parent_type.getCallSignatures()
            if (call_signatures.length === 0) return

            for (const call_signature of call_signatures) {
                const arg = call_signature.getParameters()[arg_index]
                if (!arg) return

                const arg_type = arg.valueDeclaration
                if (!arg_type) return

                const arg_return_type = checker.getTypeAtLocation(arg_type)
                if (!isVoidReturnType(arg_return_type)) return
            }

            const type = getType(node, checker, services)
            if (isVoidReturnType(type)) return

            context.report({node, messageId: 'no_return_to_void'})
        }

        return {
            ArrowFunctionExpression: handleFunction,
            FunctionExpression: handleFunction,
        }
    },
})
