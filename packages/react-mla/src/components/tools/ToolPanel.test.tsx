// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import React from 'react'
import Property from '../common/Property'
import ItemResultList from '../result/ItemResultList'
import ToolPanel from './ToolPanel'
import ExploreTool from './ExploreTool'
import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'
import useSearchStore from '../../store/search-state'
import { initServices, person } from '../../test-utils/setup'
import type { IPropertyConfiguration } from '../../interfaces/configuration'
import queryService from '../../services/queryService'

// The test configuration is in English, and has the search Sök person with Personnummer, which takes only digits
beforeAll(async () => {
  await initServices()
})

beforeEach(() => {
  useMainStore.setState({ entities: {}, links: {} })
})

afterEach(() => {
  useAppStore.getState().setTool(undefined)
  vi.restoreAllMocks()
})

const digits: IPropertyConfiguration = { TypeId: 'nr', Name: 'Number', Description: '', FieldType: 'String', FieldValidation: '[0-9]+' }

describe('a field with a format', () => {
  test('tells what is wrong below it, with the text of the configuration', async () => {
    const screen = await render(<Property config={{ ...digits, FieldValidationMessage: 'Only digits' }} value="12-3" />)
    await expect.element(screen.getByText('Only digits')).toBeInTheDocument()
    await expect.element(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  test('has a general text when the configuration has none, as configurations from before have', async () => {
    const screen = await render(<Property config={digits} value="12-3" />)
    await expect.element(screen.getByText('Does not have the format that is needed')).toBeInTheDocument()
  })

  test('says nothing when it is empty or right', async () => {
    const screen = await render(<><Property config={digits} value="" /><Property config={{ ...digits, TypeId: 'other' }} value="123" /></>)
    await expect.element(screen.getByRole('textbox').first()).toBeInTheDocument()
    expect(screen.getByText('Does not have the format that is needed').elements()).toHaveLength(0)
  })
})

describe('the search', () => {
  test('cannot be done while a field is wrong, and says which', async () => {
    useSearchStore.getState().setSearchTool('ST1')
    const screen = await render(<ToolPanel />)
    await expect.element(screen.getByText('Sök person')).toBeInTheDocument()
    await screen.getByLabelText('Personnummer').fill('1983-11')
    await expect.element(screen.getByRole('button', { name: 'Search' })).toBeDisabled()
    await expect.element(screen.getByText('Correct Personnummer to search')).toBeInTheDocument()
  })

  test('that fails is told in the panel instead of a box of the browser', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    useSearchStore.setState({ searchTool: { Id: 'missing', Name: 'Missing', Description: '', Parameters: {} } })
    const result = await useSearchStore.getState().search({ Params: [] })
    expect(alert).not.toHaveBeenCalled()
    expect(result.ErrorMessage).toMatch(/missing/)
    expect(useSearchStore.getState().result?.ErrorMessage).toMatch(/missing/)
  })
})

describe('the results', () => {
  test('are counted, can be added one by one or all, and a failure can be tried again', async () => {
    const anna = person('anna', { personE2: 'Anna' }, { LabelShort: 'Anna Berg' })
    const bo = person('bo', { personE2: 'Bo' }, { LabelShort: 'Bo Lind' })
    const retry = vi.fn()
    const screen = await render(<ItemResultList result={{ Entities: [anna, bo], Links: [], Events: [] }} />)
    await expect.element(screen.getByText('2 hits')).toBeInTheDocument()
    await expect.element(screen.getByRole('button', { name: 'Add all' })).toBeInTheDocument()
    await expect.element(screen.getByRole('button', { name: 'Add Anna Berg to the chart' })).toBeInTheDocument()
    await screen.unmount()

    // A service that failed and found nothing can be asked again
    const failed = await render(<ItemResultList result={{ Entities: [], Links: [], Events: [], ErrorMessage: '503 Service Unavailable' }} onRetry={retry} />)
    await expect.element(failed.getByRole('alert').getByText('503 Service Unavailable')).toBeInTheDocument()
    await failed.getByRole('button', { name: 'Try again' }).click()
    expect(retry).toHaveBeenCalled()
  })

  test('with a message of the service tell it as a message, not as an error', async () => {
    const anna = person('anna', { personE2: 'Anna' }, { LabelShort: 'Anna Berg' })
    const screen = await render(<ItemResultList result={{ Entities: [anna], Links: [], Events: [], ErrorMessage: 'All the data is made up' }} />)
    await expect.element(screen.getByText('Message from the service')).toBeInTheDocument()
    expect(screen.getByRole('alert').elements()).toHaveLength(0)
  })

  test('that are all added keep the message of the service as a message, and say that all is added', async () => {
    const anna = person('anna', { personE2: 'Anna' }, { LabelShort: 'Anna Berg' })
    const screen = await render(<ItemResultList result={{ Entities: [anna], Links: [], Events: [], ErrorMessage: 'All the data is made up' }} />)
    await screen.getByRole('button', { name: 'Add Anna Berg to the chart' }).click()
    await expect.element(screen.getByText('All the hits are added to the chart.')).toBeInTheDocument()
    await expect.element(screen.getByText('Message from the service')).toBeInTheDocument()
    expect(screen.getByRole('alert').elements()).toHaveLength(0)
  })

  test('that are none say so', async () => {
    const screen = await render(<ItemResultList result={{ Entities: [], Links: [], Events: [] }} />)
    await expect.element(screen.getByText('No hits')).toBeInTheDocument()
  })
})

describe('a fetch', () => {
  test('is for the selected of the types the service takes, and not for all that is selected', async () => {
    useMainStore.getState().addEntity(
      person('anna', { personE2: 'Anna' }, { LabelShort: 'Anna Berg' }),
      person('home', {}, { TypeId: 'adress', LabelShort: 'Storgatan 1' })
    )
    useMainStore.getState().setSelected(['annaperson', 'homeadress'])
    useSearchStore.setState({
      exploreTool: { Id: 'engagements', Name: 'Engagements', Description: '', Parameters: { EntityTypes: [{ TypeId: 'person', Min: 1 }] } },
      loading: false,
      result: { Entities: [], Links: [], Events: [] }
    })
    const screen = await render(<ExploreTool />)
    await expect.element(screen.getByText('Fetching for 1 selected')).toBeInTheDocument()
    // The name is made from the properties when the entity is added
    await expect.element(screen.getByText('Anna', { exact: true })).toBeInTheDocument()
    expect(screen.getByText(/Storgatan/).elements()).toHaveLength(0)
  })

  test('sends the service only the selected of the types it takes', async () => {
    const query = vi.spyOn(queryService, 'queryEntities').mockResolvedValue({ Entities: [], Links: [], Events: [] })
    useMainStore.getState().addEntity(
      person('anna', { personE2: 'Anna' }),
      person('firm', {}, { TypeId: 'organisation' })
    )
    useMainStore.getState().setSelected(['annaperson', 'firmorganisation'])
    useSearchStore.setState({ exploreTool: { Id: 'engagements', Name: 'Engagements', Description: '', Parameters: { EntityTypes: [{ TypeId: 'person', Min: 1 }] } } })
    await useSearchStore.getState().explore()
    expect(query).toHaveBeenCalledOnce()
    expect(query.mock.calls[0][1]?.map(e => e.TypeId)).toEqual(['person'])
  })
})
