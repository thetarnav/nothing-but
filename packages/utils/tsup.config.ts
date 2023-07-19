import fs from 'fs'
import path from 'path'
import { defineConfig } from 'tsup-preset-solid'

const src = path.resolve(__dirname, 'src')
const entries = fs.readdirSync(src)

export default defineConfig(
    entries.map(entry => ({ entry: path.join(src, entry) })),
    {
        // Enable this to write export conditions to package.json
        // writePackageJson: true,
        dropConsole: true,
    },
)
