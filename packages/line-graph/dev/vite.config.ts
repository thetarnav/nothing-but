import unocss from 'unocss/vite'
import solid from 'vite-plugin-solid'
import {defineConfig} from 'vitest/config'
import uno_config from '../../../uno.config.js'

export default defineConfig({
    server: {port: 3000},
    plugins: [solid({hot: false}), unocss(uno_config)],
    build: {
        target: 'esnext',
        minify: false,
    },
})
