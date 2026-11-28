// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from 'react-i18next'
import type { DateTime } from 'luxon'
import { type CSSProperties, useEffect, useId, useState } from 'react'
import type { TimelineSettings } from '../../store/analysis-store'
import { type Activity, type Actor, type Phase } from './analysis-data'
import { ActorBadge } from './PanelParts'
import { phaseStyle } from '../../utils/color'
import { toDateString } from '../../utils/date'

interface Props {
  activities: Activity[]
  lanes: string[]
  actors: Record<string, Actor>
  phases: Phase[]
  settings: TimelineSettings
  // The first and the last day the user chose, which the axis then goes from and to
  from?: DateTime
  to?: DateTime
}

const LABEL_W = 270
const LANE_H = 76
const LINE_Y = 45
const DATE_W = 80
// The space before the first day, so that an event early on the first day, its ring and its date, are not hidden under the names
const PAD = 48
const PHASE_COLORS = ['m:bg-blue-50 m:text-blue-950', 'm:bg-red-50 m:text-red-900', 'm:bg-gray-100 m:text-gray-700']

const centre = (lane: number) => lane * LANE_H + LINE_Y + 1

// The events of the chosen actors in order of time: one line per actor, each event on its time, with its relations to the actors as strokes
function TimelineDocument (props: Props) {
  const { t, i18n } = useTranslation()
  const { activities, lanes, actors, phases, settings } = props
  // The event the pointer or the keyboard is on, whose information is shown
  const [hover, setHover] = useState<{ key: string, style: CSSProperties }>()
  const hovered = hover?.key
  const tipId = useId()
  const show = (key: string, ring: HTMLElement) => { setHover({ key, style: placeInfo(ring) }) }
  const hide = () => { setHover(undefined) }

  // The information stays where it was put, so it is closed when the time line is scrolled
  useEffect(() => {
    if (hover == null) return
    window.addEventListener('scroll', hide, true)
    return () => { window.removeEventListener('scroll', hide, true) }
  }, [hover])
  // Day and month in the language of MLA
  const locale = i18n.language
  const DAY_W = settings.DayWidth
  const laneOf = new Map(lanes.map((key, i) => [key, i]))
  const shown = activities.filter(a => a.relations.some(r => laneOf.has(r.actorKey)))

  if (lanes.length === 0) {
    return <p className="m:p-6 m:text-[14px] m:text-gray-600">{t('choose an actor')}</p>
  }

  const dates = shown.map(a => a.date.toLocal())
  const start = (props.from ?? dates[0] ?? phases[0]?.from ?? null)?.startOf('day')
  if (start == null) {
    return <p className="m:p-6 m:text-[14px] m:text-gray-600">{t('no events')}</p>
  }

  const end = (props.to ?? dates.at(-1) ?? start).endOf('day')
  const days = Math.max(1, Math.ceil(end.diff(start, 'days').days))
  const plotW = days * DAY_W + 40
  const xOf = (d: DateTime) => d.toLocal().diff(start, 'days').days * DAY_W
  const label = (key: string) => (settings.LongLabel ? actors[key]?.longName : actors[key]?.name) ?? key

  // More hours on the axis the wider a day is
  const step = DAY_W >= 900 ? 1 : DAY_W >= 450 ? 3 : 6
  const hours = Array.from({ length: 23 }, (_, i) => i + 1).filter(h => h % step === 0)

  // A label that would cover the one before it on the same line is lifted one step
  const lastLabelX = new Map<string, number[]>()

  const drawn = shown.map(a => {
    const x = xOf(a.date)
    const rels = a.relations.filter(r => laneOf.has(r.actorKey))
    // The ring sits on the actor whose relation points to the event, else on the first
    const hub = rels.find(r => r.direction === 'from') ?? rels[0]
    const main = laneOf.get(hub.actorKey)!
    const others = rels.filter(r => r !== hub).map(r => ({ ...r, lane: laneOf.get(r.actorKey)! }))
    const lanesOf = [main, ...others.map(r => r.lane)]
    const top = centre(Math.min(...lanesOf))
    const bottom = centre(Math.max(...lanesOf))

    const place = (above: boolean) => {
      const key = main + (above ? 'a' : 'b')
      const levels = lastLabelX.get(key) ?? []
      let level = levels.findIndex(lx => x - lx >= DATE_W)
      if (level === -1) level = levels.length
      levels[level] = x
      lastLabelX.set(key, levels)
      return level
    }
    // The date never sits on a stroke: above the ring when the strokes go down, below when they go up, beside it when both
    const goesUp = others.some(r => r.lane < main)
    const goesDown = others.some(r => r.lane > main)
    let dateStyle: CSSProperties
    if (!goesUp) {
      const level = place(true)
      dateStyle = { left: x - DATE_W / 2, width: DATE_W, top: centre(main) - 34 - level * 15, textAlign: 'center', zIndex: 10 - level }
    } else if (!goesDown) {
      const level = place(false)
      dateStyle = { left: x - DATE_W / 2, width: DATE_W, top: centre(main) + 17 + level * 15, textAlign: 'center', zIndex: 10 - level }
    } else {
      dateStyle = { left: x + 17, top: centre(main) - 8, textAlign: 'left', zIndex: 10 }
    }

    // The arrow heads: at the actor when the relation points to it, at the ring when it points to the event
    const arrows: Array<{ down: boolean, y: number }> = []
    if (settings.ShowArrows) {
      for (const r of others) {
        const below = r.lane > main
        if (r.direction === 'to' || r.direction === 'both') {
          arrows.push(below ? { down: true, y: centre(r.lane) - 7 - 11 } : { down: false, y: centre(r.lane) + 7 })
        }
        if (r.direction === 'from' || r.direction === 'both') {
          arrows.push(below ? { down: false, y: centre(main) + 14 } : { down: true, y: centre(main) - 14 - 11 })
        }
      }
    }

    // What a stroke stands for, centred on it, half way between two lines
    const towards = (from: number, to: number) => centre(from) + (to > from ? LANE_H / 2 : -LANE_H / 2)
    let tags: Array<{ text: string, y: number }> = []
    if (settings.LineText === 'title' && others.length > 0) {
      const nearest = others.reduce((p, c) => (Math.abs(c.lane - main) < Math.abs(p.lane - main) ? c : p))
      tags = [{ text: a.title, y: towards(main, nearest.lane) }]
    } else if (settings.LineText === 'role') {
      tags = others.filter(r => r.role).map(r => ({ text: r.role, y: towards(r.lane, main) }))
    }

    const dateText = settings.ShowDate ? a.date.toLocal().setLocale(locale).toFormat('d MMM HH:mm') : a.date.toLocal().toFormat('HH:mm')
    return { a, x, main, others, top, bottom, dateStyle, dateText, arrows, tags }
  })

  const tip = drawn.find(d => d.a.key === hovered)

  return (
    <div className="m:relative m:pb-4" style={{ width: LABEL_W + PAD + plotW, minWidth: '100%' }}>
      <div className="m:sticky m:top-0 m:z-[3] m:flex m:bg-white">
        <div className="m:sticky m:left-0 m:z-[4] m:shrink-0 m:bg-white" style={{ width: LABEL_W }} />
        <div className="m:flex m:flex-col" style={{ marginLeft: PAD }}>
          {settings.ShowPhases && phases.length > 0 && <div className="m:relative m:h-[30px]" style={{ width: plotW }}>
            {phases.map((p, i) => {
              const from = Math.max(0, xOf(p.from))
              const to = p.until ? Math.min(plotW, xOf(p.until)) : plotW
              if (to <= 0 || from >= plotW) return null
              return <div key={p.id} className={'m:absolute m:top-1.5 m:h-[22px] m:rounded m:text-[12px] m:font-bold m:pl-2 m:flex m:items-center m:overflow-hidden m:whitespace-nowrap ' + (p.color ? '' : PHASE_COLORS[Math.min(i, 2)])}
                style={{ left: from, width: Math.max(0, to - from - 2), ...(p.color ? phaseStyle(p.color) : {}) }}>{p.name}</div>
            })}
          </div>}
          <div className="m:relative m:h-10 m:border-b m:border-gray-400" style={{ width: plotW }}>
            {Array.from({ length: days }, (_, d) => (
              <div key={d} className="m:absolute m:top-0.5 m:bottom-0 m:pl-1 m:border-l m:border-gray-400 m:text-[12px] m:font-bold" style={{ left: d * DAY_W }}>
                {start.plus({ days: d }).setLocale(locale).toFormat('d MMM')}
              </div>
            ))}
            {settings.ShowTicks && Array.from({ length: days }, (_, d) => hours.map(h => (
              <div key={d + '-' + h} className="m:absolute m:bottom-0 m:w-3 m:text-center m:text-[10px] m:text-gray-500 m:pb-[3px]" style={{ left: d * DAY_W + h / 24 * DAY_W - 6 }}>
                {String(h).padStart(2, '0')}
              </div>
            )))}
          </div>
        </div>
      </div>

      <div className="m:flex">
        <div className="m:sticky m:left-0 m:z-[2] m:shrink-0 m:bg-white m:pl-4 m:box-border m:flex m:flex-col" style={{ width: LABEL_W }}>
          {lanes.map(key => (
            <div key={key} className="m:flex m:items-center m:gap-2 m:pt-7 m:pr-2 m:box-border" style={{ height: LANE_H }}>
              {actors[key] && <ActorBadge icon={actors[key].icon} color={actors[key].iconColor} />}
              <div className="m:flex m:flex-col m:min-w-0">
                <div className="m:text-[14px] m:font-semibold m:leading-5 m:truncate">{label(key)}</div>
                <div className="m:text-[12px] m:text-gray-600 m:whitespace-nowrap">{actors[key]?.typeName}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="m:relative m:z-0" style={{ marginLeft: PAD, width: plotW, height: lanes.length * LANE_H }}>
          {lanes.map((key, i) => (
            // The line of the actor goes from its name out to the right, and the rings of its events sit on it
            <div key={key} className="m:absolute m:right-0 m:h-0.5 m:rounded-sm m:bg-gray-400" style={{ left: -18 - PAD, top: i * LANE_H + LINE_Y }} />
          ))}
          {drawn.map(d => (
            <div key={d.a.key}>
              <div className="m:absolute m:w-0.5" style={{ left: d.x - 1, top: d.top, height: d.bottom - d.top, background: d.a.color }} />
              {d.others.map(r => (
                <div key={r.actorKey} className="m:absolute m:w-3 m:h-3 m:rounded-full m:bg-white m:box-border" style={{ left: d.x - 6, top: centre(r.lane) - 6, border: '3px solid ' + d.a.color }} />
              ))}
              {d.arrows.map((ar, i) => (
                <div key={i} className="m:absolute m:w-0 m:h-0" style={{
                  left: d.x - 7, top: ar.y, borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
                  ...(ar.down ? { borderTop: '11px solid ' + d.a.color } : { borderBottom: '11px solid ' + d.a.color })
                }} />
              ))}
              {d.tags.map((tag, i) => (
                <div key={i} className="m:absolute m:z-[5] m:text-[11px] m:font-semibold m:bg-white m:rounded-full m:px-[7px] m:py-px m:whitespace-nowrap m:-translate-x-1/2 m:-translate-y-1/2"
                  style={{ left: d.x, top: tag.y, color: d.a.color, border: '1px solid ' + d.a.color }}>{tag.text}</div>
              ))}
              <div className="m:absolute m:text-[11px] m:font-bold m:whitespace-nowrap m:bg-white/90" style={d.dateStyle}>{d.dateText}</div>
              <div tabIndex={0} aria-label={d.a.n + ' ' + d.a.title} aria-describedby={hovered === d.a.key ? tipId : undefined}
                onMouseEnter={(e) => { show(d.a.key, e.currentTarget) }} onMouseLeave={hide}
                onFocus={(e) => { show(d.a.key, e.currentTarget) }} onBlur={hide}
                className={'m:absolute m:z-[6] m:w-6 m:h-6 m:rounded-full m:text-white m:text-[12px] m:font-bold m:flex m:items-center m:justify-center m:ring-[3px] m:ring-white m:cursor-default m:outline-none m:focus-visible:ring-primary ' + (hovered === d.a.key ? 'm:scale-125' : '')}
                style={{ left: d.x - 12, top: centre(d.main) - 12, background: d.a.color }}>{d.a.n}</div>
            </div>
          ))}
          {tip != null && hover != null && <EventInfo id={tipId} activity={tip.a} actors={actors} lanes={laneOf} style={hover.style} />}
        </div>
      </div>
    </div>
  )
}

const INFO_W = 320

// The nearest element that scrolls, whose edges the information has to stay inside
function scrollArea (element: HTMLElement): HTMLElement | undefined {
  for (let parent = element.parentElement; parent != null; parent = parent.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflow)) return parent
  }
  return undefined
}

// Where the information about an event goes: beside its ring on the side where there is room in what can be seen,
// and opening downwards in the upper half and upwards in the lower half
function placeInfo (ring: HTMLElement): CSSProperties {
  const r = ring.getBoundingClientRect()
  const area = scrollArea(ring)?.getBoundingClientRect() ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight)
  const left = r.right + 10 + INFO_W <= area.right ? r.right + 10 : Math.max(area.left + 4, r.left - 10 - INFO_W)
  return {
    position: 'fixed',
    width: INFO_W,
    left,
    ...(r.top < area.top + area.height / 2 ? { top: r.top - 6 } : { bottom: window.innerHeight - r.bottom - 6 })
  }
}

