// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useCallback, useEffect, useRef, useState } from 'react'
import useResize from '../../effects/resize'
import { toDateAndTimeString } from '../../utils/date'
import { DateTime } from 'luxon'
import { HistoryDot, calculatePixelOffset } from './common'

interface Props {
  date: DateTime
  history: HistoryDot[]
  months: string[]
  transitionTime: number
  play: number
  startDate: DateTime
  onSelect: (h: HistoryDot) => void
}

export default function TimelineBar (props: Props) {
  const { date, startDate, transitionTime, history, months, play, onSelect} = props;

  function select (item: HistoryDot) {
    onSelect(item)
  }

  const [width, setWidth] = useState(0);
  const onResize = useCallback((target: HTMLDivElement) => {
    setWidth(target.offsetWidth);
  }, []);

  const resizeRef = useResize(onResize);
  const first = useRef(true);
  const [style, setStyle] = useState({ transform: '', transitionProperty: '', transitionTimingFunction: '', transitionDuration: ''})
  useEffect(() => {
    if (width == 0) {
      return
    }
    
    const px = -(calculatePixelOffset(date, startDate) - width / 2)
    
    if (first.current) {
      setStyle({ transform: `translateX(${px}px)`, transitionProperty: '', transitionTimingFunction: '', transitionDuration: '' })
      first.current = false
    } else {
      setStyle({ transform: `translateX(${px}px)`, transitionProperty: 'transform' , transitionTimingFunction: play == 0 ? 'ease-in-out' : 'linear', transitionDuration: `${play == 0 ? 250 : transitionTime+500}ms` })
    }

  }, [date, play, transitionTime, width, startDate])

  return (
    <div className={'m-border m-overflow-hidden m-rounded m-shadow m-bg-white ' + (width === 0 ? 'm-opacity-0' : '')} ref={resizeRef}>
      <div className="m-flex m-flex-row m-flex-nowrap" style={style}>
        {months.map((m, i) => <div className='m-w-[96px] m-shrink-0' key={i}>
          <div className='m-mh-1/2 m-text-center m-border-r m-border-b'>{m}</div>
        </div>)}
      </div>
      <div className="m-flex m-flex-row m-flex-nowrap" style={style}>
        <div className="m-absolute">
          {history.map((m, i) => <span key={i + m.rubrik} title={m.rubrik + '\n' + toDateAndTimeString(m.date)} onClick={() => { select(m) }}>
            <svg className={'m-h-3 m-w-3 m-mt-2 m-absolute m-cursor-pointer'} style={{ left: `${m.offset - 6}px` }} >
              <circle cx="5" cy="5" r="5" fill={m.color} />
            </svg>
          </span>)}
        </div>
      </div>
    </div>
  )
}
