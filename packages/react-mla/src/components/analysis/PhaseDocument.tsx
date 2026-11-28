// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import useAnalysisStore, { type AnalysisSetup, type PhaseSettings } from '../../store/analysis-store'
import { toDateString } from '../../utils/date'
import { type Activity, type Actor, type Phase, phaseIndexOf } from './analysis-data'
import { ActorBadge } from './PanelParts'
import { phaseStyle } from '../../utils/color'

interface Props {
  phases: Phase[]
  activities: Activity[]
  groups: Array<{ id: string, title: string, keys: string[] }>
  actors: Record<string, Actor>
  setup: AnalysisSetup
  settings: PhaseSettings
}

const LABEL_W = 230
const ROW_H = 64

export function Ring (props: { activity: Activity, size?: number }) {
  const size = props.size ?? 24
  return (
    <span title={props.activity.title + (props.activity.description ? ' – ' + props.activity.description : '')}
      className="m:rounded-full m:text-white m:font-bold m:flex m:items-center m:justify-center m:shrink-0"
      style={{ width: size, height: size, fontSize: size > 22 ? 12 : 11, background: props.activity.color }}>
      {props.activity.n}
    </span>
  )
}

function dayLabel (date: DateTime, first: DateTime): number {
  return Math.floor(date.startOf('day').diff(first.startOf('day'), 'days').days) + 1
}

