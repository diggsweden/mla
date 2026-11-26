// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { beforeAll, describe, expect, test } from 'vitest'
import { DateTime } from 'luxon'
import useMainStore from './main-store'
import { initServices, person } from '../test-utils/setup'
import type { IEvent } from '../interfaces/data-models'
import { getId } from '../utils/utils'

beforeAll(async () => {
  await initServices()
})

describe('versions of an entity', () => {
  test('the version valid at a date is found after a version is replaced', () => {
    const jan = DateTime.fromISO('2020-01-01T00:00:00Z')
    const mar = DateTime.fromISO('2020-03-01T00:00:00Z')
    const id = 'versions-1'

    useMainStore.getState().addEntity(
      person(id, { personE2: 'January' }, { DateFrom: jan }),
      person(id, { personE2: 'March' }, { DateFrom: mar })
    )

    // The March version comes again, for example from a new search
    useMainStore.getState().addEntity(person(id, { personE2: 'March again' }, { DateFrom: mar }))

    const key = getId(person(id))
    const versions = useMainStore.getState().getEntityHistory(key)!
    expect(versions.map(v => v.DateFrom?.toMillis())).toEqual([jan.toMillis(), mar.toMillis()])

    const february = DateTime.fromISO('2020-02-01T00:00:00Z')
    expect(useMainStore.getState().getCurrentEntity(key, february)?.Properties[0].Value).toBe('January')
  })
})

describe('the date range of the time line', () => {
  test('covers the earliest and the latest of the events that are added together', () => {
    const { minDate, maxDate } = useMainStore.getState()
    const event = (id: string, date: DateTime): IEvent => ({
      Id: id,
      TypeId: 'call',
      Date: date,
      Properties: [],
      LinkFrom: { LT1: { Id: 'a', TypeId: 'person' } },
      LinkTo: { LT1: { Id: 'b', TypeId: 'person' } }
    })

    const earliest = minDate.minus({ years: 2 })
    const early = minDate.minus({ years: 1 })
    const late = maxDate.plus({ years: 1 })
    const latest = maxDate.plus({ years: 2 })

    // The order is not sorted, the earliest and the latest come first
    useMainStore.getState().setEvent(
      event('e1', earliest),
      event('e2', latest),
      event('e3', early),
      event('e4', late)
    )

    expect(useMainStore.getState().minDate.toMillis()).toBe(earliest.toMillis())
    expect(useMainStore.getState().maxDate.toMillis()).toBe(latest.toMillis())
  })
})

describe('undo', () => {
  test('an undone change gives back the source of the entity', () => {
    const id = 'undo-1'
    const key = getId(person(id))
    useMainStore.getState().addEntity(person(id, { personE2: 'Before' }, { SourceSystemId: 'System X' }))

    const added = useMainStore.getState().getEntityHistory(key)![0]
    useMainStore.getState().updateEntity({ ...added, Properties: [{ TypeId: 'personE2', Value: 'After' }] })
    expect(useMainStore.getState().getEntityHistory(key)![0].SourceSystemId).not.toBe('System X')

    useMainStore.getState().undo()
    const restored = useMainStore.getState().getEntityHistory(key)![0]
    expect(restored.Properties[0].Value).toBe('Before')
    expect(restored.SourceSystemId).toBe('System X')

    // Redo makes the change again, and it is shown as modified again
    useMainStore.getState().redo()
    const redone = useMainStore.getState().getEntityHistory(key)![0]
    expect(redone.Properties[0].Value).toBe('After')
    expect(redone.SourceSystemId).not.toBe('System X')
  })
})
