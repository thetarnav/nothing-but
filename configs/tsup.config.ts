import fs from 'fs'
import path from 'path'
import * as tsup from 'tsup'
import * as preset from 'tsup-preset-solid'

export const CI =
    process.env['CI'] === 'true' ||
    process.env['CI'] === '"1"' ||
    process.env['GITHUB_ACTIONS'] === 'true' ||
    process.env['GITHUB_ACTIONS'] === '"1"' ||
    !!process.env['TURBO_HASH']

export function get_src_entries(from: string): preset.EntryOptions[] {
    const src = path.resolve(from, 'src')
    const entries = fs.readdirSync(src)
    return entries.map(entry => ({ entry: path.join(src, entry) }))
}

export function get_multi_entry_options(
    from: string,
    cli_options: tsup.Options,
): preset.ParsedPresetOptions {
    const options: preset.PresetOptions = {
        entries: get_src_entries(from),
        drop_console: true,
    }
    const watching = !!cli_options.watch
    return preset.parsePresetOptions(options, watching)
}

export function get_single_entry_options(cli_options: tsup.Options): preset.ParsedPresetOptions {
    const options: preset.PresetOptions = {
        entries: { entry: 'src/index.ts' },
        drop_console: true,
    }
    const watching = !!cli_options.watch
    return preset.parsePresetOptions(options, watching)
}

export function update_package_json(
    options: preset.ParsedPresetOptions,
    cli_options: tsup.Options,
) {
    const watching = !!cli_options.watch
    if (watching || CI) return

    const package_fields = preset.generatePackageExports(options)

    preset.writePackageJson(package_fields)
}

export function generate_single_entry_config() {
    return tsup.defineConfig(config => {
        const options = get_single_entry_options(config)

        update_package_json(options, config)

        return preset.generateTsupOptions(options)
    })
}

export function generate_multi_entry_config(from: string) {
    return tsup.defineConfig(config => {
        const options = get_multi_entry_options(from, config)

        update_package_json(options, config)

        return preset.generateTsupOptions(options)
    })
}