// The phase analysis: one column per phase with its activities and notes, and one row per chosen entity through the phases
function PhaseDocument (props: Props) {
  const { t, i18n } = useTranslation()
  const { phases, activities, groups, actors, setup, settings } = props
  const notes = useAnalysisStore((s) => s.notes)
  const setNote = useAnalysisStore((s) => s.setNote)
  const PHASE_W = settings.PhaseWidth

  if (phases.length === 0) {
    return <p className="m:p-6 m:text-[14px] m:text-gray-600">{t('no phases')}</p>
  }

  const byPhase = phases.map((_, i) => activities.filter(a => phaseIndexOf(a, phases) === i))
  const first = activities[0]?.date ?? phases[0].from
  const emptyText = setup.EmptyPhaseText ?? t('no info')
  const isGap = setup.EmptyPhaseText != null && setup.EmptyPhaseText !== ''
  const label = (key: string) => (settings.LongLabel ? actors[key]?.longName : actors[key]?.name) ?? key
  const nameOf = (key: string) => actors[key]?.name ?? key

  const phaseRange = (p: Phase, i: number) => {
    const last = p.until?.minus({ days: 1 }) ?? byPhase[i].at(-1)?.date
    // Day and month in the language of MLA, short enough to fit beside the name
    const short = (d: DateTime) => d.toLocal().setLocale(i18n.language).toFormat('d MMM')
    const from = short(p.from)
    const to = last != null ? short(last) : undefined
    return to != null && to !== from ? from + ' – ' + to : from
  }

  const cellBorder = 'm:border-l-2 m:border-dotted m:border-gray-300'
  const rowLabel = 'm:sticky m:left-0 m:z-[2] m:shrink-0 m:bg-white m:box-border'
  const sectionLabel = 'm:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600'

  return (
    <div className="m:relative" style={{ width: LABEL_W + phases.length * PHASE_W, minWidth: '100%' }}>
      <div className="m:sticky m:top-0 m:z-[3] m:flex m:bg-white m:border-b m:border-gray-300">
        <div className={rowLabel + ' m:z-[4] m:flex m:items-center m:pl-4 ' + sectionLabel} style={{ width: LABEL_W }}>{setup.PhaseLabel ?? t('phase')}</div>
        {phases.map((p, i) => (
          <div key={p.id} className="m:relative m:shrink-0 m:py-2.5 m:pr-3.5 m:pl-2.5" style={{ width: PHASE_W }}>
            <div className={'m:flex m:justify-between m:items-baseline m:gap-2 m:px-3 m:py-2.5 m:rounded' + (p.color ? '' : ' m:bg-blue-50 m:text-blue-950')}
              style={p.color ? phaseStyle(p.color) : undefined}>
              <span className="m:text-[14px] m:font-bold">{p.name}</span>
              <span className="m:text-[12px] m:font-medium m:whitespace-nowrap">{phaseRange(p, i)}</span>
            </div>
            {i < phases.length - 1 && <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="m:absolute m:-right-2 m:top-1/2 m:-translate-y-1/2 m:z-[1]"><path d="M5 3l6 6-6 6" fill="none" stroke="#8792a2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
        ))}
      </div>

      <div className="m:flex m:border-b m:border-gray-200">
        <div className={rowLabel + ' m:pt-3.5 m:pl-4 ' + sectionLabel} style={{ width: LABEL_W }}>{t('activities')}</div>
        {phases.map((p, i) => (
          <div key={p.id} className={'m:shrink-0 m:pt-3.5 m:pr-3.5 m:pb-4 m:pl-2.5 m:flex m:flex-col m:gap-3 ' + cellBorder} style={{ width: PHASE_W }}>
            {byPhase[i].map((a, j) => {
              let day = t('day n', { n: dayLabel(a.date, first) })
              if (settings.DateDiff && j > 0) {
                const diff = Math.floor(a.date.startOf('day').diff(byPhase[i][j - 1].date.startOf('day'), 'days').days)
                day = diff === 0 ? t('same day') : '+' + diff + ' d'
              }
              return (
                <div key={a.key} className="m:grid m:grid-cols-[52px_26px_minmax(0,1fr)] m:gap-x-2 m:items-start">
                  <div className="m:text-[12px] m:font-bold m:text-gray-600 m:text-right m:pt-1 m:whitespace-nowrap">{day}</div>
                  <Ring activity={a} />
                  <div className="m:flex m:flex-col m:gap-0.5 m:min-w-0">
                    <span className="m:text-[13px]"><span className="m:font-semibold">{a.title}</span>{a.description && ' – ' + a.description}</span>
                    <span className="m:text-[12px]">{toDateString(a.date)} {a.date.toLocal().toFormat('HH:mm')}</span>
                    {settings.ShowRoles && a.relations.length > 0 && <span className="m:text-[12px] m:text-gray-600">
                      {a.relations.map(r => nameOf(r.actorKey) + (r.role ? ' (' + r.role.toLowerCase() + ')' : '')).join(', ')}
                    </span>}
                  </div>
                </div>
              )
            })}
            {byPhase[i].length === 0 && <div className={isGap
              ? 'm:text-[13px] m:font-semibold m:text-amber-900 m:bg-amber-50 m:border m:border-dashed m:border-amber-500 m:rounded m:p-2.5 m:text-center'
              : 'm:text-[13px] m:italic m:text-gray-600'}>{emptyText}</div>}
          </div>
        ))}
      </div>

      {setup.NoteRows.map(row => (
        <div key={row} className="m:flex m:border-b m:border-gray-200">
          <div className={rowLabel + ' m:pt-3 m:pr-3 m:pl-4 ' + sectionLabel} style={{ width: LABEL_W }}>{row}</div>
          {phases.map(p => (
            <div key={p.id} className={'m:shrink-0 m:py-1.5 m:pr-2.5 m:pl-1.5 ' + cellBorder} style={{ width: PHASE_W }}>
              <textarea rows={3} value={notes[p.id]?.[row] ?? ''} placeholder={t('add text')} aria-label={row + ', ' + p.name}
                onChange={(e) => { setNote(p.id, row, e.target.value) }}
                className="m:w-full m:box-border m:resize-y m:text-[13px] m:leading-snug m:border m:border-transparent m:hover:border-gray-300 m:focus:border-primary m:focus:bg-white m:rounded m:px-1.5 m:py-1 m:bg-transparent" />
            </div>
          ))}
        </div>
      ))}

      {groups.map(group => {
        const rows = group.keys.map(key => {
          const inPhase = byPhase.map(list => list.filter(a => a.relations.some(r => r.actorKey === key)))
          const present = inPhase.map((list, i) => (list.length > 0 ? i : -1)).filter(i => i >= 0)
          return { key, inPhase, first: present.length ? Math.min(...present) : -1, last: present.length ? Math.max(...present) : -1 }
        }).filter(r => settings.ShowEmpty || r.first !== -1)

        return (
          <div key={group.id}>
            <div className="m:flex">
              <div className={rowLabel + ' m:pt-3.5 m:pb-1.5 m:pl-4 ' + sectionLabel} style={{ width: LABEL_W }}>{group.title}</div>
            </div>
            {rows.map(r => {
              const actor = actors[r.key]
              return (
                <div key={r.key} className="m:flex">
                  <div className={rowLabel + ' m:flex m:items-center m:gap-2 m:pr-2 m:pl-4'} style={{ width: LABEL_W, height: ROW_H }}>
                    {actor && <ActorBadge icon={actor.icon} color={actor.iconColor} />}
                    <div className="m:flex m:flex-col m:min-w-0">
                      <div className="m:text-[14px] m:font-semibold m:truncate">{label(r.key)}</div>
                      <div className="m:text-[12px] m:text-gray-600 m:whitespace-nowrap">{actor?.typeName}</div>
                    </div>
                  </div>
                  {r.inPhase.map((list, i) => {
                    const span = r.first !== -1 && r.first !== r.last && i >= r.first && i <= r.last
                    const roles = [...new Set(list.map(a => a.relations.find(x => x.actorKey === r.key)?.role ?? '').filter(x => x))].join(', ')
                    return (
                      <div key={i} className={'m:relative m:shrink-0 m:box-border ' + cellBorder} style={{ width: PHASE_W, height: ROW_H }}>
                        <div className="m:absolute m:inset-x-0 m:h-0.5 m:bg-gray-300" style={{ top: ROW_H / 2 - 1 }} />
                        {span && <div className="m:absolute m:h-1 m:rounded m:bg-primary" style={{ top: ROW_H / 2 - 2, left: i === r.first ? '50%' : 0, right: i === r.last ? '50%' : 0 }} />}
                        <div className="m:absolute m:inset-x-0 m:z-[1] m:flex m:justify-center m:gap-1" style={{ top: ROW_H / 2 - 11 }}>
                          {list.map(a => <span key={a.key} className="m:rounded-full m:ring-[3px] m:ring-white"><Ring activity={a} size={22} /></span>)}
                        </div>
                        {settings.ShowRoles && roles && <div className="m:absolute m:inset-x-0 m:text-center m:text-[11px] m:text-gray-600 m:truncate m:px-1.5" style={{ top: ROW_H / 2 + 15 }}>{roles}</div>}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )
      })}
      <div className="m:h-4" />
    </div>
  )
}

export default PhaseDocument
