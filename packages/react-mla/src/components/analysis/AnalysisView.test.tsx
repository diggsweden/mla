// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { type RenderResult, render } from 'vitest-browser-react'
import React from 'react'
import AnalysisView from './AnalysisView'
import useMainStore from '../../store/main-store'
import useAnalysisStore from '../../store/analysis-store'
import { initServices, person } from '../../test-utils/setup'
import { activity, at, link } from '../../test-utils/analysis'

// Points at the count of warnings at the bottom, and gives the box with their texts
async function warnings (screen: RenderResult, count: string) {
  await screen.getByRole('button', { name: count }).hover()
  return screen.getByRole('tooltip')
}

// The test configuration is in English
beforeAll(async () => {
  await initServices()
})

// Anna calls Bo, then Bo and Cecilia break in with the car; the phases are Planering and Genomförande
beforeEach(() => {
  useAnalysisStore.getState().load(undefined)
  useAnalysisStore.setState({ view: undefined, selectionOpen: true, settingsOpen: { timeline: true, phase: true } })
  useMainStore.setState({ entities: {}, links: {}, phaseEvents: [] })
  const call = activity('call', 'Samtal', at('2024-05-01T09:14'))
  const breakIn = activity('break', 'Inbrott', at('2024-05-05T02:30'), { Color: '#D53302' })
  const anna = person('anna', { personE2: 'Anna', personE3: 'Berg' })
  const bo = person('bo', { personE2: 'Bo', personE3: 'Lind' })
  const cecilia = person('cecilia', { personE2: 'Cecilia', personE3: 'Ek' })
  const car = person('car', { fordonE1: 'Volvo', fordonE2: 'ABC 123' }, { TypeId: 'fordon' })
  useMainStore.getState().addEntity(call, breakIn, anna, bo, cecilia, car)
  useMainStore.getState().addLink(
    link('l1', 'LT6', call, anna, { LT6E1: 'Ringer' }, 'FROM'),
    link('l2', 'LT6', call, bo, { LT6E1: 'Svarar' }, 'TO'),
    link('l3', 'LT6', breakIn, bo, { LT6E1: 'Gärningsman' }),
    link('l4', 'LT6', breakIn, cecilia, { LT6E1: 'Gärningsman' }),
    link('l5', 'LT6', breakIn, car, { LT6E1: 'Fordon' })
  )
  useMainStore.getState().setPhaseEvent({ Id: 'p1', Description: 'Planering', Date: at('2024-05-01T00:00') })
  useMainStore.getState().setPhaseEvent({ Id: 'p2', Description: 'Genomförande', Date: at('2024-05-04T00:00') })
})

describe('the phase analysis', () => {
  test('shows the acts, the activities, the notes and the groups of the preset', async () => {
    useAnalysisStore.getState().open('phase')
    const screen = await render(<AnalysisView />)

    await expect.element(screen.getByText('Planering', { exact: true })).toBeInTheDocument()
    await expect.element(screen.getByText('Genomförande', { exact: true })).toBeInTheDocument()
    await expect.element(screen.getByText('Akt', { exact: true })).toBeInTheDocument()
    await expect.element(screen.getByLabelText('Ingripandepunkter, Genomförande')).toBeInTheDocument()
    await expect.element(screen.getByRole('heading', { name: 'Rekvisita' })).toBeInTheDocument()
    // The car is a prop, the people are actors
    await expect.element(screen.getByText('ABC 123 Volvo').first()).toBeInTheDocument()
    await expect.element(screen.getByText('Bo Lind (gärningsman), Cecilia Ek (gärningsman), ABC 123 Volvo (fordon)')).toBeInTheDocument()
  })

  test('keeps a note that is written', async () => {
    useAnalysisStore.getState().open('phase')
    const screen = await render(<AnalysisView />)
    await screen.getByLabelText('Ingripandepunkter, Genomförande').fill('Larm vid lastporten')
    expect(useAnalysisStore.getState().notes.p2.Ingripandepunkter).toBe('Larm vid lastporten')
  })

  test('takes an actor away with − and back with +', async () => {
    useAnalysisStore.getState().open('phase')
    const screen = await render(<AnalysisView />)
    await screen.getByRole('button', { name: 'Remove Anna Berg' }).click()
    expect(useAnalysisStore.getState().phaseChosen).not.toContain('annaperson')
    await screen.getByRole('button', { name: 'Add Anna Berg' }).click()
    expect(useAnalysisStore.getState().phaseChosen).toContain('annaperson')
  })

  test('moves a type to another group and back', async () => {
    useAnalysisStore.getState().open('phase')
    const screen = await render(<AnalysisView />)
    await screen.getByRole('button', { name: 'Remove Bil from Rekvisita' }).click()
    expect(useAnalysisStore.getState().getSetup().Groups.find(g => g.Name === 'Rekvisita')?.EntityTypeIds).toEqual(['konto'])
    expect(useAnalysisStore.getState().getSetup().Preset).toBe('')
    await screen.getByLabelText('Add a type to Aktörer').selectOptions('fordon')
    expect(useAnalysisStore.getState().getSetup().Groups.find(g => g.Name === 'Aktörer')?.EntityTypeIds).toContain('fordon')
  })
})

