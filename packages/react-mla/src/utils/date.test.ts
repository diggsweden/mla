// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, describe, expect, test } from 'vitest'
import { DateTime, Settings } from 'luxon'
import { fixDate, toDateAndTimeString, toDateString } from './date'

const originalZone = Settings.defaultZone

afterEach(() => {
  Settings.defaultZone = originalZone
})

describe('dates are shown in local time', () => {
  // A date without a time zone is a local time, so it is shown as it was written, wherever the user is
  for (const zone of ['Europe/Stockholm', 'America/New_York', 'UTC']) {
    test(`a date without a time zone is shown as it was written, in the time zone ${zone}`, () => {
      Settings.defaultZone = zone
      expect(toDateAndTimeString(fixDate('2024-05-01'))).toBe('2024-05-01')
      expect(toDateAndTimeString(fixDate('2024-05-01T10:30:00'))).toBe('2024-05-01 10:30')
      expect(toDateAndTimeString(fixDate('2024-05-01 10:30:00'))).toBe('2024-05-01 10:30')
    })
  }

  test('a date with a time zone keeps its point in time and is shown in local time', () => {
    Settings.defaultZone = 'Europe/Stockholm'
    const iso = '2024-05-01T08:30:00Z'
    expect(fixDate(iso)?.toMillis()).toBe(DateTime.fromISO(iso).toMillis())
    expect(toDateAndTimeString(fixDate(iso))).toBe('2024-05-01 10:30')
  })

  test('a point in time late in the day in UTC is the next day in Stockholm', () => {
    Settings.defaultZone = 'Europe/Stockholm'
    expect(toDateString(DateTime.fromISO('2024-04-30T23:00:00Z'))).toBe('2024-05-01')
  })

  test('the date is in the time zone of the user', () => {
    Settings.defaultZone = 'Europe/Stockholm'
    expect(fixDate('2024-05-01')?.zoneName).toBe('Europe/Stockholm')
  })

  test('something that is not a date is undefined', () => {
    expect(fixDate('not a date')).toBeUndefined()
    expect(fixDate('')).toBeUndefined()
  })
})
