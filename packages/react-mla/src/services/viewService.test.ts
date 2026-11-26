// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, beforeAll, describe, expect, test } from 'vitest'
import { Settings } from 'luxon'
import viewService from './viewService'
import { initServices, person } from '../test-utils/setup'

const originalZone = Settings.defaultZone

beforeAll(async () => {
  await initServices()
})

afterEach(() => {
  Settings.defaultZone = originalZone
})

describe('the value of a date property', () => {
  // A date property is saved as a date without a time, for example 2024-05-01
  for (const zone of ['Europe/Stockholm', 'America/New_York', 'UTC']) {
    test(`is shown as the same date in the time zone ${zone}`, () => {
      Settings.defaultZone = zone
      const p = person('date-1', { personE4: '2024-05-01' })
      expect(viewService.getPropertyValue(p, 'personE4')).toBe('2024-05-01')
    })
  }
})
