// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import React from 'react'
import { Settings } from 'luxon'
import { userEvent } from 'vitest/browser'
import PhaseDialog from './PhaseDialog'
import useMainStore from '../../store/main-store'
import { initServices } from '../../test-utils/setup'
import { at } from '../../test-utils/analysis'
import { phaseStyle, textColorOn } from '../../utils/color'

const originalZone = Settings.defaultZone
let closed = 0

// The test configuration is in English, and has the template Brottsskript (Cornish)
beforeAll(async () => {
  await initServices()
})

beforeEach(() => {
  closed = 0
  useMainStore.setState({ phaseEvents: [] })
  useMainStore.getState().setPhaseEvent({ Id: 'p1', Description: 'Planering', Date: at('2024-05-01T00:00') })
  useMainStore.getState().setPhaseEvent({ Id: 'p2', Description: 'Genomförande', Date: at('2024-05-04T00:00') })
})

afterEach(() => {
  Settings.defaultZone = originalZone
})

const show = async (focusId?: string) => render(<PhaseDialog focusId={focusId} onClose={() => { closed++ }} />)
const phases = () => useMainStore.getState().phaseEvents.map(p => [p.Description, p.Date.toISODate(), p.Color])

// Sets the value of a date input as the browser does when a date is picked, so that React sees the change
function pickDate (input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('the phase dialog', () => {
  test('lists the phases of the chart in order of time', async () => {
    const screen = await show()
    const names = screen.getByRole('region', { name: 'Phases' }).getByRole('textbox', { name: 'Description' })
    expect(names.elements().map(e => (e as HTMLInputElement).value)).toEqual(['Planering', 'Genomförande'])
  })

  test('renames, moves and deletes phases, but only when it is saved', async () => {
    const screen = await show()
    await screen.getByRole('textbox', { name: 'Description' }).first().fill('Förberedelse')
    pickDate(screen.getByLabelText('Starts, Genomförande').element() as HTMLInputElement, '2024-05-06')
    await screen.getByRole('button', { name: 'Delete the phase Förberedelse' }).click()
    expect(phases()).toEqual([['Planering', '2024-05-01', undefined], ['Genomförande', '2024-05-04', undefined]])

    await screen.getByRole('button', { name: 'Save' }).click()
    expect(phases()).toEqual([['Genomförande', '2024-05-06', undefined]])
    expect(closed).toBe(1)
  })

  test('changes nothing when it is cancelled', async () => {
    const screen = await show()
    await screen.getByRole('button', { name: 'Delete the phase Planering' }).click()
    await screen.getByRole('button', { name: 'Close' }).click()
    expect(phases()).toHaveLength(2)
    expect(closed).toBe(1)
  })

  test('adds a phase with Enter, and the next one starts the day after', async () => {
    const screen = await show()
    const name = screen.getByRole('textbox', { name: 'Name of the phase' })
    pickDate(screen.getByLabelText('Starts', { exact: true }).element() as HTMLInputElement, '2024-05-08')
    await name.fill('Flykt')
    await name.click()
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => (screen.getByLabelText('Starts', { exact: true }).element() as HTMLInputElement).value).toBe('2024-05-09')
    // Still open, so that more can be added
    expect(closed).toBe(0)

    await screen.getByRole('button', { name: 'Save' }).click()
    expect(phases().map(p => p[0])).toEqual(['Planering', 'Genomförande', 'Flykt'])
  })

  test('adds what is written in the form when it is saved, as the old dialog did', async () => {
    const screen = await show()
    pickDate(screen.getByLabelText('Starts', { exact: true }).element() as HTMLInputElement, '2024-05-02')
    await screen.getByRole('textbox', { name: 'Name of the phase' }).fill('Rekognosering')
    await screen.getByRole('button', { name: 'Save' }).click()
    expect(phases().map(p => p[0])).toEqual(['Planering', 'Rekognosering', 'Genomförande'])
  })

  test('adds all the phases of a template, one day apart', async () => {
    useMainStore.setState({ phaseEvents: [] })
    const screen = await show()
    await screen.getByRole('combobox').selectOptions('Brottsskript (Cornish)')
    pickDate(screen.getByLabelText('First phase starts').element() as HTMLInputElement, '2024-05-01')
    await screen.getByRole('button', { name: 'Add', exact: true }).click()
    await screen.getByRole('button', { name: 'Save' }).click()
    expect(phases()).toHaveLength(9)
    expect(phases()[1][1]).toBe('2024-05-02')
  })

  test('gives a phase a color from the theme or the standard colors, and can reset it', async () => {
    const screen = await show()
    await screen.getByRole('button', { name: 'Color of Planering' }).click()
    // The swatches have their size from the style of the app, which the test does not load
    ;(screen.getByTitle('Red', { exact: true }).element() as HTMLElement).click()
    await screen.getByRole('button', { name: 'Color of Genomförande' }).click()
    // The swatches have their size from the style of the app, which the test does not load
    ;(screen.getByTitle('Yellow', { exact: true }).element() as HTMLElement).click()
    await screen.getByRole('button', { name: 'Save' }).click()
    expect(phases().map(p => p[2])).toEqual(['#FF4040', '#FFD700'])

    await screen.unmount()
    const again = await show()
    await again.getByRole('button', { name: 'Color of Planering' }).click()
    await again.getByText('Reset color').click()
    await again.getByRole('button', { name: 'Save' }).click()
    expect(phases().map(p => p[2])).toEqual([undefined, '#FFD700'])
  })

  test('can not be saved while a phase has no name', async () => {
    const screen = await show()
    await screen.getByRole('textbox', { name: 'Description' }).first().fill('')
    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  for (const zone of ['Europe/Stockholm', 'America/New_York', 'UTC']) {
    test(`keeps the date that is chosen, in the time zone ${zone}`, async () => {
      Settings.defaultZone = zone
      useMainStore.setState({ phaseEvents: [] })
      const screen = await show()
      const date = screen.getByLabelText('Starts', { exact: true }).element() as HTMLInputElement
      pickDate(date, '2024-05-01')
      await expect.poll(() => date.value).toBe('2024-05-01')
      await screen.getByRole('textbox', { name: 'Name of the phase' }).fill('Planering')
      await screen.getByRole('button', { name: 'Save' }).click()
      expect(phases()).toEqual([['Planering', '2024-05-01', undefined]])
    })
  }
})

describe('the color of the text on a phase', () => {
  test('is white on dark colors and dark on light ones', () => {
    expect(textColorOn('#446995')).toBe('#ffffff')
    expect(textColorOn('rgb(68, 105, 149)')).toBe('#ffffff')
    expect(textColorOn('#FFD700')).toBe('#111827')
    expect(textColorOn('#fff')).toBe('#111827')
  })

  test('is read as the softened color looks over white, so a dark color that is softened gets dark text', () => {
    expect(textColorOn('#cc3300')).toBe('#ffffff')
    expect(textColorOn('#cc3300', 0.5)).toBe('#111827')
    expect(phaseStyle('#cc3300')).toEqual({ background: 'rgb(250, 235, 230)', color: '#111827' })
    expect(phaseStyle('#000000')).toEqual({ background: 'rgb(230, 230, 230)', color: '#111827' })
  })
})

describe('the color of a phase in the project file', () => {
  test('is saved and read back, and a file without it is read as before', () => {
    useMainStore.getState().setPhaseEvent({ Id: 'p1', Description: 'Planering', Date: at('2024-05-01T00:00'), Color: '#FF4040' })
    const json = useMainStore.getState().save()
    useMainStore.setState({ phaseEvents: [] })
    useMainStore.getState().open(json)
    expect(phases()).toEqual([['Planering', '2024-05-01', '#FF4040'], ['Genomförande', '2024-05-04', undefined]])
  })
})
