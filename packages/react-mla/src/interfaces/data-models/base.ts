// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { DateTime } from 'luxon'
import { type IHistory } from './history'
import { type IProperty } from './property'

interface IChartBase extends IBase, IHistory {
  LabelShort: string
  LabelLong: string
  LabelChart: string
  InternalId: number
  SourceSystemId: string
  MarkColor?: string
  Color?: string
  Size?: number
}

interface ILinked {
  FromEntityTypeId: string
  FromEntityId: string
  ToEntityTypeId: string
  ToEntityId: string
}

interface IBase {
  Id: string
  TypeId: string
  GlobalType?: string
  Properties: IProperty[]
}

interface ITimeSpan {
  DateFrom: DateTime
  DateTo: DateTime
}

export type {
  IBase,
  ILinked,
  IChartBase,
  ITimeSpan
}
