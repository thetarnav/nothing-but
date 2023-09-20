import * as Eslint from '@typescript-eslint/utils'
import {no_ignored_return} from './no-ignored-return.js'
import {no_return_to_void} from './no-return-to-void.js'

export const rules: Record<string, Eslint.TSESLint.RuleModule<string, unknown[]>> = {
    'no-ignored-return': no_ignored_return,
    'no-return-to-void': no_return_to_void,
}
