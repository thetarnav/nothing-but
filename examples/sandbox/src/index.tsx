/* @refresh reload */

import './index.scss'

import { render } from 'solid-js/web'
import { App } from './appp'

render(() => <App />, document.getElementById('root') as HTMLElement)
