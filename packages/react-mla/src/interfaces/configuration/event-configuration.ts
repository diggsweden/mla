// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import type { IBaseThing } from './common-configuration'
import type { IEventOperation } from './event-operations'

interface IEventConfiguration extends IBaseThing {
  Source: string
  Generate: IEventOperation[]
}

export type {
  IEventConfiguration
}
