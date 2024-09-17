// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { DateTime } from 'luxon'
import type { IBase } from './base'
import type { ILink } from './link'

interface IEvent extends IBase {
  Date: DateTime
  LinkFrom: Record<string, { Id: string, TypeId: string }>
  LinkTo: Record<string, { Id: string, TypeId: string }>
}

interface IEventLink extends ILink {
  EventTypeId: string
  Events: IEvent[]
}

export type {
  IEvent,
  IEventLink
}