describe('the time line', () => {
  test('shows a line per actor and the events with their numbers', async () => {
    useAnalysisStore.getState().open('timeline')
    const screen = await render(<AnalysisView />)
    await expect.element(screen.getByRole('heading', { name: 'Chosen actors' })).toBeInTheDocument()
    await expect.element(screen.getByText('Anna Berg').first()).toBeInTheDocument()
    await expect.element(screen.getByLabelText('2 Inbrott')).toBeInTheDocument()
    // Who takes part is shown when an event is pointed at, not in the list
    expect(screen.getByText('Anna Berg → Bo Lind').elements()).toHaveLength(0)
  })

  test('shows everything about an event when the pointer is on its number', async () => {
    useAnalysisStore.getState().open('timeline')
    useAnalysisStore.getState().setChosen('timeline', ['annaperson', 'boperson'])
    const screen = await render(<AnalysisView />)
    // The pointer is first moved away, as an earlier test can have left it where the event is drawn, and it is then not moved onto it
    await screen.getByRole('heading', { name: 'Selection' }).hover()
    await screen.getByLabelText('2 Inbrott').hover()
    const info = screen.getByRole('tooltip')
    await expect.element(info.getByText('Inbrott', { exact: true })).toBeInTheDocument()
    await expect.element(info.getByText('2024-05-05 02:30')).toBeInTheDocument()
    await expect.element(info.getByText('Bo Lind')).toBeInTheDocument()
    await expect.element(info.getByText('Gärningsman').first()).toBeInTheDocument()
    // Cecilia takes part but is not in the time line
    await expect.element(info.getByText('Cecilia Ek (not chosen)')).toBeInTheDocument()

    await screen.getByRole('heading', { name: 'Chosen actors' }).hover()
    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()
  })

  test('covers all dates, from the first phase or event to the last, so that every phase is seen', async () => {
    useMainStore.getState().setPhaseEvent({ Id: 'p0', Description: 'Förspel', Date: at('2024-04-20T00:00') })
    useMainStore.getState().setPhaseEvent({ Id: 'p3', Description: 'Efterspel', Date: at('2024-06-01T00:00') })
    useAnalysisStore.getState().open('timeline')
    const screen = await render(<AnalysisView />)
    const period = screen.getByRole('region', { name: 'Period' })
    await expect.element(period.getByLabelText('From')).toHaveValue('2024-04-20')
    await expect.element(period.getByLabelText('To')).toHaveValue('2024-06-01')
    await expect.element(screen.getByText('Efterspel', { exact: true })).toBeInTheDocument()
    await expect.element(screen.getByText('Förspel', { exact: true })).toBeInTheDocument()
  })

  test('covers the period chosen under the selection, which each view has of its own', async () => {
    useAnalysisStore.getState().open('timeline')
    const screen = await render(<AnalysisView />)
    const period = screen.getByRole('region', { name: 'Period' })
    // Until it is chosen, it shows the days of the events
    await expect.element(period.getByLabelText('From')).toHaveValue('2024-05-01')
    await expect.element(period.getByLabelText('To')).toHaveValue('2024-05-05')

    await period.getByLabelText('To').fill('2024-05-02')
    expect(useAnalysisStore.getState().timeline.To).toBe('2024-05-02')
    await expect.element(screen.getByRole('checkbox', { name: /Samtal/ })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Inbrott/ }).elements()).toHaveLength(0)
    expect(useAnalysisStore.getState().phase.To).toBeUndefined()

    await period.getByRole('button', { name: 'All dates' }).click()
    await expect.element(screen.getByRole('checkbox', { name: /Inbrott/ })).toBeInTheDocument()
  })

  test('leaves out an event that is unchecked', async () => {
    useAnalysisStore.getState().open('timeline')
    const screen = await render(<AnalysisView />)
    await screen.getByRole('checkbox', { name: /Samtal/ }).click()
    expect(useAnalysisStore.getState().excluded).toEqual(['callhandelse'])
  })
})

