// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, expect, test } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { page } from 'vitest/browser'
import React from 'react'
import { MLA } from '../../MLA'
import useAnalysisStore from '../../store/analysis-store'
import useAppStore from '../../store/app-store'
import * as config from '../../../../../tools/test/default.json'

afterEach(() => {
  cleanup()
  useAnalysisStore.getState().close()
})

test('another tab shows the chart again, and the analysis tab itself keeps the view open', async () => {
  render(<MLA config={JSON.stringify(config)} />)
  const analysis = page.getByText('Analysis', { exact: true })
  await expect.element(analysis).toBeInTheDocument()
  await analysis.click()
  useAnalysisStore.getState().open('phase')

  await analysis.click()
  expect(useAnalysisStore.getState().view).toBe('phase')

  await page.getByText('Start', { exact: true }).click()
  expect(useAnalysisStore.getState().view).toBeUndefined()
  expect(useAppStore.getState().selectedTab).toBe('start')
})
