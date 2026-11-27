// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { IChartBase, IHistory, ITimeSpan } from "../interfaces/data-models"
import { DateTime } from 'luxon'

export function toDateString (d?: DateTime): string | undefined {
  d = d?.toUTC()
  if (d == null) {
    return undefined
  }

  return d.toFormat("yyyy-MM-dd") ?? ""
}

export function toTimeString (d?: DateTime): string | undefined {
  d = d?.toUTC()
  if (d == null || (d.hour == 23 && d.minute == 59) || (d.hour == 0 && d.minute == 0)) {
    return undefined
  }

  return d.toFormat("HH:mm") ?? ""
}

export function toDateAndTimeString (d?: DateTime): string | undefined {
  if (d == null) {
    return undefined
  }

  return [toDateString(d), toTimeString(d)].filter(x => x != null).join(' ')
}

export function isSameDay (d1?: DateTime, d2?: DateTime) : boolean {
  return d1?.toISODate() == d2?.toISODate()
}

export function getDateBetween (t: ITimeSpan | IHistory, dateFrom?: DateTime) : DateTime {
  if (t.DateFrom == null || t.DateTo == null) {
    return DateTime.now()
  }

  const diff = t.DateTo.diff(t.DateFrom).milliseconds / 2
  const ret = dateFrom != null ? dateFrom.plus({ milliseconds: diff}) : t.DateFrom.plus({ milliseconds: diff})

  return ret
}

export function getStart (t: ITimeSpan, center: DateTime) : DateTime {
  const diff = t.DateTo.diff(t.DateFrom).milliseconds / 2
  const ret = center.minus({ milliseconds: diff})

  return ret
}

export function fixDate (value: string | undefined | Date | DateTime): DateTime | undefined {
  if (value == null || value === '') {
    return undefined
  } else { 
    let date: DateTime | undefined = undefined
    if (DateTime.isDateTime(value)) {
      date = value
    }

    if (value instanceof Date) {
      date = DateTime.fromJSDate(value)
    }

    if (typeof value === 'string') {
      // The dates are shown in UTC, so a date without a time zone is read as UTC to be shown as it was sent.
      // A date with a time zone keeps its point in time. Both are then kept in the time zone of the user, as before
      date = DateTime.fromISO(value, { zone: 'utc' })

      if (!date.isValid) {
        date = DateTime.fromSQL(value, { zone: 'utc' })
      }

      date = date.toLocal()
    }

    if (date == undefined || !date.isValid) {
      console.error("unknown date", value)
      date = undefined
    }

    return date
  }
}

export function removeInternals(base: IChartBase) : Partial<IChartBase> {
  return {
    ...base,
    InternalId: undefined,
    LabelChart: undefined,
    LabelLong: undefined,
    LabelShort: undefined
  }
}

// A date with its time only when it says something: not at the start of a day or at its end, as for a period of whole days
export function shortDate (date: DateTime): string {
  const time = toTimeString(date)
  return (time === '00:00' || time === '23:59' ? toDateString(date) : toDateAndTimeString(date)) ?? ''
}
