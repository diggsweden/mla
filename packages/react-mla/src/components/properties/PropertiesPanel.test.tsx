// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import React from 'react'
import { DateTime } from 'luxon'
import PropertiesPanel from './PropertiesPanel'
import useMainStore from '../../store/main-store'
import useAppStore from '../../store/app-store'
import { initServices, person } from '../../test-utils/setup'

// The test configuration is in English, and the names of its fields are in Swedish
beforeAll(async () => {
  await initServices()
})

beforeEach(() => {
  useMainStore.setState({ entities: {}, links: {} })
  useAppStore.setState({ propertiesPinned: false, propertiesClosed: false, focusedId: undefined })
  useMainStore.getState().addEntity(
    person('anna', { personE2: 'Anna', personE3: 'Berg' }),
    person('bo', { personE2: 'Bo', personE3: 'Lind' })
  )
  // What is added is selected, and the tests start with nothing selected
  useMainStore.getState().setSelected([])
})

// Fastening the panel is kept on the computer, and the other tests start from a panel that is not
afterEach(() => {
  window.localStorage.removeItem('mla.properties.pinned')
  useAppStore.setState({ propertiesPinned: false, propertiesClosed: false, focusedId: undefined })
})

describe('the panel of properties', () => {
  test('shows who is selected in its heading', async () => {
    const screen = await render(<PropertiesPanel />)
    useMainStore.getState().setSelected(['annaperson'])
    await expect.element(screen.getByText('Anna Berg', { exact: true })).toBeInTheDocument()
    await expect.element(screen.getByRole('textbox', { name: 'Förnamn' })).toHaveValue('Anna')
  })

  test('lists those selected when more are, opens one, steps between them and goes back', async () => {
    const screen = await render(<PropertiesPanel />)
    useMainStore.getState().setSelected(['annaperson', 'boperson'])
    const list = screen.getByRole('list', { name: '2 selected' })
    await expect.element(list).toBeInTheDocument()
    expect(list.getByRole('button').elements()).toHaveLength(2)

    await screen.getByRole('button', { name: /^Bo Lind/ }).click()
    await expect.element(screen.getByText('2 of 2')).toBeInTheDocument()
    // The chart shows which of the selected it is
    expect(useAppStore.getState().focusedId).toBe('boperson')

    await screen.getByRole('button', { name: 'Next' }).click()
    await expect.element(screen.getByText('1 of 2')).toBeInTheDocument()
    await expect.element(screen.getByRole('textbox', { name: 'Förnamn' })).toHaveValue('Anna')

    await screen.getByRole('button', { name: '2 selected' }).click()
    await expect.element(screen.getByRole('list', { name: '2 selected' })).toBeInTheDocument()
  })

  test('when fastened, stays with a word on what to do when nothing is selected', async () => {
    const screen = await render(<PropertiesPanel />)
    await screen.getByRole('button', { name: 'Pin the panel' }).click()
    expect(useAppStore.getState().propertiesPinned).toBe(true)
    await expect.element(screen.getByText('Nothing is selected')).toBeInTheDocument()
    await expect.element(screen.getByText('2 entities · 0 relations')).toBeInTheDocument()
  })

  test('when closed, opens again with the next selection', async () => {
    const screen = await render(<PropertiesPanel />)
    useMainStore.getState().setSelected(['annaperson'])
    await screen.getByRole('button', { name: 'Close the panel' }).click()
    expect(useAppStore.getState().propertiesClosed).toBe(true)
    useMainStore.getState().setSelected(['boperson'])
    await expect.poll(() => useAppStore.getState().propertiesClosed).toBe(false)
  })

  test('when closed, stays closed after a click on the chart that selects nothing, also when it is fastened', async () => {
    useAppStore.setState({ propertiesPinned: true })
    const screen = await render(<PropertiesPanel />)
    useMainStore.getState().setSelected(['annaperson'])
    await screen.getByRole('button', { name: 'Close the panel' }).click()
    useMainStore.getState().setSelected([])
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(useAppStore.getState().propertiesClosed).toBe(true)
  })

  test('tells when an older version is shown, and what the latest has in its fields', async () => {
    const day = (iso: string) => DateTime.fromISO(iso)
    useMainStore.setState({ entities: {}, links: {} })
    useMainStore.getState().addEntity(
      person('sara', { personE2: 'Sara', personE3: 'Lind' }, { InternalId: 'v1', DateFrom: day('2024-01-01T00:00'), DateTo: day('2024-12-31T23:59') }),
      person('sara', { personE2: 'Sara', personE3: 'Holm' }, { InternalId: 'v2', DateFrom: day('2025-01-01T00:00') })
    )
    useMainStore.getState().setSelected([])
    const screen = await render(<PropertiesPanel />)
    useMainStore.getState().setDateAndTime(day('2024-06-01T12:00'))
    useMainStore.getState().setSelected(['saraperson'])

    await expect.element(screen.getByText(/not the latest version/)).toBeInTheDocument()
    await expect.element(screen.getByText('Later: Holm')).toBeInTheDocument()
    await screen.getByRole('button', { name: 'To latest' }).click()
    await expect.element(screen.getByRole('textbox', { name: 'Efternamn' })).toHaveValue('Holm')
  })
})