describe('the panels', () => {
  test('can be hidden and shown again', async () => {
    useAnalysisStore.getState().open('phase')
    const screen = await render(<AnalysisView />)
    await screen.getByRole('button', { name: 'Hide selection' }).click()
    await expect.element(screen.getByRole('button', { name: 'Show selection' })).toBeInTheDocument()
    await screen.getByRole('button', { name: 'Show selection' }).click()
    await expect.element(screen.getByRole('button', { name: 'Hide selection' })).toBeInTheDocument()

    await screen.getByRole('button', { name: 'Hide settings' }).click()
    await expect.element(screen.getByRole('button', { name: 'Show settings' })).toBeInTheDocument()
  })
})

describe('events made in the chart without a date', () => {
  test('let the actors be chosen, are listed as without a date, and the user is told why they are not shown', async () => {
    useMainStore.setState({ entities: {}, links: {}, phaseEvents: [] })
    const meeting = activity('meet', 'Möte', at('2024-05-01T10:00'), { DateFrom: undefined, DateTo: undefined })
    const anna = person('anna', { personE2: 'Anna', personE3: 'Berg' })
    const cecilia = person('cecilia', { personE2: 'Cecilia', personE3: 'Ek' })
    useMainStore.getState().addEntity(meeting, anna, cecilia)
    useMainStore.getState().addLink(link('l1', 'LT6', meeting, anna, { LT6E1: 'Deltar' }), link('l2', 'relation', meeting, cecilia))
    useAnalysisStore.getState().open('timeline')
    const screen = await render(<AnalysisView />)

    await expect.element(screen.getByRole('button', { name: 'Remove Anna Berg' })).toBeInTheDocument()
    await expect.element(screen.getByRole('checkbox', { name: 'Möte, No date' })).toBeDisabled()
    // The warnings are a count at the bottom, and their full texts are shown when it is pointed at
    const shown = await warnings(screen, '2 warnings')
    await expect.element(shown.getByText(/1 event has no date/)).toBeInTheDocument()
    await expect.element(shown.getByText(/1 link to the events is of another link type/)).toBeInTheDocument()
    await screen.getByRole('heading', { name: 'Chosen actors' }).hover()
    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('an entity that is not linked to any event', () => {
  test('is not chosen at first, but can be added from the ones not chosen', async () => {
    const david = person('david', { personE2: 'David', personE3: 'Holm' })
    useMainStore.getState().addEntity(david)
    useAnalysisStore.getState().open('timeline')
    const screen = await render(<AnalysisView />)

    expect(useAnalysisStore.getState().timelineChosen).toBeNull()
    await screen.getByRole('button', { name: 'Add David Holm' }).click()
    expect(useAnalysisStore.getState().timelineChosen).toContain('davidperson')
    await expect.element(screen.getByRole('button', { name: 'Remove David Holm' })).toBeInTheDocument()
  })
})

describe('the basis of the time line', () => {
  test('is chosen in its own settings, and links of that type are then counted', async () => {
    useMainStore.setState({ entities: {}, links: {}, phaseEvents: [] })
    const meeting = activity('meet', 'Möte', at('2024-05-01T10:00'))
    const cecilia = person('cecilia', { personE2: 'Cecilia', personE3: 'Ek' })
    useMainStore.getState().addEntity(meeting, cecilia)
    useMainStore.getState().addLink(link('l1', 'relation', meeting, cecilia))
    useAnalysisStore.getState().open('timeline')
    const screen = await render(<AnalysisView />)

    await expect.element((await warnings(screen, '1 warning')).getByText(/1 link to the events is of another link type/)).toBeInTheDocument()
    // The name of the field also has the option that is chosen in it
    await screen.getByLabelText(/^Linked by/).selectOptions('All link types')
    await expect.element(screen.getByRole('button', { name: 'Remove Cecilia Ek' })).toBeInTheDocument()
    // The phase analysis keeps its own
    expect(useAnalysisStore.getState().getSetup().LinkTypeId).toBe('LT6')
  })
})
