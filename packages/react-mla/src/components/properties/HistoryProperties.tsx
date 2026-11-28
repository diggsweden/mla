// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useMemo, useState } from 'react'
import { type IChartBase, type IEntity, type ILink } from '../../interfaces/data-models'
import useMainStore from '../../store/main-store'
import configService from '../../services/configurationService'
import { changesBetween } from '../../utils/properties'
import { fixDate, shortDate, toDateAndTimeString, toDateString, toTimeString } from '../../utils/date'
import { produce } from 'immer'
import { generateUUID, getId } from '../../utils/utils'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import DateField from '../common/DateField'

interface Props {
  className?: string
  entityId?: string
  linkId?: string
}

function HistoryProperties (props: Props) {
  const { t } = useTranslation();
  const currentDate = useMainStore((state) => state.currentDate)

  const entity = useMainStore(state => state.getCurrentEntity(props.entityId ?? ''))
  const getEntity = useMainStore(state => state.getEntity)

  const link = useMainStore(state => state.getCurrentLink(props.linkId ?? ''))
  const getLink = useMainStore(state => state.getLink)

  const addEntity = useMainStore((state) => state.addEntity)
  const updateEntity = useMainStore((state) => state.updateEntity)
  const removeEntity = useMainStore((state) => state.removeEntity)
  const addLink = useMainStore((state) => state.addLink)
  const updateLink = useMainStore((state) => state.updateLink)
  const removeLink = useMainStore((state) => state.removeLink)

  const setDate = useMainStore((state) => state.setDateAndTime)

  // The current item starts as the entity or link and is replaced when its dates are edited, start over when they change
  const [currentState, setCurrentState] = useState<{ entity: IEntity | undefined, link: ILink | undefined, current: IChartBase | undefined }>({ entity, link, current: entity ?? link })
  if (currentState.entity !== entity || currentState.link !== link) {
    setCurrentState({ entity, link, current: entity ?? link ?? currentState.current })
  }
  const current = currentState.current
  function setCurrent (update: IChartBase) {
    setCurrentState(state => ({ ...state, current: update }))
  }

  const history = useMemo(() => {
    if (entity) {
      return useMainStore.getState().getEntityHistory(getId(entity))!
    }
    if (link) {
      return useMainStore.getState().getLinkHistory(getId(link))!
    }

    return []
  }, [entity, link])

  // The kind of time is known from the dates: the same date from and to is a moment, and other dates a validity.
  // Without dates there is nothing to tell it by, so the kind the user chose is kept until a date is given
  const noDates = current != null && current.DateFrom == null && current.DateTo == null
  const [chosenKind, setChosenKind] = useState<'moment' | 'validity'>('moment')
  const isEvent = useMemo(() => {
    return current != null && history.length == 1 && (
      noDates ? chosenKind === 'moment' : current.DateFrom == current.DateTo
    )
  }, [current, history.length, noDates, chosenKind])

  const { min, max, requiredFirst, requiredLast } = useMemo(() => {
    let history = [] as IChartBase[] | undefined
    let id = ''
    if (entity) {
      history = useMainStore.getState().getEntityHistory(getId(entity))
      id = entity.InternalId
    }

    if (link) {
      history = useMainStore.getState().getLinkHistory(getId(link))
      id = link.InternalId
    }

    let min: DateTime | undefined
    let max: DateTime | undefined
    let requiredFirst = true
    let requiredLast = true
    if (history) {
      for (let i = 0; i < history.length; i++) {
        if (history[i].InternalId === id) {
          if (i > 0) {
            min = history[i - 1].DateTo
          }

          if (i < (history.length - 1)) {
            max = history[i + 1].DateFrom
          }

          // A date is needed only where the version meets another one: the start, when there is one before it, and the end,
          // when there is one after it. The first version can have begun at any time, and the latest holds until further notice
          requiredFirst = i > 0
          requiredLast = i < history.length - 1

          break
        }
      }
    }

    return { min, max, requiredFirst, requiredLast }
  }, [entity, link])

  function formatDate (date: Date | DateTime | undefined | null, dateWithTime: DateTime | undefined, start: boolean) {
    if (date == null) {
      return undefined
    }

    let newDate = fixDate(date)!
    if (dateWithTime == null) {
      if (start) {
        newDate = newDate.startOf("day")
      } else {
        newDate = newDate.endOf("day")
      }
    } else if (dateWithTime != null) {
      newDate = newDate.set({ hour: dateWithTime.hour, minute: dateWithTime.minute })
    }

    return newDate
  }

  function setEvent (original: IChartBase) {
    dateChanged(original, original.DateFrom, original.DateFrom)
  }

  function setHistory (original: IChartBase) {
    dateChanged(original, formatDate(original.DateFrom, undefined, true), undefined)
  }

  function updateDates (original: IChartBase, dateFrom?: DateTime, dateTo?: DateTime): IChartBase {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      dateFrom = formatDate(dateTo, original.DateTo, true)
    }

    const copy = produce(original, draft => {
      draft.DateFrom = dateFrom
      draft.DateTo = dateTo
    })

    if (entity) {
      updateEntity(copy)
    }

    if (link) {
      updateLink(copy as ILink)
    }

    return copy
  }

  function dateChanged (original: IChartBase, dateFrom?: DateTime, dateTo?: DateTime) {
    const update = updateDates(original, dateFrom, dateTo)

    if (update.DateFrom || update.DateTo) {
      setDate(update.DateFrom ?? update.DateTo!)
    }

    setCurrent(update)
  }

  function historySelected (id: string) {
    const found = history.find(e => e.InternalId === id)
    if (found) {
      setDate(found.DateFrom ?? (found.DateTo != null ? found.DateTo : found.DateFrom!.minus({ day: 1 })))
    }
  }

  function addForDate () {
    if (current) {
      let to = current.DateTo
      if (to == null) {
        to = (current.DateFrom || currentDate.DateFrom).plus({ day: 1}).startOf("day")
      } else {
        to = to.plus({ second: 1})
      }

      const copy = produce(current, draft => {
        draft.DateFrom = to
        draft.DateTo = undefined
        draft.InternalId = generateUUID()
      })

      if (entity) {
        addEntity(copy)
      }

      if (link) {
        addLink(copy as ILink)
      }

      setDate(copy.DateFrom!)
    }
  }

  function removeHistory (o: IChartBase) {
    if (entity) {
      const remove = getEntity(getId(entity), o.InternalId)
      if (remove) {
        removeEntity(remove)
      }
    }

    if (link) {
      const remove = getLink(getId(link), o.InternalId)
      if (remove) {
        removeLink(remove)
      }
    }
  }

  // Open from the start when there is a time or more than one version, and the period is changed on request
  const [open, setOpen] = useState(history.length > 1 || current?.DateFrom != null || current?.DateTo != null)
  const [editing, setEditing] = useState(history.length === 1 && current?.DateFrom == null && current?.DateTo == null)

  if (current == null) {
    return null
  }

  const field = 'm:w-full m:box-border m:bg-white m:border m:border-gray-300 m:text-gray-900 m:text-[14px] m:rounded-md m:px-2 m:h-8 m:disabled:bg-gray-50 m:disabled:text-gray-400'
  const label = 'm:text-[12px] m:font-semibold m:text-gray-900'
  const configs = configService.getProperties(current).map(p => p.propertyConfiguration)
  // Newest first, as the latest is the one that holds now
  const versions = [...history].reverse()
  const latest = history.at(-1)
  // A moment is one version, with a date or none yet
  const canBeMoment = history.length === 1 && (current.DateFrom != null || noDates)

  function changeOf (version: IChartBase): string {
    const i = history.findIndex(h => h.InternalId === version.InternalId)
    if (i <= 0) return t('first version')
    const changes = changesBetween(history[i - 1], version, configs, t('yes'), t('no'))
    if (changes.length === 0) return t('no changes')
    const first = changes[0]
    const text = first.config.Name + ': ' + (first.before || t('empty value')) + ' → ' + (first.after || t('empty value'))
    return changes.length > 1 ? t('and n more', { text, count: changes.length - 1 }) : text
  }

  const periodText = (version: IChartBase) => (version.DateFrom != null ? shortDate(version.DateFrom) : '…') + ' – ' +
    (version.DateTo != null ? shortDate(version.DateTo) : t('until further notice'))

  let summary = t('no time')
  if (isEvent && current.DateFrom != null) {
    summary = t('moment at', { date: toDateAndTimeString(current.DateFrom) })
  } else if (history.length > 1 && latest != null) {
    summary = t('n versions latest from', { count: history.length, date: toDateString(latest.DateFrom ?? latest.DateTo) })
  } else if (!isEvent && (current.DateFrom != null || current.DateTo != null)) {
    summary = t('valid during', { period: periodText(current) })
  }

  // The same field of a date as everywhere. It gives the date as the browser does, at midnight UTC, as the dates are made from it
  const dateInput = (value: DateTime | undefined, onChange: (date: Date | null) => void, extra: { min?: string, max?: string, required?: boolean, label: string }) => (
    <DateField name={extra.label} label={false} value={toDateString(value) ?? ''} min={extra.min} max={extra.max} required={extra.required} className={field}
      onChange={(date) => { onChange(date === '' ? null : new Date(date)) }} />
  )
  // A day without a time is kept at the start of the day, or at its end for the last one, as the summaries take it.
  // The field is then empty, instead of showing a time that looks chosen
  const timeInput = (value: DateTime | undefined, onChange: (value: string) => void, extra: { min?: string, max?: string, label: string, noTime: string }) => {
    const time = value != null ? toTimeString(value) : undefined
    const shown = time != null && time !== extra.noTime ? time : ''
    return (
      <input type="time" aria-label={extra.label} disabled={value == null} value={shown} min={extra.min} max={extra.max} data-empty={shown === '' ? true : undefined}
        onChange={(e) => { onChange(e.target.value) }} className={field} />
    )
  }
  const setTime = (date: DateTime, value: string, fallback: string) => {
    const sp = (value === '' ? fallback : value).split(':').map(x => Number.parseInt(x))
    return sp.length === 2 ? date.set({ hour: sp[0], minute: sp[1] }) : undefined
  }

  return (
    <section aria-label={t('time and history')} className={'m:mt-3 m:mb-3 m:border-t m:border-gray-200 ' + (props.className ?? '')}>
      <div>
        <button type="button" aria-expanded={open} onClick={() => { setOpen(!open) }}
          className="m:w-full m:flex m:items-center m:gap-2 m:px-4 m:py-3 m:text-left m:cursor-pointer m:hover:bg-gray-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={'m:text-gray-600 m:shrink-0 m:transition-transform ' + (open ? 'm:rotate-90' : '')}><path d="M9 6l6 6-6 6" /></svg>
          <span className="m:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600">{t('time and history')}</span>
          <span className="m:ml-auto m:text-[12px] m:text-gray-600 m:truncate">{open ? (isEvent ? t('moment') : t('validity')) : summary}</span>
        </button>

        {open && (
          <div className="m:flex m:flex-col m:gap-3 m:px-4 m:pb-1">
            {/* A calm choice, so that the direction of a relation is the only strong color in the panel */}
            <div role="radiogroup" aria-label={t('kind of time')} className="m:grid m:grid-cols-2 m:gap-1 m:p-[3px] m:bg-gray-100 m:rounded-md">
              <button type="button" role="radio" aria-checked={isEvent} disabled={!isEvent && !canBeMoment} title={!isEvent && !canBeMoment ? t('moment needs one version') : undefined}
                onClick={() => { if (!isEvent) { setChosenKind('moment'); if (!noDates) setEvent(current) } }}
                className={'m:text-[12px] m:font-semibold m:py-1 m:rounded m:cursor-pointer m:disabled:opacity-40 m:disabled:cursor-default ' + (isEvent ? 'm:bg-white m:text-gray-900 m:shadow-sm' : 'm:text-gray-600 m:enabled:hover:text-gray-900')}>{t('moment')}</button>
              <button type="button" role="radio" aria-checked={!isEvent} onClick={() => { if (isEvent) { setChosenKind('validity'); if (!noDates) setHistory(current) } }}
                className={'m:text-[12px] m:font-semibold m:py-1 m:rounded m:cursor-pointer ' + (!isEvent ? 'm:bg-white m:text-gray-900 m:shadow-sm' : 'm:text-gray-600 m:hover:text-gray-900')}>{t('validity')}</button>
            </div>
            <p className="m:-mt-1 m:text-[12px] m:text-gray-600">{isEvent ? t('moment help') : t('validity help')}</p>

            {isEvent && (
              <div className="m:flex m:flex-col m:gap-1">
                <span className={label}>{t('happens')}</span>
                <div className="m:grid m:grid-cols-[minmax(0,1fr)_116px] m:gap-2">
                  {dateInput(current.DateFrom, (date) => {
                    if (date == null) {
                      dateChanged(current, undefined, undefined)
                    } else {
                      const valid = formatDate(date, current.DateFrom, true)
                      dateChanged(current, valid, valid)
                    }
                  }, { min: toDateString(min), max: toDateString(max), label: t('date') })}
                  {timeInput(current.DateFrom, (value) => {
                    const valid = setTime(current.DateFrom!, value, '00:00')
                    if (valid) dateChanged(current, valid, valid)
                  }, { max: toTimeString(current.DateTo) ?? '23:59', label: t('time'), noTime: '00:00' })}
                </div>
                {current.DateFrom != null && (
                  <button type="button" onClick={() => { dateChanged(current, undefined, undefined) }} className="m:self-start m:text-[12px] m:text-blue-700 m:cursor-pointer m:hover:underline">{t('remove time')}</button>
                )}
              </div>
            )}

            {!isEvent && (
              <div className="m:flex m:flex-col m:gap-2">
                <span className="m:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600">{t('versions')}</span>
                <ol className="m:flex m:flex-col">
                  {versions.map((v, i) => {
                    const selected = v.InternalId === current.InternalId
                    const isLatest = v.InternalId === latest?.InternalId
                    return (
                      <li key={v.InternalId} className="m:grid m:grid-cols-[12px_minmax(0,1fr)] m:gap-2">
                        <div className="m:flex m:flex-col m:items-center">
                          <span className={'m:w-2.5 m:h-2.5 m:mt-3 m:rounded-full m:border-2 m:border-primary m:box-border ' + (isLatest ? 'm:bg-primary' : 'm:bg-white')} />
                          {i < versions.length - 1 && <span className="m:w-0.5 m:flex-1 m:mt-0.5 m:bg-gray-300" />}
                        </div>
                        <button type="button" aria-current={selected} onClick={() => { historySelected(v.InternalId) }}
                          className={'m:flex m:flex-col m:gap-0.5 m:text-left m:mb-1.5 m:px-2.5 m:py-1.5 m:rounded-md m:border m:cursor-pointer ' + (selected ? 'm:border-primary m:bg-blue-50' : 'm:border-gray-200 m:hover:bg-gray-50')}>
                          <span className="m:flex m:items-baseline m:justify-between m:gap-2">
                            <span className="m:text-[12px] m:font-semibold">{periodText(v)}</span>
                            {isLatest && <span className="m:text-[10px] m:font-semibold m:text-white m:bg-primary m:rounded-full m:px-1.5 m:whitespace-nowrap">{t('latest')}</span>}
                          </span>
                          <span className="m:text-[11px] m:text-gray-600">{changeOf(v)}</span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
                <div className="m:grid m:grid-cols-2 m:gap-2">
                  <button type="button" onClick={() => { addForDate() }}
                    className="m:text-[12px] m:font-semibold m:px-2 m:py-1.5 m:rounded-md m:border m:border-dashed m:border-blue-300 m:bg-white m:text-blue-700 m:hover:bg-blue-50 m:cursor-pointer">+ {t('new version')}</button>
                  <button type="button" aria-expanded={editing} onClick={() => { setEditing(!editing) }}
                    className={'m:text-[12px] m:font-semibold m:px-2 m:py-1.5 m:rounded-md m:border m:cursor-pointer ' + (editing ? 'm:border-primary m:bg-blue-50 m:text-primary' : 'm:border-gray-300 m:bg-white m:text-gray-900 m:hover:bg-gray-100')}>{t('change period')}</button>
                </div>

                {editing && (
                  <div className="m:flex m:flex-col m:gap-2 m:mt-1 m:p-2.5 m:rounded-md m:bg-gray-50 m:border m:border-gray-200">
                    <div className="m:flex m:flex-col m:gap-1">
                      <span className={label}>{t('from')}</span>
                      <div className="m:grid m:grid-cols-[minmax(0,1fr)_116px] m:gap-2">
                        {dateInput(current.DateFrom, (date) => {
                          dateChanged(current, date == null ? undefined : formatDate(date, current.DateFrom, true), current.DateTo)
                        }, { min: toDateString(min), max: toDateString(current.DateTo ?? max), required: requiredFirst, label: t('date from') })}
                        {timeInput(current.DateFrom, (value) => {
                          const valid = setTime(current.DateFrom!, value, '00:00')
                          if (valid) dateChanged(current, valid, current.DateTo)
                        }, { max: toTimeString(current.DateTo) ?? '23:59', label: t('time from'), noTime: '00:00' })}
                      </div>
                    </div>
                    <div className="m:flex m:flex-col m:gap-1">
                      <span className={label}>{t('to')}</span>
                      <div className="m:grid m:grid-cols-[minmax(0,1fr)_116px] m:gap-2">
                        {dateInput(current.DateTo, (date) => {
                          dateChanged(current, current.DateFrom, date == null ? undefined : formatDate(date, current.DateFrom, false))
                        }, { min: toDateString(current.DateFrom ?? min), max: toDateString(max), required: requiredLast, label: t('date to') })}
                        {timeInput(current.DateTo, (value) => {
                          const valid = setTime(current.DateTo!, value, '23:59')
                          if (valid) dateChanged(current, current.DateFrom, valid)
                        }, { min: toTimeString(current.DateFrom) ?? '00:00', label: t('time to'), noTime: '23:59' })}
                      </div>
                      <span className="m:text-[12px] m:text-gray-600">{t('empty to help')}</span>
                    </div>
                    <div className="m:flex m:items-center m:justify-between m:pt-1">
                      <span className="m:text-[12px] m:text-gray-600">{t('version n of m', { n: history.findIndex(h => h.InternalId === current.InternalId) + 1, m: history.length })}</span>
                      <button type="button" disabled={history.length === 1} onClick={() => { removeHistory(current); setEditing(false) }}
                        className="m:text-[12px] m:px-2.5 m:py-1 m:rounded m:border m:border-red-200 m:bg-white m:text-red-700 m:enabled:hover:bg-red-50 m:cursor-pointer m:disabled:opacity-40 m:disabled:cursor-default">{t('delete version')}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default HistoryProperties
