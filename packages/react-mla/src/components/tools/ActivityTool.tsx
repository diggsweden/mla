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
import Toggle from '../common/Toggle'
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
  const ref = createRef<HTMLDivElement>()
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
    const history = [] as History[]

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
          history.push({
            item: ent,
            date,
            rubrik: ent.LabelShort,
            text: ent.LabelLong,
            color: getColor(ent),
            separator: false
          })
        } else {
          if (isSameDay(ent.DateFrom, ent.DateTo)) {
            history.push({
              item: ent,
              date: ent.DateFrom!,
              rubrik: ent.LabelShort,
              text: ent.LabelLong,
              color: getColor(ent),
              separator: false
            })
          } else {
            if (ent.DateFrom) {
              history.push({
                item: ent,
                date: ent.DateFrom,
                rubrik: ent.LabelShort,
                text: t('is added') + '\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            }
            if (ent.DateTo) {
              history.push({
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
            history.push({
              item: ent,
              date,
              rubrik: ent.LabelShort,
              text: ent.LabelLong,
              color: getColor(ent),
              separator: false
            })
          } else {
            if (ent.DateFrom && i === 0) {
              history.push({
                item: ent,
                date: ent.DateFrom,
                rubrik: ent.LabelShort,
                text:  t('is added') + '\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            } else if (ent.DateTo && (i === list.length - 1)) {
              history.push({
                item: ent,
                date: ent.DateTo,
                rubrik: ent.LabelShort,
                text:  t('is removed') + '\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            } else {
              history.push({
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
      history.push({ date: e.Date, color: '', rubrik: e.Description, text: '', separator: true, event: e })
    })

    history.sort((a, b) => a.date.diff(b.date).milliseconds)

    return history
  }, [phaseEvents, entities, links, type, showAll, getColor, t])

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
      { type &&
        <div className="m-w-full m-mb-3">
          <Toggle title={t('show all')} value={showAll} onChange={() => { setShowAll(!showAll) }} className=''/>
        </div>
      }
      <div className="m-h-full m-w-full m-border-l m-border-gray-300 m-">
        <div className='mx-1 columns-1 ml-[-6px]'>
          {historyView.map(function (m, i) {
            if (m.separator && m.rubrik) {
              return <div key={i} className="m-ml-4 m-pb-3 m-font-semibold m-text-center m-relative m-cursor-pointer" onClick={() => {
                if (m.event != null) {
                  setEventTime(m.event, i)
                }
              }}>
                <div className="m-text-white m-w-full m-px-3 m-bg-origin-border m-bg-no-repeat m-ms-auto m-me-auto" style={{ backgroundImage: 'conic-gradient(from 45deg at left center, rgb(68, 105, 149) 25%, rgba(0, 0, 0, 0) 0deg), conic-gradient(from -135deg at right center, rgb(68, 105, 149) 25%, rgba(0, 0, 0, 0) 0deg)', backgroundPositionX: '0px, 100%', backgroundPositionY: '50%, 50%', backgroundSize: '51% 100%', borderImageSource: 'linear-gradient(rgba(0, 0, 0, 0) calc(50% - 2px), rgb(196, 77, 88) 0px, rgb(196, 77, 88) calc(50% + 2px), rgba(0, 0, 0, 0) 0px)' }} title={toDateString(m.date)}>
                  <div className="m-w-full m-flex m-p-1">
                    <span className="m-flex-1">{m.rubrik}</span>
                    <span className="m-ms-2 m-w-4" title={t('edit')} onClick={() => {
                      if (m.event != null) {
                        setEditevent({ ...m.event })
                      }
                    }}>
                      <Icon name="edit" className="m-h-4"/>
                    </span>
                  </div>
                </div>
              </div>
            } else if (m.separator) {
              return <div key={i} ref={ref} className='m-cursor-default m-ml-4 m-mb-3 m-font-semibold m-text-center m-relative before:m-block before:m-absolute before:m-h-1 before:m-bg-primary before:m-left-0 before:m-w-16 before:m-top-1/2 after:m-block after:m-absolute after:m-h-1 after:m-bg-primary after:m-right-0 after:m-w-16 after:m-top-1/2'>
                <div>{ toDateString(m.date) }</div>
              </div>
            } else {
              return <div className="m-w-full m-flex m-pb-3 m-cursor-pointer m-" key={i} onClick={() => { selected(m) }}>
                <div>
                  <div className="m-relative m-z-20 m-h-8 m-pt-2">
                    <svg className="m-h-3 m-w-3">
                      <circle cx="5" cy="5" r="5" fill={m.color} />
                    </svg>
                  </div>
                </div>
                <div className='m-border m-bg-white m-w-full m-p-2 m-ms-1'>
                  <div className="m-text-primary m-text-sm m-font-bold">{ toDateAndTimeString(m.date) } - {m.rubrik}</div>
                  <div className="m-text-sm">{m.text}</div>
                </div>
              </div>
            }
          })}
        </div>

      </div>
      {editEvent &&
        <Modal mode="save" show={editEvent !== null} title={t('edit phase')} onNegative={() => { setEditevent(undefined) }} onPositive={() => { setEvent(editEvent); setEditevent(undefined) }}>
          <PhaseCreator value={editEvent} onChange={(e) => { setEditevent(e) }} />
        </Modal>

      }
    </div>
  )
}

export default ActivityTool
