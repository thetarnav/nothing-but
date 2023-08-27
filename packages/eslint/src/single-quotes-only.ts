import {ESLintUtils} from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator.withoutDocs

export const single_quotes_only_message_id = 'single_quotes_only'

export const single_quotes_only = createRule({
    meta: {
        type: 'problem',
        schema: [],
        messages: {
            [single_quotes_only_message_id]: 'AAAAAA',
        },
    },
    defaultOptions: [],
    create(context) {
        return {
            Literal(node) {
                if (typeof node.value === 'string' && node.raw[0] === '"') {
                    context.report({node, messageId: single_quotes_only_message_id})
                }
            },
        }
    },
})
