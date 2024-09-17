// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { IBaseThing } from './common-configuration'
import type { IEventOperation } from './event-operations'

interface IEventConfiguration extends IBaseThing {
  Source: string
  Generate: IEventOperation[]
}

export type {
  IEventConfiguration
}
