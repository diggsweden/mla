// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { page } from 'vitest/browser'
import React from 'react'
import { MLA } from '../../../MLA'
import * as config from '../../../../../../tools/test/default.json'

type PickerWindow = Window & { showSaveFilePicker?: unknown }
const originalPicker = (window as PickerWindow).showSaveFilePicker

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  ;(window as PickerWindow).showSaveFilePicker = originalPicker
})

async function clickSave () {
  render(<MLA config={JSON.stringify(config)} />)
  const archiveTab = page.getByText('Archive', { exact: true })
  await expect.element(archiveTab).toBeInTheDocument()
  await archiveTab.click()
  const saveButton = page.getByRole('button', { name: 'Save' })
  await expect.element(saveButton).toBeInTheDocument()
  await saveButton.click()
}

function mockPicker (error: DOMException) {
  const picker = vi.fn().mockRejectedValue(error)
  ;(window as PickerWindow).showSaveFilePicker = picker
  return picker
}

function spyOnDownload () {
  return vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
}

test('the file is downloaded when the browser does not allow the save dialog', async () => {
  const picker = mockPicker(new DOMException('The request is not allowed by the user agent or the platform in the current context', 'NotAllowedError'))
  const download = spyOnDownload()

  await clickSave()

  await vi.waitFor(() => { expect(download).toHaveBeenCalledTimes(1) })
  expect(picker).toHaveBeenCalledTimes(1)
  const link = download.mock.contexts[0] as HTMLAnchorElement
  expect(link.download).toBe('mla-project.json')
  expect(link.href.startsWith('blob:')).toBe(true)
})

test('nothing is downloaded when the user cancels the save dialog', async () => {
  const picker = mockPicker(new DOMException('The user aborted a request.', 'AbortError'))
  const download = spyOnDownload()

  await clickSave()

  await vi.waitFor(() => { expect(picker).toHaveBeenCalledTimes(1) })
  await new Promise(resolve => setTimeout(resolve, 200))
  expect(download).not.toHaveBeenCalled()
})
