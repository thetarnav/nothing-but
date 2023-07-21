import fs from 'fs'
import path from 'path'
import { defineConfig } from 'tsup'
import * as preset from 'tsup-preset-solid'

export const CI =
    process.env['CI'] === 'true' ||
    process.env['CI'] === '"1"' ||
    process.env['GITHUB_ACTIONS'] === 'true' ||
    process.env['GITHUB_ACTIONS'] === '"1"' ||
    !!process.env['TURBO_HASH']

export function getTsupConfig(from: string) {
    const src = path.resolve(from, 'src')
    const entries = fs.readdirSync(src)

    const preset_options: preset.PresetOptions = {
        entries: entries.map(entry => ({ entry: path.join(src, entry) })),
        drop_console: true,
    }

    return defineConfig(config => {
        const watching = !!config.watch

        const parsed_options = preset.parsePresetOptions(preset_options, watching)

        if (!watching && !CI) {
            const package_fields = preset.generatePackageExports(parsed_options)

            /*
                will update ./package.json with the correct export fields
            */
            preset.writePackageJson(package_fields)
        }

        return preset.generateTsupOptions(parsed_options)
    })
}