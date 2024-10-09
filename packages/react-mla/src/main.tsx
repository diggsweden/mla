// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import React from 'react'
import { createRoot } from 'react-dom/client'
import { MLA } from './MLA'

import * as config from '../../../tools/test/default.json'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MLA config={JSON.stringify(config)} />
  </React.StrictMode>
)