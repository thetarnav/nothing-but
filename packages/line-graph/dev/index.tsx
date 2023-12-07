/* @refresh reload */
import * as cleanup from '@nothing-but/utils/lifecycle'
import * as solid from 'solid-js'

cleanup.setCleanupHandler(solid.onCleanup)

import '@unocss/reset/tailwind-compat.css'
import 'virtual:uno.css'
import './styles.css'
