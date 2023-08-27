import {RuleTester} from '@typescript-eslint/rule-tester'
import path from 'node:path'
import * as rule from '../src/use-return-value.js'

const ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: path.resolve(__dirname, 'resources', 'tsconfig.json'),
        tsconfigRootDir: path.resolve(__dirname, 'resources'),
    },
})

ruleTester.run('use-return-values', rule.use_return_value, {
    valid: [
        {
            name: 'captured',
            code: `
                declare function func(): boolean

                const res = func()
            `,
        },
        {
            name: 'void',
            code: `
                declare function func(): void

                func()
            `,
        },
        {
            name: 'overload',
            code: `
                declare function func(a: string, b: string): void
                declare function func(a: number): void

                func()
            `,
        },
        {
            name: 'arrow captured',
            code: `
                const func = () => true

                const res = func()
            `,
        },
        {
            name: 'arrow void',
            code: `
                const func = () => {}

                func()
            `,
        },
    ],
    invalid: [
        {
            name: 'not captured',
            code: `
                declare function func(): boolean

                func()
            `,
            errors: [{messageId: rule.use_return_value_message_id}],
        },
        {
            name: 'returns union',
            code: `
                declare function func(): boolean | void

                func()
            `,
            errors: [{messageId: rule.use_return_value_message_id}],
        },
        {
            name: 'overload',
            code: `
                declare function func(): void
                declare function func(a: number): boolean

                func()
            `,
            errors: [{messageId: rule.use_return_value_message_id}],
        },
        {
            name: 'arrow',
            code: `
                const func = () => true

                func()
            `,
            errors: [{messageId: rule.use_return_value_message_id}],
        },
    ],
})
