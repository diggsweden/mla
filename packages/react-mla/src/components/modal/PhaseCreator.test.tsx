// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import React from 'react'
import { Settings } from 'luxon'
import PhaseCreator from './PhaseCreator'
import type { IPhaseEvent } from '../../interfaces/data-models'
import '../../i18n'

const originalZone = Settings.defaultZone

afterEach(() => {
  Settings.defaultZone = originalZone
})

describe('the phase dialog', () => {
  for (const zone of ['Europe/Stockholm', 'America/New_York', 'UTC']) {
    test(`keeps the date that is chosen, in the time zone ${zone}`, async () => {
      Settings.defaultZone = zone
      const changes: IPhaseEvent[] = []
      const screen = await render(<PhaseCreator onChange={(e) => { changes.push(e) }} />)

      const date = screen.container.querySelector<HTMLInputElement>('input[type=date]')!
      // As the browser does when a date is picked, so that React sees the change
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(date, '2024-05-01')
      date.dispatchEvent(new Event('input', { bubbles: true }))

      await expect.poll(() => changes.length).toBeGreaterThan(0)
      expect(changes.at(-1)!.Date.toISODate()).toBe('2024-05-01')
      await expect.poll(() => date.value).toBe('2024-05-01')
    })
  }
})
