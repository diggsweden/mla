// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import useMainStore from '../../store/main-store'
import useAppStore from '../../store/app-store'
import { initServices, person } from '../../test-utils/setup'
import { activity, at, link } from '../../test-utils/analysis'
import { countOtherLinks, getActivities, getActorKeys, getPhases, getUndatedActivities, inPeriod, periodOf, phaseIndexOf, phasesOutside } from './analysis-data'

const source = { activityTypeId: 'handelse', linkTypeId: 'LT6', rolePropertyId: 'LT6E1' }
const read = () => {
  const { entities, links } = useMainStore.getState()
  return getActivities(entities, links, source, useAppStore.getState().currentViewConfiguration)
}

beforeAll(async () => {
  await initServices()
})

beforeEach(() => {
  useMainStore.setState({ entities: {}, links: {}, phaseEvents: [] })
})

describe('the activities', () => {
  test('are numbered in order of time, whatever order they were added in', () => {
    useMainStore.getState().addEntity(activity('late', 'Sent', at('2024-05-03T10:00')), activity('early', 'Tidigt', at('2024-05-01T10:00')))
    expect(read().map(a => [a.title, a.n])).toEqual([['Tidigt', 1], ['Sent', 2]])
  })

  test('have the label of the view as title and description', () => {
    useMainStore.getState().addEntity(activity('a', 'Samtal', at('2024-05-01T10:00')))
    const [a] = read()
    expect(a.title).toBe('Samtal')
    expect(a.description).toBe('Samtal (beskrivning)')
  })

  test('use the color the activity has in the chart', () => {
    useMainStore.getState().addEntity(activity('a', 'Samtal', at('2024-05-01T10:00'), { Color: '#D53302' }))
    expect(read()[0].color).toBe('#D53302')
  })

  test('include an activity that only has a start date', () => {
    useMainStore.getState().addEntity(activity('a', 'Möte', at('2024-05-01T10:00'), { DateTo: undefined }))
    expect(read()).toHaveLength(1)
  })

  test('leave out activities without a date', () => {
    useMainStore.getState().addEntity(activity('a', 'Utan datum', at('2024-05-01T10:00'), { DateFrom: undefined, DateTo: undefined }))
    expect(read()).toHaveLength(0)
  })
})

describe('the relations of an activity', () => {
  test('carry the role and the direction of the link', () => {
    const call = activity('c', 'Samtal', at('2024-05-01T10:00'))
    const anna = person('anna', { personE2: 'Anna' })
    const bo = person('bo', { personE2: 'Bo' })
    useMainStore.getState().addEntity(call, anna, bo)
    // Anna's link points to the call, and the call's link points to Bo
    useMainStore.getState().addLink(
      link('l1', 'LT6', call, anna, { LT6E1: 'Ringer' }, 'FROM'),
      link('l2', 'LT6', call, bo, { LT6E1: 'Svarar' }, 'TO')
    )
    const relations = read()[0].relations
    expect(relations).toContainEqual({ actorKey: 'annaperson', role: 'Ringer', direction: 'from' })
    expect(relations).toContainEqual({ actorKey: 'boperson', role: 'Svarar', direction: 'to' })
  })

  test('read the direction from the activity also when the link is drawn from the actor', () => {
    const call = activity('c', 'Samtal', at('2024-05-01T10:00'))
    const anna = person('anna', { personE2: 'Anna' })
    useMainStore.getState().addEntity(call, anna)
    // The link goes from Anna to the call and points that way
    useMainStore.getState().addLink(link('l1', 'LT6', anna, call, {}, 'TO'))
    expect(read()[0].relations[0].direction).toBe('from')
  })

  test('only come from links of the chosen type', () => {
    const meeting = activity('m', 'Möte', at('2024-05-01T10:00'))
    const anna = person('anna', { personE2: 'Anna' })
    useMainStore.getState().addEntity(meeting, anna)
    useMainStore.getState().addLink(link('l1', 'relation', meeting, anna, { relationslank: 'Känner' }))
    expect(read()[0].relations).toEqual([])
  })

  test('leave out a link to an entity that is not in the chart', () => {
    const meeting = activity('m', 'Möte', at('2024-05-01T10:00'))
    useMainStore.getState().addEntity(meeting)
    useMainStore.getState().addLink(link('l1', 'LT6', meeting, { Id: 'missing', TypeId: 'person' }, { LT6E1: 'Deltar' }))
    expect(read()[0].relations).toEqual([])
  })

  test('give the actors in the order they first take part', () => {
    const first = activity('a1', 'Först', at('2024-05-01T10:00'))
    const second = activity('a2', 'Sedan', at('2024-05-02T10:00'))
    const anna = person('anna', { personE2: 'Anna' })
    const bo = person('bo', { personE2: 'Bo' })
    useMainStore.getState().addEntity(first, second, anna, bo)
    useMainStore.getState().addLink(link('l1', 'LT6', second, anna), link('l2', 'LT6', first, bo), link('l3', 'LT6', second, bo))
    expect(getActorKeys(read())).toEqual(['boperson', 'annaperson'])
  })
})

describe('the phases', () => {
  test('are in order of time, each until the next starts, and the activities fall in them', () => {
    const phases = getPhases([
      { Id: 'p2', Description: 'Genomförande', Date: at('2024-05-04T00:00') },
      { Id: 'p1', Description: 'Planering', Date: at('2024-05-01T00:00') }
    ])
    expect(phases.map(p => p.name)).toEqual(['Planering', 'Genomförande'])
    expect(phases[0].until?.toISODate()).toBe('2024-05-04')
    expect(phases[1].until).toBeUndefined()

    useMainStore.getState().addEntity(activity('a', 'Före', at('2024-04-30T10:00')), activity('b', 'Plan', at('2024-05-02T10:00')), activity('c', 'Brott', at('2024-05-05T02:30')))
    expect(read().map(a => phaseIndexOf(a, phases))).toEqual([-1, 0, 1])
  })
})

