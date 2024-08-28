// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { createRoot } from 'react-dom/client'
import MLA from '@repo/mla'
import setupMockApi from './mock-setup'

setupMockApi()

createRoot(document.getElementById('root')!).render(
  <MLA configSrc={'config/default.json'} />
)