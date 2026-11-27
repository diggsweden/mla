// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import React from 'react'
import CreateToolbox from './CreateToolbox'
import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'
import { initServices, person } from '../../../test-utils/setup'

// The test configuration is in English, and the names of its types of relation are in Swedish
beforeAll(async () => {
  await initServices()
})

afterAll(async () => {
  await initServices()
})

beforeEach(() => {
  useMainStore.setState({ entities: {}, links: {} })
  useAppStore.setState({ linkTool: false, drawnLink: undefined })
  useMainStore.getState().addEntity(
    person('anna', { personE2: 'Anna' }),
    person('bo', { personE2: 'Bo' }),
    person('mote', {}, { TypeId: 'handelse' })
  )
})

const linkTypes = () => Object.values(useMainStore.getState().links).map(v => v[0].TypeId)

describe('the button to draw a relation', () => {
  test('can always be chosen, turns the tool on and off, and unselects what was selected', async () => {
    const screen = await render(<CreateToolbox />)
    useMainStore.getState().setSelected(['annaperson'])
    useMainStore.getState().setSelectedShapeIds(['shape'])
    const button = screen.getByRole('button', { name: 'Draw relation' })
    await expect.element(button).toBeEnabled()
    await button.click()
    expect(useAppStore.getState().linkTool).toBe(true)
    // What was selected is not selected any more
    expect(useMainStore.getState().selectedIds).toEqual([])
    expect(useMainStore.getState().selectedShapeIds).toEqual([])
    await button.click()
    expect(useAppStore.getState().linkTool).toBe(false)
  })
})

describe('a relation drawn between two entities', () => {
  test('opens the dialog with who it is between and the types of relation there can be, and makes the one chosen', async () => {
    const screen = await render(<CreateToolbox />)
    useAppStore.getState().setDrawnLink({ from: 'annaperson', to: 'motehandelse' })

    await expect.element(screen.getByRole('heading', { name: 'New relation' })).toBeInTheDocument()
    await expect.element(screen.getByRole('region', { name: 'Between' }).getByText('Anna', { exact: true })).toBeInTheDocument()
    const types = screen.getByRole('radio', { name: /^(Händelserelation|Relation)/ })
    expect(types.elements()).toHaveLength(2)
    await expect.element(screen.getByRole('radio', { name: /^Händelserelation/ })).toBeChecked()

    // The description of a field is shown below it
    await expect.element(screen.getByText('Beskriver vilken roll relationen har', { exact: true })).toBeInTheDocument()

    await screen.getByRole('radio', { name: /^Relation/ }).click()
    await screen.getByRole('button', { name: 'Create relation' }).click()
    expect(linkTypes()).toEqual(['relation'])
    // The drawn relation is handled, so the next one can be drawn
    expect(useAppStore.getState().drawnLink).toBeUndefined()
  })

  test('points to the entity it ended on, whichever way it is drawn, unless another direction is chosen', async () => {
    const link = () => Object.values(useMainStore.getState().links).map(v => v[0])[0]
    const pointsTo = () => (link().Direction === 'TO' ? link().ToEntityId : link().Direction === 'FROM' ? link().FromEntityId : link().Direction)
    const direction = (name: string | RegExp) => screen.getByRole('radiogroup', { name: 'Direction' }).getByRole('radio', { name })

    // The type of relation has the event as its start, also when it is drawn from the person
    const screen = await render(<CreateToolbox />)
    useAppStore.getState().setDrawnLink({ from: 'annaperson', to: 'motehandelse' })
    await expect.element(direction(/^Toward/).first()).toHaveAttribute('aria-checked', 'true')
    await screen.getByRole('button', { name: 'Create relation' }).click()
    expect(pointsTo()).toBe('mote')

    useMainStore.setState({ links: {} })
    useAppStore.getState().setDrawnLink({ from: 'motehandelse', to: 'annaperson' })
    await expect.element(direction('Toward Anna')).toHaveAttribute('aria-checked', 'true')
    await screen.getByRole('button', { name: 'Create relation' }).click()
    expect(pointsTo()).toBe('anna')

    useMainStore.setState({ links: {} })
    useAppStore.getState().setDrawnLink({ from: 'annaperson', to: 'motehandelse' })
    await direction('Both ways').click()
    // The direction is kept when another type of relation is chosen
    await screen.getByRole('radio', { name: /^Relation/ }).click()
    await screen.getByRole('button', { name: 'Create relation' }).click()
    expect(pointsTo()).toBe('BOTH')
  })

  test('between two of a kind has no choice of type when there is only one', async () => {
    const screen = await render(<CreateToolbox />)
    useAppStore.getState().setDrawnLink({ from: 'annaperson', to: 'boperson' })
    await expect.element(screen.getByRole('heading', { name: 'New relation' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Relation/ }).elements()).toHaveLength(0)
    await expect.element(screen.getByRole('region', { name: 'Between' }).getByText('Relation', { exact: true })).toBeInTheDocument()
  })

  test('that no type of relation can be between tells the user so, and makes nothing', async () => {
    await initServices(config => {
      const domain = config.Domain as { LinkTypes: Array<{ TypeId: string }> }
      domain.LinkTypes = domain.LinkTypes.filter(l => l.TypeId !== 'relation')
    })
    const screen = await render(<CreateToolbox />)
    useAppStore.getState().setDrawnLink({ from: 'annaperson', to: 'boperson' })
    await expect.element(screen.getByText('There is no type of relation between Person and Person.')).toBeInTheDocument()
    await screen.getByRole('button', { name: /ok/i }).click()
    expect(linkTypes()).toEqual([])
    await initServices()
  })
})

describe('the tool to draw a relation', () => {
  test('is turned off when a relation is made, and stays on when it is cancelled', async () => {
    const screen = await render(<CreateToolbox />)
    useAppStore.getState().setLinkTool(true)

    useAppStore.getState().setDrawnLink({ from: 'annaperson', to: 'motehandelse' })
    await screen.getByRole('button', { name: 'Cancel' }).click()
    expect(useAppStore.getState().linkTool).toBe(true)

    useAppStore.getState().setDrawnLink({ from: 'annaperson', to: 'motehandelse' })
    await screen.getByRole('button', { name: 'Create relation' }).click()
    expect(useAppStore.getState().linkTool).toBe(false)
  })
})

describe('a relation made with a button of its type', () => {
  test('opens the same dialog for the two chosen entities, and can always be cancelled', async () => {
    const screen = await render(<CreateToolbox />)
    useMainStore.getState().setSelected(['annaperson', 'motehandelse'])
    // The buttons of the types of relation can be chosen when two entities are
    const button = screen.getByRole('button', { name: 'Händelserelation' })
    await expect.element(button).toBeEnabled()
    // The ribbon has its layout from the style of the app, which the test does not load, so the button is clicked as it is
    ;(button.element() as HTMLButtonElement).click()
    await expect.element(screen.getByRole('heading', { name: 'New relation' })).toBeInTheDocument()
    await expect.element(screen.getByRole('radiogroup', { name: 'Direction' })).toBeInTheDocument()
    await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
    await screen.getByRole('button', { name: 'Cancel' }).click()
    expect(linkTypes()).toEqual([])
  })
})
