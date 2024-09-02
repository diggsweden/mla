// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useMainStore from '../../store/main-store'
import Icon from '../common/Icon'
import { ITimeSpan } from '../../interfaces/data-models'
import { getDateBetween, getStart, isSameDay, toDateString } from '../../utils/date'
import useAppStore from '../../store/app-store'
import { TimelineBar } from './TimlineBar'
import { HistoryDot, createHistoryDots } from './common'
import { DateTime } from 'luxon'
import { useEffectDebugger } from '../../utils/debug'

interface Props {
  className?: string
}

function Timeline (props: Props) {
  const viewConfig = useAppStore(state => state.currentViewConfiguration)

  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)

  const currentDate = useMainStore((state) => state.currentDate)
  const start = useMainStore((state) => state.minDate)
  const end = useMainStore((state) => state.maxDate)
  const setDate = useMainStore((state) => state.setDate)
  const setSelected = useMainStore((state) => state.setSelected)

  const [play, setPlay] = useState(0)
  const [targetDate, setTargetDate] = useState(getDateBetween(currentDate))

  function select (item: HistoryDot) {
    setPlay(0)
    setDate(getStart(currentDate, item.date))
    setSelected([item.id])
  }

  const startOffset = useMemo(() => {
    // Make sure that we are ahead so that the timeline may be centered
    return start.minus({ months: 10}).startOf("month")
  }, [start])

  const months = useMemo(() => {
    const months = [] as string[]

    let d = startOffset
    while (d <= end) {
      let month = d.toFormat("MMM")
      if (d.month === 1) {
        month = d.toFormat("MMM yyyy")
      }
      months.push(month)

      d = d.plus({ months: 1})
    }

    return months
  }, [startOffset, end])

  const transitionTime = useMemo(() => {
    return 3000 / Math.abs(play)
  }, [play])

  const centerDate = useMemo(() => {
    return getDateBetween(currentDate)
  }, [currentDate])

  const isDay = useMemo(() => {
    return isSameDay(currentDate.DateFrom, currentDate.DateTo)
  }, [currentDate])

  const history = useMemo(() => {
    return createHistoryDots([...Object.values(entities), ...Object.values(links)], startOffset, viewConfig)
  }, [entities, links, startOffset, viewConfig])

  const getNextDate = useCallback((direction: number, current: ITimeSpan) => {
    const diff = current.DateTo.diff(current.DateFrom).plus({millisecond: 1})
    const next = direction > 0 ? current.DateFrom.plus(diff) : current.DateFrom.minus(diff)
    if ((direction > 0 ? next > end : next < start)) {
      return undefined
    }

    return next
  }, [end, start])

  const next = useCallback((direction: number) => {
    const nextDate = getNextDate(direction, currentDate)
    if (nextDate) {
      return setDate(nextDate)
    }

    return undefined
  }, [currentDate, getNextDate, setDate])

  const dateHandle = useRef(0)
  // Display date
  const animationIndex = useRef(0)
  const animateDate = useCallback((target: DateTime, date: ITimeSpan, updates: number) => {
    const fromDate = date.DateFrom
    const diff = (target.diff(fromDate)).milliseconds
    if (diff == 0) {
      setPlay(0)
      console.error("invalid dates", target.toISO(), fromDate.toISO())
    }

    const animationDiff = diff / updates
    const up = fromDate.plus( { milliseconds: animationDiff * animationIndex.current++ })


    if (up > target) {
      const nextDate = getNextDate(play, { DateFrom: date.DateFrom.plus(diff), DateTo: date.DateTo.plus(diff) });
      if (nextDate == undefined) {
        setPlay(0)
      } else {
        setDate(up, play < 0)
        setTargetDate(nextDate)
      }
    } else {
      if (!isSameDay(up, fromDate)) {
        setDate(up, play < 0);
      }
    }
  }, [getNextDate, setDate, setTargetDate, play])

  useEffectDebugger(() => {
    if (play != 0) {
      const date = useMainStore.getState().currentDate
      const updates = 5 / Math.abs(play)
    
      animationIndex.current = 0
      animateDate(targetDate, date, transitionTime / updates)
      dateHandle.current = window.setInterval(() => animateDate(targetDate, date, updates), transitionTime / updates)
    }

    return () => {
      window.clearInterval(dateHandle.current)
    }
  }, [animateDate, play, targetDate])

  useEffect(() => {
    if (play == 0) {
      setTargetDate(currentDate.DateFrom)
    }
  }, [currentDate.DateFrom, play, transitionTime])

  const [width, setWidth] = useState(0)
  const monthsDiff = useMemo(() => {
    return currentDate.DateTo.diff(currentDate.DateFrom, "month").months
  }, [currentDate])
  useEffect(() => {
    const px = monthsDiff * 96
    setWidth(px)
  }, [monthsDiff])

  function activatePlay (direction: number) {
    const next = getNextDate(direction, currentDate)

    if (next) {
      setSelected([])
      setPlay(direction)
      setTargetDate(next)
    }
  }

  return (
    <div className={"m-w-full " + props.className}>
      <div className='m-select-none m-absolute m-bottom-16 m-h-11 m-left-1/4 m-right-1/4'>
        <div className='m-absolute -m-top-6 m-left-1/2 m-font-bold m-text-center m-overflow-hidden'>
          <div className='m-absolute m-w-44 m-text-center -m-translate-x-1/2 m-backdrop-blur-md m-bg-white/3'>{!isDay ? (toDateString(currentDate.DateFrom) + " - " + toDateString(currentDate.DateTo)) : toDateString(currentDate.DateFrom)}</div>
        </div>
        <div className="m-absolute m-h-full m-w-full m-flex m-justify-center m-pointer-events-none"><div className='h-full w-0.5 bg-blue-800 z-10'></div></div>
        <div className={isDay ? 'm-hidden ' : 'm-absolute m-h-full m-top-0 m-opacity-30 m-left-1/2 m-z-5 m-bg-blue-300 m-border-x m-border-blue-800 m-z-10 m-pointer-events-none'} style={{ width: `${width}px`, marginLeft: `${-width / 2}px` }}></div>
        <div className='m-flex m-flex-row m-h-full m-justify-stretch m-gap-2.5'>
          <TimelineBar history={history} months={months} onSelect={select} startDate={startOffset} play={play} transitionTime={transitionTime} date={play == 0 ? centerDate : getDateBetween(currentDate, targetDate)} />
        </div>
      </div>
      
      <div className="m-flex m-flex-row m-justify-center m-flex-nowrap m-shrink-0 m-grow-0 m-mt-4 m-cursor-pointer">
        <span className='m-mr-5 m-backdrop-blur-md m-bg-white/3' title="Bakåt" onClick={() => { if (play === 0) { next(-1) } }}>
          <Icon name="skip_previous" className={'m-w-8 ' + (getNextDate(-1, currentDate) == undefined || play > 0 ? 'm-text-neutral-300' : 'm-text-primary')}></Icon>
        </span>
        <span className="m-backdrop-blur-md m-bg-white/3" title="Pausa uppspelning" onClick={() => { setPlay(0) }}>
          <Icon name="pause" className={'m-w-8 ' + (play === 0 ? 'm-text-neutral-300' : 'm-text-primary')}></Icon>
        </span>
        <span className="m-backdrop-blur-md m-bg-white/3" title="Spela upp aktiviteter" onClick={() => { if (getNextDate(1, currentDate) != undefined) { activatePlay(1) } }}>
          <Icon name="play_arrow" className={'m-w-8 ' + (play === 1 ? 'animate-pulse ' : '') + (getNextDate(1, currentDate) == undefined ? 'm-text-neutral-300' : 'm-text-primary')}></Icon>
        </span>
        <span className="m-backdrop-blur-md m-bg-white/3" title="Spela upp snabbare" onClick={() => { if (play >= 1) { setPlay(play + 3) } }}>
          <Icon name="fast_forward" className={'m-w-8 ' + (play > 1 ? 'animate-pulse ' : '') + (play === 0 ? 'm-text-neutral-300' : 'm-text-primary')}></Icon>
        </span>
        <span className='m-ml-5 m-backdrop-blur-md m-bg-white/3' title="Framåt" onClick={() => { if (play === 0) { next(1) } }}>
          <Icon name="skip_next" className={'m-w-8 ' + (getNextDate(1, currentDate) == undefined || play > 0 ? 'm-text-neutral-300' : 'm-text-primary')}></Icon>
        </span>
      </div>
    </div>
  )
}

export default Timeline
