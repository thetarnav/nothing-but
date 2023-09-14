import * as ESLint from '@typescript-eslint/utils'
import * as TS from 'typescript'

function isVoidReturnType(type: TS.Type): boolean {
    const call_signatures = type.getCallSignatures()
    if (call_signatures.length === 0) return true

    for (const call_signature of call_signatures) {
        const return_type = call_signature.getReturnType()

        if (return_type.isUnion() || return_type.flags !== TS.TypeFlags.Void) return false
    }

    return true
}

function getType(
    node: ESLint.TSESTree.Node,
    checker: TS.TypeChecker,
    services: ESLint.ParserServices,
): TS.Type {
    return checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node))
}

const mutating_methods: Record<string, Set<string>> = {
    Array: new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']),
    Map: new Set(['set', 'delete']),
    Set: new Set(['add', 'delete']),
}

export const no_ignored_return = ESLint.ESLintUtils.RuleCreator.withoutDocs({
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
        const services = context.parserServices

        if (!services || !services.program) {
            return {}
        }

        const checker = services.program.getTypeChecker()

        return {
            CallExpression(node) {
                const {parent, callee} = node

                if (parent.type !== ESLint.AST_NODE_TYPES.ExpressionStatement) return

                const type = getType(callee, checker, services)
                if (isVoidReturnType(type)) return

                /*
                Exclude mutating array methods
                */
                if (
                    callee.type === ESLint.AST_NODE_TYPES.MemberExpression &&
                    callee.property.type === ESLint.AST_NODE_TYPES.Identifier
                ) {
                    const obj_type = getType(callee.object, checker, services)
                    if (
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        !obj_type.symbol ||
                        mutating_methods[obj_type.symbol.name]?.has(callee.property.name)
                    )
                        return
                }

                context.report({node, messageId: 'use_return_value'})
            },
        }
    },
})
