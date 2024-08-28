// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import type { IBasePropertyConfiguration } from './common-configuration'

interface IEventOperation {
  TypeId: string
  Properties: IEventPropertyAction[]
  LinkTo: IEventTarget[]
  LinkFrom: IEventTarget[]
}

interface IEventTarget {
  TypeId: string
  PropertyTypeId: string
  EntityPropertyTypeId?: string
}

interface IEventPropertyAction extends IBasePropertyConfiguration {
  Action: EventPropertyAction
  TargetPropertyTypeId: string
}

interface IEventFilter {
  PropertyTypeId: string
  Filter: string
}

type EventPropertyAction = 'sum' | 'join' | 'count' | 'average'

export type {
  EventPropertyAction,
  IEventOperation,
  IEventPropertyAction,
  IEventTarget,
  IEventFilter
}
