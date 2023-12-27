/* @refresh reload */
import * as cleanup from '@nothing-but/utils/lifecycle'
import * as solid from 'solid-js'

import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'
import './styles.css'

cleanup.setCleanupHandler(solid.onCleanup)

const pathname = location.pathname
const page = pathname.endsWith('/') ? pathname.slice(1, -1) : pathname.slice(1)

if (page) {
    await import(`./pages/${page}.tsx`)
}
