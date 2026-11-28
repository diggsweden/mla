// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import React from 'react'
import AnalysisTabPanel from './AnalysisTabPanel'
import useAppStore from '../../../store/app-store'
import useAnalysisStore from '../../../store/analysis-store'
import { initServices } from '../../../test-utils/setup'

// The test configuration is in English
beforeAll(async () => {
  await initServices()
})

beforeEach(() => {
  useAppStore.getState().setHistoryMode(false)
  useAnalysisStore.getState().close()
})

afterEach(() => {
  useAppStore.getState().setHistoryMode(false)
  useAnalysisStore.getState().close()
})

describe('the time line, the phase analysis and the event flow', () => {
  test('are shown one at a time: a view closes the time line', async () => {
    const screen = await render(<AnalysisTabPanel />)
    await screen.getByRole('button', { name: 'Timeline' }).click()
    expect(useAppStore.getState().historyMode).toBe(true)

    await screen.getByRole('button', { name: 'Phase analysis' }).click()
    expect(useAnalysisStore.getState().view).toBe('phase')
    expect(useAppStore.getState().historyMode).toBe(false)
    expect(useAppStore.getState().selectedTool).toBeUndefined()

    await screen.getByRole('button', { name: 'Event flow' }).click()
    expect(useAnalysisStore.getState().view).toBe('timeline')
    expect(useAppStore.getState().historyMode).toBe(false)
  })

  test('and the time line closes a view', async () => {
    const screen = await render(<AnalysisTabPanel />)
    await screen.getByRole('button', { name: 'Event flow' }).click()
    await screen.getByRole('button', { name: 'Timeline' }).click()
    expect(useAnalysisStore.getState().view).toBeUndefined()
    expect(useAppStore.getState().historyMode).toBe(true)
    expect(useAppStore.getState().selectedTool).toBe('activity')

    // Closing the time line again leaves the views closed
    await screen.getByRole('button', { name: 'Timeline' }).click()
    expect(useAppStore.getState().historyMode).toBe(false)
    expect(useAnalysisStore.getState().view).toBeUndefined()
  })
})
