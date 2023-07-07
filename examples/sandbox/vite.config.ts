import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [solidPlugin()],
  build: {
    target: 'esnext',
  },
})
