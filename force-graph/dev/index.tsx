/* @refresh reload */

import "@unocss/reset/tailwind-compat.css"
import "virtual:uno.css"
import "./styles.css"

import {render} from "solid-js/web"
import {App} from "./app.jsx"

void render(() => <App />, document.getElementById("root")!)
