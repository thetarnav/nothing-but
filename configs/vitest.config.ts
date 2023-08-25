import {defineConfig} from 'vitest/config'

export default defineConfig({
    test: {
        passWithNoTests: true,
        watch: false,
        globals: true,
        clearMocks: true,
        environment: 'node',
    },
})
