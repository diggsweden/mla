// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, describe, expect, test } from 'vitest'
import { DateTime, Settings } from 'luxon'
import { fixDate, toDateAndTimeString } from './date'

const originalZone = Settings.defaultZone

afterEach(() => {
  Settings.defaultZone = originalZone
})

describe('fixDate', () => {
  // The dates are shown in UTC, so a date from a service without a time zone has to be read as UTC to be shown as it was sent
  for (const zone of ['Europe/Stockholm', 'America/New_York', 'UTC']) {
    test(`a date without a time zone is shown as it was sent, in the time zone ${zone}`, () => {
      Settings.defaultZone = zone
      expect(toDateAndTimeString(fixDate('2024-05-01'))).toBe('2024-05-01')
      expect(toDateAndTimeString(fixDate('2024-05-01T10:30:00'))).toBe('2024-05-01 10:30')
      expect(toDateAndTimeString(fixDate('2024-05-01 10:30:00'))).toBe('2024-05-01 10:30')
    })
  }

  test('a date with a time zone keeps its point in time', () => {
    Settings.defaultZone = 'Europe/Stockholm'
    const iso = '2024-05-01T10:30:00+02:00'
    expect(fixDate(iso)?.toMillis()).toBe(DateTime.fromISO(iso).toMillis())
    expect(toDateAndTimeString(fixDate(iso))).toBe('2024-05-01 08:30')
  })

  test('the date is in the time zone of the user, as before', () => {
    Settings.defaultZone = 'Europe/Stockholm'
    expect(fixDate('2024-05-01')?.zoneName).toBe('Europe/Stockholm')
  })

  test('something that is not a date is undefined', () => {
    expect(fixDate('not a date')).toBeUndefined()
    expect(fixDate('')).toBeUndefined()
  })
})
