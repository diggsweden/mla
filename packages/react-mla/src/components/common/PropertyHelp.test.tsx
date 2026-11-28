// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import '../../i18n'
import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import React from 'react'
import Property from './Property'
import type { IPropertyConfiguration } from '../../interfaces/configuration'

const source: IPropertyConfiguration = {
  TypeId: 'source',
  Name: 'Source',
  Description: 'Where the information comes from, like a hearing',
  FieldType: 'String'
}

describe('the explanation of a field', () => {
  test('is opened and closed with its button, and describes the field also when it is hidden', async () => {
    const screen = await render(<Property config={source} />)
    const help = screen.getByText('Where the information comes from, like a hearing')
    await expect.element(help).not.toBeVisible()
    await expect.element(screen.getByLabelText('Source', { exact: true })).toHaveAccessibleDescription('Where the information comes from, like a hearing')

    const button = screen.getByRole('button', { name: 'Explanation of Source' })
    await button.click()
    await expect.element(help).toBeVisible()
    await expect.element(button).toHaveAttribute('aria-expanded', 'true')
    await button.click()
    await expect.element(help).not.toBeVisible()
  })

  test('is shown from the start when asked, and follows when that changes', async () => {
    const screen = await render(<Property config={source} helpOpen />)
    const help = screen.getByText('Where the information comes from, like a hearing')
    await expect.element(help).toBeVisible()

    await screen.rerender(<Property config={source} helpOpen={false} />)
    await expect.element(help).not.toBeVisible()
  })

  test('has no button when it only says the name of the field again', async () => {
    const screen = await render(<Property config={{ ...source, Description: 'Source.' }} />)
    await expect.element(screen.getByLabelText('Source', { exact: true })).toBeVisible()
    expect(screen.getByRole('button').elements()).toHaveLength(0)
  })
})
