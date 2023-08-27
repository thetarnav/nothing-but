import * as Eslint from '@typescript-eslint/utils'
import * as TS from 'typescript'

const createRule = Eslint.ESLintUtils.RuleCreator.withoutDocs

function isVoidReturnType(type: TS.Type) {
    const call_signatures = type.getCallSignatures()
    if (call_signatures.length === 0) return false

    for (const call_signature of call_signatures) {
        const return_type = call_signature.getReturnType()

        if (return_type.isUnion() || return_type.flags !== TS.TypeFlags.Void) return false
    }

    return true
}

export const no_ignored_return = createRule({
    meta: {
        type: 'problem',
        schema: [],
        messages: {
            use_return_value:
                'Return value from function with non-void return type should be used.',
        },
    },
    defaultOptions: [],
    create(context) {
        const parser_services = context.parserServices

        if (!parser_services || !parser_services.program) {
            return {}
        }

        const checker = parser_services.program.getTypeChecker()

        return {
            CallExpression(node) {
                const type = checker.getTypeAtLocation(
                    parser_services.esTreeNodeToTSNodeMap.get(node.callee),
                )

                if (isVoidReturnType(type)) return

                if (node.parent.type !== 'VariableDeclarator') {
                    context.report({
                        node,
                        messageId: 'use_return_value',
                    })
                }
            },
        }
    },
})
