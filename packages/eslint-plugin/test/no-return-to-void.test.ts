import {RuleTester} from '@typescript-eslint/rule-tester'
import path from 'node:path'
import * as rule from '../src/no-return-to-void.js'

const ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: path.resolve(__dirname, 'resources', 'tsconfig.json'),
        tsconfigRootDir: path.resolve(__dirname, 'resources'),
    },
})

ruleTester.run('no-return-to-void', rule.no_return_to_void, {
    valid: [
        {
            name: 'empty callback',
            code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => {})
            `,
        },
        {
            name: 'return nothing',
            code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => {
                    return
                })
            `,
        },
        {
            name: 'return expected value',
            code: /*javascript*/ `
                declare function func(callback: () => number): boolean
                func(() => 123)
            `,
        },
        {
            name: 'return expected value (2)',
            code: /*javascript*/ `
                declare function func(thing: number, callback: () => number): boolean
                func(312, () => 123)
            `,
        },
        {
            name: 'return expected value (3)',
            code: /*javascript*/ `
                declare function func(callback: () => number | void): boolean
                func(() => 123)
            `,
        },
        {
            name: 'deopt on overloads', // TODO: support overloads
            code: /*javascript*/ `
                declare function func(callback: () => void, b: 2): boolean
                declare function func(callback: () => number, b: 1): boolean
                func(() => 123, 2)
            `,
        },
    ],
    invalid: [
        {
            name: '=> number',
            code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => 123)
            `,
            errors: [{messageId: 'no_return_to_void'}],
        },
        {
            name: 'returns a number',
            code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => {
                    return 123
                })
            `,
            errors: [{messageId: 'no_return_to_void'}],
        },
        {
            name: '=> math.random()',
            code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => Math.random())
            `,
            errors: [{messageId: 'no_return_to_void'}],
        },
        {
            name: 'returns a number or void',
            code: /*javascript*/ `
                declare function func(callback: () => void): boolean
                func(() => {
                    if (Math.random() > 0.5) return
                    return 123
                })
            `,
            errors: [{messageId: 'no_return_to_void'}],
        },
    ],
})
