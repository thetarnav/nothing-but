import unocss from "unocss/vite"
import solid from "vite-plugin-solid"
import {defineConfig} from "vite"
import uno_config from "../../uno.config.js"

export default defineConfig({
	base: "",
	server: {port: 3000},
	plugins: [solid(), unocss(uno_config)],
	build: {
		target: "esnext",
		minify: false,
	},
})
