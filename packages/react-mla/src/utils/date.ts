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

  return [toDateString(d), toTimeString(d)].join(' ')
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
      date = DateTime.fromISO(value)

      if (!date.isValid) {
        date = DateTime.fromSQL(value)
      }
    }

    if (date == undefined || !date.isValid) {
      console.error("unknown date", value)
      date = DateTime.now()
    }

    return date
  }
}

export function removeInternals(base: IChartBase) : any {
  return {
    ...base,
    InternalId: undefined,
    LabelChart: undefined,
    LabelLong: undefined,
    LabelShort: undefined
  }
}
