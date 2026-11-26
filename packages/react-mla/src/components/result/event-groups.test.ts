// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, test } from 'vitest'
import { DateTime } from 'luxon'
import { buildEventGroups } from './event-groups'
import type { IEvent } from '../../interfaces/data-models'

function events (count: number): IEvent[] {
  const start = DateTime.fromISO('2024-01-01T00:00:00Z')
  return Array.from({ length: count }, (_, i) => ({
    Id: 'e' + i,
    TypeId: 'call',
    Date: start.plus({ minutes: i }),
    Properties: [],
    LinkFrom: {},
    LinkTo: {}
  }))
}

describe('the event groups of a result', () => {
  test('a few events are one group', () => {
    const groups = buildEventGroups({ Entities: [], Links: [], Events: events(3) })
    expect(groups.map(g => g.Events.length)).toEqual([3])
  })

  test('many events are split into groups of at most 10000', () => {
    const groups = buildEventGroups({ Entities: [], Links: [], Events: events(15000) })
    expect(groups.map(g => g.Events.length)).toEqual([10000, 5000])
  })

  test('exactly 10000 events are one group, and no empty group is made', () => {
    const groups = buildEventGroups({ Entities: [], Links: [], Events: events(10000) })
    expect(groups.map(g => g.Events.length)).toEqual([10000])
  })

  test('20000 events are two groups', () => {
    const groups = buildEventGroups({ Entities: [], Links: [], Events: events(20000) })
    expect(groups.map(g => g.Events.length)).toEqual([10000, 10000])
  })
})