// Everything about an event: what it is, when, and who takes part in which role, also those that are not in the time line
function EventInfo (props: { id: string, activity: Activity, actors: Record<string, Actor>, lanes: Map<string, number>, style: CSSProperties }) {
  const { t } = useTranslation()
  const { activity: a, actors } = props
  const to = a.entity.DateTo != null && a.entity.DateFrom != null && !a.entity.DateTo.equals(a.entity.DateFrom) ? a.entity.DateTo : undefined
  const when = (d: DateTime) => toDateString(d) + ' ' + d.toLocal().toFormat('HH:mm')

  return (
    <div id={props.id} role="tooltip" style={props.style}
      className="m:z-[30] m:box-border m:flex m:flex-col m:gap-1.5 m:px-3.5 m:py-3 m:bg-white m:border m:border-gray-300 m:rounded-md m:shadow-lg m:pointer-events-none">
      <div className="m:flex m:items-start m:gap-2">
        <span className="m:w-[22px] m:h-[22px] m:shrink-0 m:rounded-full m:text-white m:text-[11px] m:font-bold m:flex m:items-center m:justify-center" style={{ background: a.color }}>{a.n}</span>
        <span className="m:text-[14px] m:leading-snug"><span className="m:font-semibold">{a.title}</span>{a.description && ' – ' + a.description}</span>
      </div>
      <div className="m:text-[12px] m:text-gray-600">{when(a.date)}{to != null && ' – ' + when(to)}</div>
      {a.relations.length > 0 && <ul className="m:flex m:flex-col m:gap-1 m:border-t m:border-gray-200 m:pt-2">
        {a.relations.map(r => {
          const actor = actors[r.actorKey]
          const chosen = props.lanes.has(r.actorKey)
          return (
            <li key={r.actorKey} className={'m:flex m:justify-between m:gap-3 m:text-[13px] ' + (chosen ? '' : 'm:text-gray-500')}>
              <span className="m:min-w-0 m:truncate">{actor?.name ?? r.actorKey}{!chosen && ' (' + t('actor not chosen') + ')'}</span>
              <span className="m:shrink-0 m:text-gray-600">{r.role || actor?.typeName}</span>
            </li>
          )
        })}
      </ul>}
    </div>
  )
}

export default TimelineDocument
