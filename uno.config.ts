import transformerDirectives from '@unocss/transformer-directives'
import {defineConfig, presetUno} from 'unocss'

export default defineConfig({
    presets: [presetUno()],
    transformers: [transformerDirectives()],
    theme: {
        // colors: colors,
    },
    shortcuts: {
        'center-child': 'flex items-center justify-center',
    },
})
