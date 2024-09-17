// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { createRoot } from 'react-dom/client'
import { MLA } from './MLA'

import * as config from '../../../apps/web/public/config/default.json'

createRoot(document.getElementById('root')!).render(
  <MLA config={JSON.stringify(config)} />
)