// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import useMainStore, { type IntervalType } from '../../store/main-store'
import { toDateString } from '../../utils/date'
import DateField from '../common/DateField'

// The day of a date input, yyyy-MM-dd, as the start of that day where the user is
function dayOf (value: string): DateTime | undefined {
  const date = DateTime.fromISO(value)
  return value !== '' && date.isValid ? date : undefined
}

// The period of the time line: the day it starts and the length of the step, or a period of its own
function TimeIntervalPicker () {
  const { t } = useTranslation()
  const date = useMainStore((state) => state.currentDate)
  const min = useMainStore((state) => state.minDate)
  const max = useMainStore((state) => state.maxDate)
  const setDate = useMainStore((state) => state.setDate)
  const interval = useMainStore((state) => state.interval)
  const setInterval = useMainStore((state) => state.setInterval)
  const setTimespan = useMainStore((state) => state.setTimespan)

  const label = 'm:text-[12px] m:font-semibold m:text-gray-700'
  const field = 'm:w-full m:box-border m:bg-white m:border m:border-gray-300 m:text-gray-900 m:text-[14px] m:rounded m:px-1.5 m:py-1 m:focus:ring-blue-500 m:focus:border-blue-500 m:read-only:bg-gray-100'

  return (
    // The same room at the sides as the flow below it, and the same fields of dates as everywhere
    <section aria-label={t('select time interval')} className="m:grid m:grid-cols-2 m:gap-x-2 m:gap-y-1 m:px-3 m:pt-3 m:pb-3 m:border-b m:border-gray-200">
      <label htmlFor="interval-from" className={label}>{t('from')}</label>
      <label htmlFor="interval-to" className={label}>{t('to')}</label>
      <DateField id="interval-from" name={t('from')} required min={toDateString(min)} value={toDateString(date.DateFrom)} className={field}
        onChange={(value) => { const d = dayOf(value); if (d) setDate(d) }} />
      <div title={interval !== 'custom' ? t('to follows interval') : undefined}>
        <DateField id="interval-to" name={t('to')} required readOnly={interval !== 'custom'} min={toDateString(date.DateFrom)} max={toDateString(max)} value={toDateString(date.DateTo)} className={field}
          onChange={(value) => { const d = dayOf(value); if (d) setTimespan({ DateFrom: date.DateFrom, DateTo: d }) }} />
      </div>
      <label htmlFor="interval-step" className={label + ' m:col-span-2 m:mt-1.5'}>{t('time interval')}</label>
      <select id="interval-step" value={interval} onChange={(e) => { setInterval(e.target.value as IntervalType) }} className={field + ' m:col-span-2'}>
        <option value="day">{t('day')}</option>
        <option value="week">{t('week')}</option>
        <option value="month">{t('month')}</option>
        <option value="custom">{t('custom')}</option>
      </select>
    </section>
  )
}

export default TimeIntervalPicker
