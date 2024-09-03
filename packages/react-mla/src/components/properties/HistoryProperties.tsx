// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useMemo, useState } from 'react'
import { type IChartBase, type IEntity, type ILink } from '../../interfaces/data-models'
import useMainStore from '../../store/main-store'
import Accordion from '../common/Accordion'
import { fixDate, toDateAndTimeString, toDateString, toTimeString } from '../../utils/date'
import { produce } from 'immer'
import { generateUUID, getId } from '../../utils/utils'
import { DateTime } from 'luxon'

interface Props {
  className?: string
  entityId?: string
  linkId?: string
}

function HistoryProperties (props: Props) {
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

  const [current, setCurrent] = useState(undefined as IChartBase | undefined)

  const [min, setMin] = useState(undefined as DateTime | undefined)
  const [max, setMax] = useState(undefined as DateTime | undefined)
  const [requiredFirst, setRequiredF] = useState(true)
  const [requiredLast, setRequiredL] = useState(true)

  const history = useMemo(() => {
    if (entity) {
      setCurrent(entity)
      return useMainStore.getState().getEntityHistory(getId(entity))! as IChartBase[]
    }
    if (link) {
      setCurrent(link)
      return useMainStore.getState().getLinkHistory(getId(link))! as IChartBase[]
    }

    return []
  }, [entity, link])

  const isEvent = useMemo(() => {
    return current != null && history.length == 1 && (
      (current.DateFrom == null && current.DateTo == null) ||
      (current.DateFrom == current.DateTo)
    )
  }, [current, history.length])

  useEffect(() => {
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

    setMin(undefined)
    setMax(undefined)
    setRequiredF(true)
    setRequiredL(true)
    if (history) {
      for (let i = 0; i < history.length; i++) {
        if (history[i].InternalId === id) {
          if (i > 0) {
            setMin(history[i - 1].DateTo)
          }

          if (i < (history.length - 1)) {
            setMax(history[i + 1].DateFrom)
          }

          if (i === 0 && history.length > 1) {
            setRequiredF(false)
            setRequiredL(true)
          } else if (i === history.length - 1) {
            setRequiredF(true)
            setRequiredL(true)
          }

          break
        }
      }
    }
  }, [entity, link])

  function formatDate (date: Date | DateTime | undefined | null, dateWithTime: DateTime | undefined, start: boolean) {
    if (date == null) {
      return undefined
    }

    let newDate = fixDate(date)!.toUTC()
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
      updateEntity(copy as IEntity)
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
        to = (current.DateFrom || currentDate.DateFrom)!.plus({ day: 1}).startOf("day")
      } else {
        to = to.plus({ second: 1})
      }

      const copy = produce(current, draft => {
        draft.DateFrom = to
        draft.DateTo = undefined
        draft.InternalId = generateUUID()
      })

      if (entity) {
        addEntity(copy as IEntity)
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
        removeEntity(current as IEntity)
      }
    }

    if (link) {
      const remove = getLink(getId(link), o.InternalId)
      if (remove) {
        removeLink(link)
      }
    }
  }

  if (current == null) {
    return null
  }

  const dateTimeClass = "m-w-full m-bg-white m-border m-border-gray-300 m-text-gray-900 m-rounded-lg focus:m-ring-blue-500 focus:m-border-blue-500 m-block m-p-1 disabled:m-opacity-50";
  return <>
    <Accordion key={current.InternalId + isEvent} title={isEvent ? 'Aktivitet' : 'Historik'} expanded={(history.length > 1 || current.DateFrom != null || current.DateTo != null)}>
      {isEvent &&
        <div className={props.className}>
          <span className="m-mt-1 m-text-sm m-font-medium m-text-gray-900" title="Datum och tid då aktivitet inträffar">Inträffar</span>
          <div className="m-pb-1 m-grid m-grid-cols-2 m-gap-2">
            <input
              type="date"
              value={toDateString(current.DateFrom)}
              min={toDateString(min)}
              max={toDateString(max)}
              onChange={(e) => {
                if (e.target.valueAsDate == null) {
                  dateChanged(current, undefined, undefined)
                } else {
                  const validDate = formatDate(e.target.valueAsDate, current.DateFrom, true)
                  dateChanged(current, validDate, validDate)
                }
              }}
              className={dateTimeClass}>
            </input>
            <input
              type="time"
              disabled={current.DateFrom == null}
              value={current.DateFrom ? toTimeString(current.DateFrom) : ''}
              max={toTimeString(current.DateTo) ?? '23:59'}
              onChange={(e) => {
                const val = e.target.value === '' ? '00:00' : e.target.value
                const sp = val.split(':').map(s => Number.parseInt(s))
                if (sp.length === 2) {
                  const validDate = current.DateFrom!.set({ hour: sp[0], minute: sp[1] })
                  dateChanged(current, validDate, validDate)
                }
              }}
              className={dateTimeClass}>
            </input>
          </div>
          <div className="m-text-sm m-font-medium m-mt-2">
            <button onClick={() => { setHistory(current) }} className="hover:font-bold text-green-800">
              Byt typ till historik
            </button>
          </div>
        </div>
      }
      {!isEvent &&
        <div className={props.className}>
          <div className="m-pb-3 m-grid m-grid-cols-2 m-gap-2">
            <div className="">
              <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900" title="Datum från">Från</span>
              <input
                type="date"
                value={toDateString(current.DateFrom)}
                min={toDateString(min)}
                max={toDateString(current.DateTo ?? max)}
                required={requiredFirst}
                onChange={(e) => {
                  if (e.target.valueAsDate == null) {
                    dateChanged(current, undefined, current.DateTo)
                  } else {
                    const validDate = formatDate(e.target.valueAsDate, current.DateFrom, true)
                    dateChanged(current, validDate, current.DateTo)
                  }
                }}
                className={dateTimeClass}>
              </input>
            </div>
            <div>
              <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900" title="Datum till">Till</span>
              <input
                type="date"
                value={toDateString(current.DateTo)}
                min={toDateString(current.DateFrom ?? min)}
                max={toDateString(max)}
                required={requiredLast}
                onChange={(e) => {
                  if (e.target.valueAsDate == null) {
                    dateChanged(current, current.DateFrom, undefined)
                  } else {
                    const validDate = formatDate(e.target.valueAsDate, current.DateFrom, false)
                    dateChanged(current, current.DateFrom, validDate)
                  }
                }}
                className={dateTimeClass}>
              </input>
            </div>
            <input
              type="time"
              disabled={current.DateFrom == null}
              value={current.DateFrom ? toTimeString(current.DateFrom) : ''}
              max={toTimeString(current.DateTo) ?? '23:59'}
              onChange={(e) => {
                const val = e.target.value === '' ? '00:00' : e.target.value
                const sp = val.split(':').map(s => Number.parseInt(s))
                if (sp.length === 2) {
                  const validDate = current.DateFrom!.set({ hour: sp[0], minute: sp[1] })
                  dateChanged(current, validDate, current.DateTo)
                }
              }}
              className={dateTimeClass}>
            </input>
            <div>
              <input
                type="time"
                disabled={current.DateTo == null}
                value={current.DateTo ? toTimeString(current.DateTo) : ''}
                min={toTimeString(current.DateFrom) ?? '00:00'}
                onChange={(e) => {
                  const val = e.target.value === '' ? '23:59' : e.target.value
                  const sp = val.split(':').map(s => Number.parseInt(s))
                  if (sp.length === 2) {
                    const validDate = current.DateTo!.set({ hour: sp[0], minute: sp[1] })
                    dateChanged(current, current.DateFrom, validDate)
                  }
                }}
                className={dateTimeClass}>
              </input>
            </div>
          </div>
          <div className="m-pt-1">
            <div className="m-text-sm m-font-medium">
              <div className="m-text-sm m-font-medium">
                {history.length === 1 &&
                  <button disabled={current.DateFrom == null} onClick={() => { setEvent(current) }} className="hover:m-font-bold m-text-green-800 disabled:m-opacity-50">
                    Byt typ till aktivitet
                  </button>
                }
              </div>
              <button onClick={() => { addForDate() }} className="hover:m-font-bold m-text-green-800">
                Skapa ny version
              </button>
            </div>
            <div className='m-cursor-default m-font-semibold m-text-center m-relative before:m-block before:m-absolute before:m-h-1 before:m-bg-primary before:m-left-0 before:m-w-16 before:m-top-1/2 after:m-block after:m-absolute after:m-h-1 after:m-bg-primary after:m-right-0 after:m-w-16 after:m-top-1/2'>
              <div>Versioner</div>
            </div>
            <div className="m-text-sm m-font-medium">
              {history.map(h =>
                <div key={h.InternalId} className="m-flex m-justify-between m-w-full m-my-1">
                  <button className={(h.InternalId === current.InternalId ? 'm-font-bold' : '') + ' hover:m-font-bold'} onClick={() => { historySelected(h.InternalId) }}>
                    {textFormatDate(h.DateFrom) + ' - ' + textFormatDate(h.DateTo)}
                  </button>
                  <button className="hover:m-font-bold m-text-red-800 disabled:m-opacity-50" disabled={history.length == 1} onClick={() => { removeHistory(h) }}>
                    Radera
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      }
    </Accordion>

  </>
}

function textFormatDate (date?: DateTime): string | undefined {
  if (date) {
    return toDateAndTimeString(date)
  } else {
    // Looks OK....
    return '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0'
  }
}

export default HistoryProperties
