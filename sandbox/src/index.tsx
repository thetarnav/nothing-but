/* @refresh reload */

import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'
import './styles.scss'

import { render } from 'solid-js/web'
import { App } from './app'

render(() => <App />, document.getElementById('root')!)
