// import * as bun from "bun"

// bun.$.env({FORCE_COLOR: "1"})

// let command_entries: Record<string, () => void> = {
// 	async "build"() {
// 		await bun.$`bun turbo run build "--filter=./packages/*"`
// 	},
// 	async "test"() {
// 		await bun.$`bun turbo run test "--filter=./packages/*"`
// 	},
// 	async "typecheck"() {
// 		await bun.$`bun turbo run typecheck "--filter=./packages/*"`
// 	},
// 	async "build-test"() {
// 		await bun.$`bun turbo run build test typecheck "--filter=./packages/*"`
// 	},
// 	async "lint"() {

// 		await bun.$`bun eslint --ignore-path .gitignore --max-warnings 0 "packages/*/src/**/*.ts"`
// 		await bun.$`bun eslint --ignore-path .gitignore "packages/*/test/**/*.ts" --quiet --rule \"no-only-tests/no-only-tests: error\"`
// 	},
// }

// let command = bun.argv[2] ?? ""
// if (command_entries[command]) {
// 	try {
// 		await command_entries[command]()
// 	} catch (err) {
// 		console.error(`Command "${command}" failed.`)
// 		process.exit(1)
// 	}
// } else {
// 	console.error(`Unknown command: "${command}", available commands are: ${Object.keys(command_entries).join(", ")}.`)
// 	process.exit(1)
// }
