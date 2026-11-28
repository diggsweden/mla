// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import React from 'react'
import ContextMenu from './ContextMenu'
import EntityMaker from '../modal/EntityMaker'
import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'
import useSearchStore from '../../store/search-state'
import { initServices, person } from '../../test-utils/setup'
import type { ILink } from '../../interfaces/data-models'

// The test configuration is in English. It has no services that fetch, so two are added: one for up to three persons,
// and one for a person or a company, one at a time
beforeAll(async () => {
  await initServices(config => {
    const integrations = config.Integrations as { Search: unknown[] }
    integrations.Search.push(
      { Id: 'engagements', Name: 'Engagements', Description: 'The engagements of persons', Icon: 'corporate_fare', Parameters: { EntityTypes: [{ TypeId: 'person', Min: 1, Max: 3 }] } },
      { Id: 'accounts', Name: 'Accounts', Description: 'The accounts of a person or a company', Icon: 'account_balance', Parameters: { EntityConfiguration: 'OR', EntityTypes: [{ TypeId: 'organisation', Min: 1, Max: 1 }, { TypeId: 'person', Min: 1, Max: 1 }] } }
    )
  })
})

afterAll(async () => {
  await initServices()
})

const relation: ILink = {
  Id: 'r1', TypeId: 'relation', FromEntityId: 'anna', FromEntityTypeId: 'person', ToEntityId: 'bo', ToEntityTypeId: 'person', Direction: 'TO', Properties: []
} as unknown as ILink

beforeEach(() => {
  useMainStore.setState({ entities: {}, links: {} })
  useAppStore.setState({ linkTool: false, linkFrom: undefined, drawnLink: undefined, entityRequest: undefined, propertiesClosed: false, selectedGeoFeature: undefined })
  useMainStore.getState().addEntity(
    person('anna', { personE2: 'Anna' }, { LabelChart: 'Anna' }),
    person('bo', { personE2: 'Bo' }, { LabelChart: 'Bo' }),
    person('acme', {}, { TypeId: 'organisation', LabelChart: 'Acme' })
  )
  useMainStore.getState().addLink(relation)
  useMainStore.getState().setSelected([])
})

async function open (selected: string[]) {
  useMainStore.getState().setSelected(selected)
  const props = { copy: vi.fn(), paste: vi.fn(), delete: vi.fn() }
  const screen = await render(<ContextMenu {...props} />)
  useAppStore.getState().showContextMenu(100, 100, { x: 40, y: 60 })
  await expect.element(screen.getByRole('menu')).toBeVisible()
  return { screen, props }
}

describe('the menu of one entity', () => {
  test('says what it is for, fetches with the services that take it, and starts a relation from it', async () => {
    const { screen } = await open(['annaperson'])
    await expect.element(screen.getByRole('menu').getByText('Anna', { exact: true })).toBeVisible()
    await expect.element(screen.getByRole('menuitem', { name: /Engagements/ })).toBeVisible()
    await expect.element(screen.getByRole('menuitem', { name: /Accounts/ })).not.toHaveAttribute('aria-disabled')

    await screen.getByRole('menuitem', { name: 'Draw relation from here' }).click()
    expect(useAppStore.getState().linkTool).toBe(true)
    expect(useAppStore.getState().linkFrom).toBe('annaperson')
    expect(useMainStore.getState().selectedIds).toEqual([])
    expect(useAppStore.getState().contextmenuPosition).toBeUndefined()
  })

  test('copies and deletes what is selected, and opens the panel of properties', async () => {
    useAppStore.setState({ propertiesClosed: true })
    const { screen, props } = await open(['annaperson'])
    await screen.getByRole('menuitem', { name: 'Properties' }).click()
    expect(useAppStore.getState().propertiesClosed).toBe(false)

    useAppStore.getState().showContextMenu(100, 100)
    await screen.getByRole('menuitem', { name: /^Delete/ }).click()
    expect(props.delete).toHaveBeenCalled()
  })
})

