import {RuleTester} from '@typescript-eslint/rule-tester'
import * as rule from '../src/single-quotes-only.js'

const ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2021,
    },
})

ruleTester.run('single-quotes-only', rule.single_quotes_only, {
    valid: [
        {code: "const single = 'test';"},
        {code: 'const single = `test`;'},
        {code: 'const noString = 42;'},
    ],
    invalid: [
        {
            code: 'const double = "test";',
            errors: [{messageId: rule.single_quotes_only_message_id}],
        },
        {
            code: 'const mixed = "test" + `string`;',
            errors: [{messageId: rule.single_quotes_only_message_id}],
        },
    ],
})
