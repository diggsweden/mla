// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import '../../i18n'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import React from 'react'
import DateField from './DateField'

describe('a field of a date', () => {
  test('is empty without the format of the browser, until it has the focus', async () => {
    const screen = await render(<DateField name="Born" label={false} value="" onChange={() => {}} />)
    const field = screen.getByLabelText('Born')
    await expect.element(field).toHaveAttribute('data-empty', 'true')
    expect(screen.getByRole('button', { name: 'Clear Born' }).elements()).toHaveLength(0)
  })

  test('says that a half typed date is wrong, and is valid again when it is emptied', async () => {
    const validity: boolean[] = []
    const screen = await render(<DateField name="Born" label={false} value="" onChange={() => {}} onValidity={(valid) => { validity.push(valid) }} />)
    const field = screen.getByLabelText('Born')
    await field.click()
    await userEvent.keyboard('12')
    await userEvent.tab()
    await expect.element(screen.getByText('Does not have the format that is needed')).toBeVisible()
    await expect.element(field).toHaveAttribute('aria-invalid', 'true')
    expect(validity.at(-1)).toBe(false)

    await screen.getByRole('button', { name: 'Clear Born' }).click()
    expect(screen.getByText('Does not have the format that is needed').elements()).toHaveLength(0)
    expect(validity.at(-1)).toBe(true)
  })

  test('cannot be emptied with the button when it must be filled in', async () => {
    const screen = await render(<DateField name="Born" label={false} required value="1980-05-17" onChange={() => {}} />)
    await expect.element(screen.getByLabelText('Born')).toHaveValue('1980-05-17')
    expect(screen.getByRole('button', { name: 'Clear Born' }).elements()).toHaveLength(0)
  })
})
