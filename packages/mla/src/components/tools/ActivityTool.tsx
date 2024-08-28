// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

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
                text: 'Tillkommer\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            }
            if (ent.DateTo) {
              history.push({
                item: ent,
                date: ent.DateTo,
                rubrik: ent.LabelShort,
                text: 'Avslutad\n' + ent.LabelLong,
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
                text: 'Tillkommer\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            } else if (ent.DateTo && (i === list.length - 1)) {
              history.push({
                item: ent,
                date: ent.DateTo,
                rubrik: ent.LabelShort,
                text: 'Avslutad\n' + ent.LabelLong,
                color: getColor(ent),
                separator: false
              })
            } else {
              history.push({
                item: ent,
                date,
                rubrik: ent.LabelShort,
                text: 'Uppdaterad\n' + ent.LabelLong,
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
  }, [phaseEvents, entities, links, type, showAll, getColor])

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
        <div className="w-full mb-3">
          <Toggle title="Visa allt:" value={showAll} onChange={() => { setShowAll(!showAll) }} className=''/>
        </div>
      }
      <div className="h-full w-full border-l border-gray-300 ">
        <div className='mx-1 columns-1 ml-[-6px]'>
          {historyView.map(function (m, i) {
            if (m.separator && m.rubrik) {
              return <div key={i} className="ml-4 pb-3 font-semibold text-center relative cursor-pointer" onClick={() => {
                if (m.event != null) {
                  setEventTime(m.event, i)
                }
              }}>
                <div className="text-white w-full px-3 bg-origin-border bg-no-repeat ms-auto me-auto" style={{ backgroundImage: 'conic-gradient(from 45deg at left center, rgb(68, 105, 149) 25%, rgba(0, 0, 0, 0) 0deg), conic-gradient(from -135deg at right center, rgb(68, 105, 149) 25%, rgba(0, 0, 0, 0) 0deg)', backgroundPositionX: '0px, 100%', backgroundPositionY: '50%, 50%', backgroundSize: '51% 100%', borderImageSource: 'linear-gradient(rgba(0, 0, 0, 0) calc(50% - 2px), rgb(196, 77, 88) 0px, rgb(196, 77, 88) calc(50% + 2px), rgba(0, 0, 0, 0) 0px)' }} title={toDateString(m.date)}>
                  <div className='w-full flex p-1'>
                    <span className='flex-1'>{m.rubrik}</span>
                    <span className='ms-2 w-4' title="Redigera" onClick={() => {
                      if (m.event != null) {
                        setEditevent({ ...m.event })
                      }
                    }}>
                      <Icon name="edit" className='h-4'/>
                    </span>
                  </div>
                </div>
              </div>
            } else if (m.separator) {
              return <div key={i} ref={ref} className='cursor-default ml-4 mb-3 font-semibold text-center relative before:block before:absolute before:h-1 before:bg-primary before:left-0 before:w-16 before:top-1/2 after:block after:absolute after:h-1 after:bg-primary after:right-0 after:w-16 after:top-1/2'>
                <div>{ toDateString(m.date) }</div>
              </div>
            } else {
              return <div className='w-full flex pb-3 cursor-pointer ' key={i} onClick={() => { selected(m) }}>
                <div>
                  <div className='relative z-20 h-8 pt-2'>
                    <svg className='h-3 w-3'>
                      <circle cx="5" cy="5" r="5" fill={m.color} />
                    </svg>
                  </div>
                </div>
                <div className={'border bg-white w-full p-2 ms-1 '}>
                  <div className='text-primary text-sm font-bold'>{ toDateAndTimeString(m.date) } - {m.rubrik}</div>
                  <div className='text-sm'>{m.text}</div>
                </div>
              </div>
            }
          })}
        </div>

      </div>
      {editEvent &&
        <Modal mode="save" show={editEvent !== null} title="Ändra fas" onNegative={() => { setEditevent(undefined) }} onPositive={() => { setEvent(editEvent); setEditevent(undefined) }}>
          <PhaseCreator value={editEvent} onChange={(e) => { setEditevent(e) }} />
        </Modal>

      }
    </div>
  )
}

export default ActivityTool
