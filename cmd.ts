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

import * as fsp  from "node:fs/promises"
import * as fs   from "node:fs"
import * as path from "node:path"


async function was_modified_since_last_check(filepath: string, last_time: Date): Promise<boolean> {
	let stat = await fsp.stat(filepath)
	return stat.mtime > last_time
}

let packages_path    = path.join("./packages/")
let packages_dirents = await fsp.readdir(packages_path, {withFileTypes: true})
let packages_names: string[] = []

for (let dirent of packages_dirents) {
	if (dirent.isDirectory()) {
		packages_names.push(dirent.name)
	}
}

type Package_Cache_Entry = {
	time: Date,
}

let package_cache: Record<string, Package_Cache_Entry> = {}
for (let name of packages_names) {
	package_cache[name] = {
		time: new Date(0),
	}
}

let data_file_path = "./node_modules/.cache/data.json"

if (fs.existsSync(data_file_path)) {
	let data = JSON.parse(fs.readFileSync(data_file_path, "utf-8")) as unknown
	if (data && typeof data === "object" && !Array.isArray(data)) {
		for (let [name, value] of Object.entries(data) as [string, unknown][]) {
			if (value && typeof value === "object" && "time" in value && typeof value.time === "number") {
				package_cache[name]!.time = new Date(value.time)
			}
		}
	}
}

for (let name of packages_names) {
	let last_time = package_cache[name]!.time
	let package_path = path.join(packages_path, name)

	console.log(package_path)

	await was_modified_since_last_check(package_path, last_time).then(console.log)
}

// // Example usage:
// const filePath = "./example.txt";
// const lastCheckTime = new Date("2023-01-01T00:00:00Z");

// wasModifiedSinceLastCheck(filePath, lastCheckTime)
//	 .then((wasModified) => {
//		 console.log(`Was the file modified since last check? ${wasModified}`);
//	 })
//	 .catch((error) => {
//		 console.error("Error checking file modification time:", error);
//	 });