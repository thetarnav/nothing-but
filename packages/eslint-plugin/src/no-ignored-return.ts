import {eslint, getType, isVoidReturnType} from './utils'

const MUTATING_METHODS: Record<string, Set<string>> = {
    Array: new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']),
    Map: new Set(['set', 'delete']),
    Set: new Set(['add', 'delete']),
}

export const no_ignored_return = eslint.ESLintUtils.RuleCreator.withoutDocs({
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
        if (!services || !services.program) return {}

        const checker = services.program.getTypeChecker()

        return {
            CallExpression(node) {
                let callee: eslint.TSESTree.Expression = node.callee
                const parent = node.parent

                /*
                For <object>.call() and <object>.apply() use the <object> type instead
                as the return type for callee will be `any` for some reason
                */
                if (
                    callee.type === eslint.AST_NODE_TYPES.MemberExpression &&
                    callee.property.type === eslint.AST_NODE_TYPES.Identifier &&
                    (callee.property.name === 'apply' || callee.property.name === 'call')
                ) {
                    callee = callee.object
                }

                /* focus only on expresion statements */
                if (
                    parent.type !== eslint.AST_NODE_TYPES.ExpressionStatement &&
                    /* `a() && b()` case */
                    (parent.type !== eslint.AST_NODE_TYPES.LogicalExpression ||
                        parent.parent.type !== eslint.AST_NODE_TYPES.ExpressionStatement)
                ) {
                    return
                }

                const type = getType(callee, checker, services)
                if (isVoidReturnType(type)) return

                /*
                Exclude mutating array methods
                */
                if (
                    callee.type === eslint.AST_NODE_TYPES.MemberExpression &&
                    callee.property.type === eslint.AST_NODE_TYPES.Identifier
                ) {
                    const obj_type = getType(callee.object, checker, services)
                    if (
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        !obj_type.symbol ||
                        MUTATING_METHODS[obj_type.symbol.name]?.has(callee.property.name)
                    )
                        return
                }

                context.report({node, messageId: 'use_return_value'})
            },
        }
    },
})