describe('the menu of several selected', () => {
  test('counts them, and says why a service cannot be used instead of leaving it out', async () => {
    const { screen } = await open(['annaperson', 'boperson', 'acmeorganisation'])
    await expect.element(screen.getByRole('menu').getByText('3 selected')).toBeVisible()
    await expect.element(screen.getByRole('menuitem', { name: /Engagements/ }).getByText('2', { exact: true })).toBeVisible()

    const accounts = screen.getByRole('menuitem', { name: /Accounts/ })
    await expect.element(accounts).toHaveAttribute('aria-disabled', 'true')
    await expect.element(accounts.getByText('One of Bolag or Person at a time')).toBeVisible()
    const explore = vi.spyOn(useSearchStore.getState(), 'explore')
    // A click on it, which the browser of the test will not make on what is marked as not usable
    ;(accounts.element() as HTMLElement).click()
    expect(explore).not.toHaveBeenCalled()
    await expect.element(screen.getByRole('menu')).toBeVisible()
  })

  test('makes a relation between two, and not between three', async () => {
    const { screen } = await open(['annaperson', 'boperson', 'acmeorganisation'])
    await expect.element(screen.getByRole('menuitem', { name: /New relation/ })).toHaveAttribute('aria-disabled', 'true')

    useMainStore.getState().setSelected(['annaperson', 'boperson'])
    await screen.getByRole('menuitem', { name: /New relation/ }).click()
    expect(useAppStore.getState().drawnLink).toMatchObject({ from: 'annaperson', to: 'boperson' })
  })
})

describe('the menu of a relation', () => {
  test('turns it, and selects the entities it is between', async () => {
    const { screen } = await open(['r1relation'])
    await screen.getByRole('radio', { name: 'Toward Anna' }).click()
    expect(useMainStore.getState().getCurrentLink('r1relation')?.Direction).toBe('FROM')

    await screen.getByRole('menuitem', { name: 'Select the ends' }).click()
    expect(useMainStore.getState().selectedIds.sort()).toEqual(['annaperson', 'boperson', 'r1relation'])
  })
})

describe('the style of the line of a relation', () => {
  test('is chosen in a menu of its own', async () => {
    const { screen } = await open(['r1relation'])
    await screen.getByRole('menuitem', { name: 'Line type' }).click()
    await screen.getByRole('menuitem', { name: 'Dashed' }).click()
    expect(useMainStore.getState().getCurrentLink('r1relation')?.Style).toBe('DASHED')
    expect(useAppStore.getState().contextmenuPosition).toBeUndefined()
  })
})

describe('the menu of the empty chart', () => {
  test('opens the dialog of the type, and makes the entity where the menu was opened', async () => {
    const { screen } = await open([])
    await screen.getByRole('menuitem', { name: 'Bolag' }).click()
    expect(useAppStore.getState().entityRequest).toMatchObject({ typeId: 'organisation', position: { x: 40, y: 60 } })
    // Nothing is made until the dialog is saved
    const made = () => Object.values(useMainStore.getState().entities).map(e => e[0]).find(e => e.TypeId === 'organisation' && e.Id !== 'acme')
    expect(made()).toBeUndefined()

    const dialog = await render(<EntityMaker />)
    await dialog.getByRole('button', { name: 'Create bolag' }).click()
    expect(made()).toMatchObject({ PosX: 40, PosY: 60 })
    expect(useAppStore.getState().entityRequest).toBeUndefined()
  })

  test('is used with the keys: up and down between the choices, and Escape closes it', async () => {
    await open([])
    await expect.element(document.activeElement as HTMLElement).toHaveTextContent('Person')
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement?.textContent).toContain('Bolag')
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    expect(document.activeElement?.textContent).toContain('Show all')
    await userEvent.keyboard('{Escape}')
    expect(useAppStore.getState().contextmenuPosition).toBeUndefined()
  })
})
