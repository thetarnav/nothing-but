import {RuleTester} from '@typescript-eslint/rule-tester'
import path from 'node:path'
import * as rule from '../src/no-ignored-return.js'

const ruleTester = new RuleTester({
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: path.resolve(__dirname, 'resources', 'tsconfig.json'),
        tsconfigRootDir: path.resolve(__dirname, 'resources'),
    },
})

ruleTester.run('no-ignored-return', rule.no_ignored_return, {
    valid: [
        {
            name: 'captured',
            code: /*javascript*/ `
                declare function func(): boolean

                const res = func()
            `,
        },
        {
            name: 'void',
            code: /*javascript*/ `
                declare function func(): void

                func()
            `,
        },
        {
            name: 'overload',
            code: /*javascript*/ `
                declare function func(a: string, b: string): void
                declare function func(a: number): void

                func()
            `,
        },
        {
            name: 'arrow captured',
            code: /*javascript*/ `
                const func = () => true

                const res = func()
            `,
        },
        {
            name: 'arrow void',
            code: /*javascript*/ `
                const func = () => {}

                func()
            `,
        },
        {
            name: 'object declaration',
            code: /*javascript*/ `
                declare function func(): boolean

                const obj = {
                    prop: func()
                }
            `,
        },
        {
            name: 'property assignment',
            code: /*javascript*/ `
                declare function func(): boolean

                obj.prop = func()
            `,
        },
        {
            name: 'if',
            code: /*javascript*/ `
                declare function func(): boolean

                if (func()) {}
            `,
        },
        {
            name: 'parameter',
            code: /*javascript*/ `
                declare function func(): boolean

                function foo(a = func()) {}
            `,
        },
        {
            name: 'call as parameter',
            code: /*javascript*/ `
                declare function funcA(a: boolean): void
                declare function funcB(): boolean

                funcA(funcB())
            `,
        },
        {
            name: 'no function type',
            code: /*javascript*/ `
                func(123)
            `,
        },
        {
            name: 'array methods',
            code: /*javascript*/ `
                const arr = []
                arr.push(4);
                arr.pop();
                arr.shift();
                arr.unshift(4);
                [].splice(0, 1);
                [].sort();
                [].reverse();
            `,
        },
        {
            name: 'map methods',
            code: /*javascript*/ `
                const map = new Map()
                map.set(1, 2)
                map.delete(1)
            `,
        },
        {
            name: 'set methods',
            code: /*javascript*/ `
                const set = new Set()
                set.add(1)
                set.delete(1)
            `,
        },
        {
            name: 'nested object',
            code: /*javascript*/ `
                const obj = {
                    prop: {
                        nested(): void {}
                    }
                }

                obj.prop.nested()
            `,
        },
    ],
    invalid: [
        {
            name: 'not captured',
            code: /*javascript*/ `
                declare function func(): boolean
                func()
            `,
            errors: [{messageId: 'use_return_value'}],
        },
        {
            name: 'returns union',
            code: /*javascript*/ `
                declare function func(): boolean | void
                func()
            `,
            errors: [{messageId: 'use_return_value'}],
        },
        {
            name: 'overload',
            code: /*javascript*/ `
                declare function func(): void
                declare function func(a: number): boolean
                func()
            `,
            errors: [{messageId: 'use_return_value'}],
        },
        {
            name: 'arrow',
            code: /*javascript*/ `
                const func = () => true
                func()
            `,
            errors: [{messageId: 'use_return_value'}],
        },
        {
            name: 'nested object',
            code: /*javascript*/ `
                const obj = {
                    prop: {
                        nested(): boolean {}
                    }
                }

                obj.prop.nested()
            `,
            errors: [{messageId: 'use_return_value'}],
        },
    ],
})
