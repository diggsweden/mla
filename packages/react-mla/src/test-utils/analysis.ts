// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { DateTime } from 'luxon'
import type { Direction, IEntity, ILink } from '../interfaces/data-models'
import { person } from './setup'

export const at = (iso: string) => DateTime.fromISO(iso)

// An activity of the test configuration: Händelse with Rubrik and Beskrivning
export function activity (id: string, title: string, date: DateTime, extra: Partial<IEntity> = {}): IEntity {
  return person(id, { handelseE1: title, handelseE2: title + ' (beskrivning)' }, { TypeId: 'handelse', DateFrom: date, DateTo: date, ...extra })
}

export function link (id: string, typeId: string, from: IEntity, to: { Id: string, TypeId: string }, properties: Record<string, string> = {}, direction: Direction = 'NONE'): ILink {
  return {
    Id: id,
    TypeId: typeId,
    InternalId: undefined as unknown as string,
    LabelShort: '',
    LabelLong: '',
    LabelChart: '',
    SourceSystemId: 'test',
    Direction: direction,
    FromEntityId: from.Id,
    FromEntityTypeId: from.TypeId,
    ToEntityId: to.Id,
    ToEntityTypeId: to.TypeId,
    Properties: Object.entries(properties).map(([TypeId, Value]) => ({ TypeId, Value }))
  }
}
