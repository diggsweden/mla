// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { createRef, useCallback, useEffect, useMemo, useState } from 'react'
import useMainStore from '../../store/main-store'
import viewService from '../../services/viewService'
import configService from '../../services/configurationService'
import type { IChartBase, ILink, IPhaseEvent } from '../../interfaces/data-models'
import { getId } from '../../utils/utils'
import Modal from '../common/Modal'
import PhaseCreator from '../modal/PhaseCreator'
import { getDateBetween, isSameDay, toDateAndTimeString, toDateString } from '../../utils/date'
import useAppStore from '../../store/app-store'
import Icon from '../common/Icon'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'

interface Props {
  className?: string
}

interface History {
  item?: IChartBase
  links?: ILink[]
  color: string
  date: DateTime
  rubrik: string
  text: string
  separator: boolean
  event?: IPhaseEvent
}

function ActivityTool (props: Props) {
  const { t } = useTranslation();
  const ref = createRef<HTMLLIElement>()
  const viewConfig = useAppStore(state => state.currentViewConfiguration)

  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)
  const phaseEvents = useMainStore((state) => state.phaseEvents)

  const currentDate = useMainStore((state) => state.currentDate)
  const setDate = useMainStore((state) => state.setDate)
  const setTimespan = useMainStore((state) => state.setTimespan)
  const setSelected = useMainStore((state) => state.setSelected)
  const maxDate = useMainStore((state) => state.maxDate)

  const setEvent = useMainStore((state) => state.setPhaseEvent)
  const [editEvent, setEditevent] = useState(undefined as undefined | IPhaseEvent)
  const type = configService.getConfiguration().TimeAnalysis?.PhaseAnalysis?.EntityTypeId

  const [showAll, setShowAll] = useState(false)

  function selected (item: History) {
    if (item.item != null) {
      setSelected([getId(item.item)])
      setDate(item.date)
    }
  }

  const getColor = useCallback((e: IChartBase) => {
    if (e.Color) {
      return e.Color
    }

    const rule = viewService.getRule(e, viewConfig)
    if (rule?.Color != null) {
      return rule.Color
    }

    return viewService.getView(e.TypeId).Color
  }, [viewConfig])

  const history = useMemo(() => {
    const result = [] as History[]

    for (const list of [...Object.values(entities), ...Object.values(links)].filter(e => (type != null && !showAll) ? e[0].TypeId === type : true)) {
      if (list.length === 1 && (list[0].DateFrom != null || list[0].DateTo != null)) {
        const ent = list[0]
        const date = ent.DateFrom ?? ent.DateTo
        if (date === undefined) {
          continue
        }

        const view = viewService.getView(ent.TypeId)
        if (view.Show === false && ent.TypeId !== type) {
          continue
        }

        if (ent.TypeId === type) {
          result.push({
            item: ent,
            date,
            rubrik: ent.LabelShort,
            text: ent.LabelLong,
            color: getColor(ent),
            separator: false
          })
        } else {
          if (isSameDay(ent.DateFrom, ent.DateTo)) {
            result.push({
              item: ent,
              date: ent.DateFrom!,
              rubrik: ent.LabelShort,
              text: ent.LabelLong,
              color: getColor(ent),
              separator: false
            })
          } else {
            if (ent.DateFrom) {
              result.push({
                item: ent,
                date: ent.DateFrom,
                rubrik: ent.LabelShort,
                text: t('is added') + '\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            }
            if (ent.DateTo) {
              result.push({
                item: ent,
                date: ent.DateTo,
                rubrik: ent.LabelShort,
                text: t('is removed') + '\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            }
          }
        }
      } else if (list.length > 1) {
        let i = 0
        for (const ent of list) {
          const date = ent.DateFrom ?? ent.DateTo
          if (date === undefined) {
            continue
          }

          if (ent.TypeId === type) {
            result.push({
              item: ent,
              date,
              rubrik: ent.LabelShort,
              text: ent.LabelLong,
              color: getColor(ent),
              separator: false
            })
          } else {
            if (ent.DateFrom && i === 0) {
              result.push({
                item: ent,
                date: ent.DateFrom,
                rubrik: ent.LabelShort,
                text:  t('is added') + '\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            } else if (ent.DateTo && (i === list.length - 1)) {
              result.push({
                item: ent,
                date: ent.DateTo,
                rubrik: ent.LabelShort,
                text:  t('is removed') + '\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            } else {
              result.push({
                item: ent,
                date,
                rubrik: ent.LabelShort,
                text: t('is updated') + '\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            }
          }
          i++
        }
      }
    }

    phaseEvents.forEach(e => {
      result.push({ date: e.Date, color: '', rubrik: e.Description, text: '', separator: true, event: e })
    })

    result.sort((a, b) => a.date.diff(b.date).milliseconds)

    return result
  }, [phaseEvents, entities, links, type, showAll, getColor, t])

  function setEventTime(event: IPhaseEvent, idx: number) {
    const start = event.Date
    let end = maxDate

    for (let i = (idx + 1); i < history.length; i++) {
      if (history[i].event != null) {
        end = history[i].event!.Date
        break
      }
    }

    setTimespan( {DateFrom: start, DateTo: end} );
  }

  // Add the current date to the correct relative position
  const historyView = useMemo(() => {
    const middleDate  = getDateBetween(currentDate).startOf("day")
    const separator: History = { date: middleDate, color: '', rubrik: '', text: '', separator: true }
    let found = -1

    for (let idx = 0; idx < history.length; idx++) {
      if (history[idx].date < middleDate) {
        found = idx
      } else {
        break
      }
    }

    return [...history.slice(0, found + 1), separator, ...history.slice(found + 1)]
  }, [history, currentDate])

  // Scroll the current date to center of screen
  useEffect(() => {
    if (ref?.current != null) {
      ref.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [ref, currentDate])

  return (
    <div className={props.className}>
      {/* With an activity type, the flow shows its activities, and the changes of the other entities and relations when asked to */}
      {type &&
        <label className="m:flex m:items-center m:gap-2 m:px-3 m:py-2.5 m:border-b m:border-gray-200 m:text-[12px] m:cursor-pointer">
          <input type="checkbox" checked={showAll} onChange={() => { setShowAll(!showAll) }} className="m:w-4 m:h-4 m:accent-primary" />
          {t('show all changes')}
        </label>
      }
      <ol className="m:flex m:flex-col m:px-3 m:py-3">
        {historyView.map(function (m, i) {
          if (m.separator && m.rubrik) {
            return (
              <li key={i} className="m:flex m:items-center m:gap-2 m:mb-2 m:mt-1 m:rounded-md m:bg-blue-50 m:text-blue-950">
                <button type="button" title={t('show phase')} onClick={() => { if (m.event != null) setEventTime(m.event, i) }}
                  className="m:flex m:flex-1 m:items-baseline m:justify-between m:gap-2 m:min-w-0 m:pl-2.5 m:py-1.5 m:text-left m:cursor-pointer">
                  <span className="m:text-[12px] m:font-bold m:truncate">{m.rubrik}</span>
                  <span className="m:text-[11px] m:whitespace-nowrap">{toDateString(m.date)}</span>
                </button>
                <button type="button" aria-label={t('edit phase')} title={t('edit phase')} onClick={() => { if (m.event != null) setEditevent({ ...m.event }) }}
                  className="m:w-7 m:h-7 m:mr-1 m:shrink-0 m:flex m:items-center m:justify-center m:rounded m:hover:bg-blue-100 m:cursor-pointer">
                  <Icon name="edit" className="m:h-3.5 m:w-3.5" />
                </button>
              </li>
            )
          } else if (m.separator) {
            // The date the chart shows now
            return (
              <li key={i} ref={ref} className="m:flex m:items-center m:gap-2 m:my-1.5 m:cursor-default">
                <span className="m:flex-1 m:h-0.5 m:bg-primary" />
                <span className="m:text-[11px] m:font-bold m:text-primary">{toDateString(m.date)}</span>
                <span className="m:flex-1 m:h-0.5 m:bg-primary" />
              </li>
            )
          } else {
            return (
              <li key={i} className="m:grid m:grid-cols-[12px_minmax(0,1fr)] m:gap-2">
                <div className="m:flex m:flex-col m:items-center">
                  <span className="m:w-2.5 m:h-2.5 m:mt-2.5 m:rounded-full m:shrink-0" style={{ background: m.color }} />
                  <span className="m:w-0.5 m:flex-1 m:bg-gray-200" />
                </div>
                <button type="button" onClick={() => { selected(m) }}
                  className="m:flex m:flex-col m:gap-0.5 m:text-left m:mb-1.5 m:px-2.5 m:py-1.5 m:rounded-md m:border m:border-gray-200 m:hover:bg-gray-50 m:cursor-pointer m:min-w-0">
                  <span className="m:text-[11px] m:text-gray-600">{toDateAndTimeString(m.date)}</span>
                  <span className="m:text-[13px] m:font-semibold">{m.rubrik}</span>
                  {m.text && <span className="m:text-[12px] m:text-gray-700 m:whitespace-pre-line">{m.text}</span>}
                </button>
              </li>
            )
          }
        })}
      </ol>
      {editEvent &&
        <Modal mode="save" show={editEvent !== null} title={t('edit phase')} onNegative={() => { setEditevent(undefined) }} onPositive={() => { setEvent(editEvent); setEditevent(undefined) }}>
          <PhaseCreator value={editEvent} onChange={(e) => { setEditevent(e) }} />
        </Modal>

      }
    </div>
  )
}

export default ActivityTool
