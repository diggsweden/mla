// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import React from 'react'
import { DateTime } from 'luxon'
import ActivityAnalysis from './ActivityAnalysis'
import useMainStore from '../../store/main-store'
import { initServices, person } from '../../test-utils/setup'
import type { IEntity, ILink } from '../../interfaces/data-models'

const config = { EntityTypeId: 'handelse', LinkTypeId: 'LT6', LinkPropertyId: 'LT6E1' }
const day = (d: string) => DateTime.fromISO(d + 'T12:00:00Z')

function activity (id: string, title: string, date: DateTime, extra: Partial<IEntity> = {}): IEntity {
  return person(id, { handelseE1: title, handelseE2: title }, { TypeId: 'handelse', DateFrom: date, DateTo: date, ...extra })
}

function link (id: string, typeId: string, from: IEntity, to: { Id: string, TypeId: string }, properties: Record<string, string> = {}): ILink {
  return {
    Id: id,
    TypeId: typeId,
    InternalId: undefined as unknown as string,
    LabelShort: '',
    LabelLong: '',
    LabelChart: '',
    SourceSystemId: 'test',
    Direction: 'TO',
    FromEntityId: from.Id,
    FromEntityTypeId: from.TypeId,
    ToEntityId: to.Id,
    ToEntityTypeId: to.TypeId,
    Properties: Object.entries(properties).map(([TypeId, Value]) => ({ TypeId, Value }))
  }
}

beforeAll(async () => {
  await initServices()
})

beforeEach(() => {
  useMainStore.setState({ entities: {}, links: {}, phaseEvents: [] })
})

function addPhase (description: string, date: DateTime) {
  useMainStore.getState().setPhaseEvent({ Id: description, Description: description, Date: date })
}

describe('the phase analysis', () => {
  test('shows the activities of a phase and the roles of the links of the configured type', async () => {
    const meeting = activity('a1', 'Meeting', day('2024-05-02'))
    const anna = person('p1', { personE2: 'Anna' })
    useMainStore.getState().addEntity(meeting, anna)
    useMainStore.getState().addLink(link('l1', 'LT6', meeting, anna, { LT6E1: 'Driver' }))
    addPhase('Planning', day('2024-05-01'))

    const screen = await render(<ActivityAnalysis config={config} />)
    await expect.element(screen.getByText('Planning')).toBeInTheDocument()
    await expect.element(screen.getByText('Meeting')).toBeInTheDocument()
    await expect.element(screen.getByText('Driver')).toBeInTheDocument()
  })

  test('does not crash when an activity also has a link of another type', async () => {
    const meeting = activity('a2', 'Meeting', day('2024-05-02'))
    const anna = person('p2', { personE2: 'Anna' })
    useMainStore.getState().addEntity(meeting, anna)
    useMainStore.getState().addLink(link('l2', 'relation', meeting, anna, { relationslank: 'Knows' }))
    addPhase('Planning', day('2024-05-01'))

    const screen = await render(<ActivityAnalysis config={config} />)
    await expect.element(screen.getByText('Planning')).toBeInTheDocument()
    await expect.element(screen.getByText('Meeting')).toBeInTheDocument()
  })

  test('does not crash when a link goes to an entity that is not in the chart', async () => {
    const meeting = activity('a3', 'Meeting', day('2024-05-02'))
    useMainStore.getState().addEntity(meeting)
    useMainStore.getState().addLink(link('l3', 'LT6', meeting, { Id: 'missing', TypeId: 'person' }, { LT6E1: 'Driver' }))
    addPhase('Planning', day('2024-05-01'))

    const screen = await render(<ActivityAnalysis config={config} />)
    await expect.element(screen.getByText('Planning')).toBeInTheDocument()
    await expect.element(screen.getByText('Meeting')).toBeInTheDocument()
  })

  test('shows an activity that only has a start date', async () => {
    const meeting = activity('a4', 'Meeting', day('2024-05-02'), { DateTo: undefined })
    useMainStore.getState().addEntity(meeting)
    addPhase('Planning', day('2024-05-01'))

    const screen = await render(<ActivityAnalysis config={config} />)
    await expect.element(screen.getByText('Planning')).toBeInTheDocument()
    await expect.element(screen.getByText('Meeting')).toBeInTheDocument()
  })
})
