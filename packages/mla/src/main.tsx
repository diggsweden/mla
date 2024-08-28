// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { createRoot } from 'react-dom/client'
import { MLA } from './MLA'

import * as config from '../../component/test/default.json'

createRoot(document.getElementById('root')!).render(
  <MLA config={JSON.stringify(config)} />
)