import handlebars from 'vite-plugin-handlebars'
import { resolve } from 'path'
import vsharp from "vite-plugin-vsharp"
import data from "./data.json"

export default {
	base: '',
	plugins: [
		handlebars({
			context: data,
			partialDirectory: resolve(__dirname, 'src/partials'),
		}),
		vsharp(),
	],
}