describe('an activity made in the chart, which has no date yet', () => {
  test('is not placed in time, but who takes part in it can still be chosen', () => {
    const meeting = activity('m', 'Möte', at('2024-05-01T10:00'), { DateFrom: undefined, DateTo: undefined })
    const anna = person('anna', { personE2: 'Anna' })
    useMainStore.getState().addEntity(meeting, anna)
    useMainStore.getState().addLink(link('l1', 'LT6', meeting, anna, { LT6E1: 'Deltar' }))
    const { entities, links } = useMainStore.getState()
    const viewConfig = useAppStore.getState().currentViewConfiguration

    expect(read()).toEqual([])
    const undated = getUndatedActivities(entities, links, source, viewConfig)
    expect(undated.map(a => a.title)).toEqual(['Möte'])
    expect(getActorKeys(undated)).toEqual(['annaperson'])
  })
})

describe('links of another type than the chosen one', () => {
  test('are counted, so that the user can be told why they are left out', () => {
    const meeting = activity('m', 'Möte', at('2024-05-01T10:00'))
    const anna = person('anna', { personE2: 'Anna' })
    const bo = person('bo', { personE2: 'Bo' })
    useMainStore.getState().addEntity(meeting, anna, bo)
    useMainStore.getState().addLink(link('l1', 'LT6', meeting, anna), link('l2', 'relation', meeting, bo), link('l3', 'relation', anna, bo))
    const { entities, links } = useMainStore.getState()
    expect(countOtherLinks(entities, links, source)).toBe(1)
    expect(countOtherLinks(entities, links, { ...source, linkTypeId: undefined })).toBe(0)
  })
})

describe('the phases outside the days of the events', () => {
  test('are those that end before the first day or start after the last', () => {
    useMainStore.getState().addEntity(activity('a', 'Möte', at('2024-05-02T10:00')), activity('b', 'Samtal', at('2024-05-04T22:00')))
    const phases = getPhases([
      { Id: 'p1', Description: 'Före', Date: at('2024-04-01T00:00') },
      { Id: 'p2', Description: 'Planering', Date: at('2024-05-01T00:00') },
      { Id: 'p3', Description: 'Sista dagen', Date: at('2024-05-04T00:00') },
      { Id: 'p4', Description: 'I dag', Date: at('2026-11-26T00:00') }
    ])
    const { first, last } = periodOf(undefined, undefined, read())
    expect(phasesOutside(phases, first, last).map(p => p.name)).toEqual(['Före', 'I dag'])
    expect(phasesOutside(phases, undefined, undefined)).toEqual([])
  })
})

describe('the period of a view', () => {
  test('keeps the activities from the start of its first day to the end of its last, and is open where it has no end', () => {
    useMainStore.getState().addEntity(
      activity('a', 'Före', at('2024-04-30T23:59')), activity('b', 'Första', at('2024-05-01T00:00')),
      activity('c', 'Sista', at('2024-05-03T23:59')), activity('d', 'Efter', at('2024-05-04T00:00')))
    expect(inPeriod(read(), '2024-05-01', '2024-05-03').map(a => a.title)).toEqual(['Första', 'Sista'])
    expect(inPeriod(read(), '2024-05-01', undefined).map(a => a.title)).toEqual(['Första', 'Sista', 'Efter'])
    expect(inPeriod(read(), undefined, undefined)).toHaveLength(4)
    // The numbers stay those of all the activities, so that they are the same in every view
    expect(inPeriod(read(), '2024-05-01', '2024-05-03').map(a => a.n)).toEqual([2, 3])
  })

  test('is the days of the activities until the user chooses', () => {
    useMainStore.getState().addEntity(activity('a', 'Möte', at('2024-05-02T10:00')), activity('b', 'Samtal', at('2024-05-04T22:00')))
    const auto = periodOf(undefined, undefined, read())
    expect([auto.first?.toISO(), auto.last?.toISODate()]).toEqual([at('2024-05-02T00:00').toISO(), '2024-05-04'])
    const chosen = periodOf('2024-04-01', undefined, read())
    expect([chosen.first?.toISODate(), chosen.last?.toISODate()]).toEqual(['2024-04-01', '2024-05-04'])
  })

  test('with all dates goes from the first phase or activity, whichever comes first, to the last', () => {
    useMainStore.getState().addEntity(activity('a', 'Möte', at('2024-05-02T10:00')), activity('b', 'Samtal', at('2024-05-04T22:00')))
    const before = getPhases([{ Id: 'p1', Description: 'Planering', Date: at('2024-04-28T00:00') }, { Id: 'p2', Description: 'Brott', Date: at('2024-05-03T00:00') }])
    const after = getPhases([{ Id: 'p1', Description: 'Planering', Date: at('2024-05-03T00:00') }, { Id: 'p2', Description: 'Efterspel', Date: at('2024-05-10T00:00') }])
    const a = periodOf(undefined, undefined, read(), before)
    expect([a.first?.toISODate(), a.last?.toISODate()]).toEqual(['2024-04-28', '2024-05-04'])
    const b = periodOf(undefined, undefined, read(), after)
    expect([b.first?.toISODate(), b.last?.toISODate()]).toEqual(['2024-05-02', '2024-05-10'])
    const onlyPhases = periodOf(undefined, undefined, [], after)
    expect([onlyPhases.first?.toISODate(), onlyPhases.last?.toISODate()]).toEqual(['2024-05-03', '2024-05-10'])
  })
})
