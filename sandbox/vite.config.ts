import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import unocss from 'unocss/vite'

export default defineConfig({
    server: {
        port: 3000,
    },
    resolve: {
        alias: {
            src: '/src',
        },
    },
    plugins: [
        solid(),
        // config in ../uno.config.ts
        unocss(),
    ],
    build: {
        target: 'esnext',
    },
})
