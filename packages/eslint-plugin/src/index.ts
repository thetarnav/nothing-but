import * as Eslint from '@typescript-eslint/utils'
import {no_ignored_return} from './no-ignored-return.js'

export const rules: Record<string, Eslint.TSESLint.RuleModule<string, unknown[]>> = {
    'no-ignored-return': no_ignored_return,
}
