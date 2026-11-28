// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useMainStore from '../../store/main-store'
import useAppStore from '../../store/app-store'
import useAnalysisStore from '../../store/analysis-store'
import { toDateString } from '../../utils/date'
import { type Actor, countOtherLinks, getActivities, getActor, getActorKeys, getPhases, getUndatedActivities, inPeriod, periodOf, phasesOutside } from './analysis-data'
import configService from '../../services/configurationService'
import SelectionPanel, { type SelectionGroup } from './SelectionPanel'
import { PhaseSettingsPanel, TimelineSettingsPanel } from './SettingsPanels'
import PhaseDocument from './PhaseDocument'
import TimelineDocument from './TimelineDocument'
import { CollapsedPanel, Warnings } from './PanelParts'
import DateField from '../common/DateField'

// The time line and the phase analysis, shown instead of the chart: the choice to the left, the document, and the settings to the right
function AnalysisView (props: { className?: string }) {
  const { t } = useTranslation()
  const view = useAnalysisStore((s) => s.view)
  const storedSetup = useAnalysisStore((s) => s.setup)
  const timelineChosen = useAnalysisStore((s) => s.timelineChosen)
  const phaseChosen = useAnalysisStore((s) => s.phaseChosen)
  const excluded = useAnalysisStore((s) => s.excluded)
  const timeline = useAnalysisStore((s) => s.timeline)
  const phase = useAnalysisStore((s) => s.phase)
  const selectionOpen = useAnalysisStore((s) => s.selectionOpen)
  const settingsOpen = useAnalysisStore((s) => s.view != null && s.settingsOpen[s.view])
  const setSelectionOpen = useAnalysisStore((s) => s.setSelectionOpen)
  const setSettingsOpen = useAnalysisStore((s) => s.setSettingsOpen)
  const setChosen = useAnalysisStore((s) => s.setChosen)
  const setExcluded = useAnalysisStore((s) => s.setExcluded)
  const setTimeline = useAnalysisStore((s) => s.setTimeline)
  const setPhase = useAnalysisStore((s) => s.setPhase)

  const entities = useMainStore((s) => s.entities)
  const links = useMainStore((s) => s.links)
  const phaseEvents = useMainStore((s) => s.phaseEvents)
  const viewConfig = useAppStore((s) => s.currentViewConfiguration)

  const setup = useMemo(() => storedSetup ?? useAnalysisStore.getState().getSetup(), [storedSetup])
  // Each view has its own basis: the time line its own, the phase analysis the one of its setup
  const timelineSource = timeline.Source
  const basis = useMemo(() => (view === 'timeline' ? (timelineSource ?? useAnalysisStore.getState().getTimelineSource()) : setup), [view, timelineSource, setup])
  const source = useMemo(() => ({ activityTypeId: basis.EntityTypeId, linkTypeId: basis.LinkTypeId, rolePropertyId: basis.LinkPropertyId }), [basis.EntityTypeId, basis.LinkTypeId, basis.LinkPropertyId])
  const allActivities = useMemo(() => getActivities(entities, links, source, viewConfig), [entities, links, source, viewConfig])
  // Each view covers the days the user chose for it, or else all
  const { From: periodFrom, To: periodTo } = view === 'timeline' ? timeline : phase
  const activities = useMemo(() => inPeriod(allActivities, periodFrom, periodTo), [allActivities, periodFrom, periodTo])
  // Activities without a date, such as one just made in the chart, can not be placed in time, but who takes part in them can be chosen
  const undated = useMemo(() => getUndatedActivities(entities, links, source, viewConfig), [entities, links, source, viewConfig])
  const otherLinks = useMemo(() => countOtherLinks(entities, links, source), [entities, links, source])
  const phases = useMemo(() => getPhases(phaseEvents), [phaseEvents])

  // Every entity in the chart can be chosen, also one that is not linked to an activity yet
  const actors = useMemo(() => {
    const result: Record<string, Actor> = {}
    for (const [key, versions] of Object.entries(entities)) {
      const entity = versions[0]
      if (entity != null && entity.TypeId !== basis.EntityTypeId) {
        result[key] = getActor(entity, viewConfig)
      }
    }
    return result
  }, [entities, basis.EntityTypeId, viewConfig])
  // Until the user chooses, the ones that take part in the activities are chosen, in the order they first take part
  const linkedKeys = useMemo(() => getActorKeys([...allActivities, ...undated]), [allActivities, undated])
  const actorKeys = Object.keys(actors)

  if (view == null) {
    return null
  }

  const countOf = (key: string) => [...activities, ...undated].filter(a => a.relations.some(r => r.actorKey === key)).length
  const countText = (key: string) => {
    const n = countOf(key)
    return view === 'timeline' ? t('n events', { count: n }) : t('n activities', { count: n })
  }

  // What is chosen: what the user chose, of what is still there, or else all
  const stored = view === 'timeline' ? timelineChosen : phaseChosen
  const chosen = (stored ?? linkedKeys).filter(key => actors[key] != null)
  const typeOf = (key: string) => actors[key]?.entity.TypeId

  let groups: SelectionGroup[]
  let groupOfKey: (key: string) => SelectionGroup | undefined
  if (view === 'timeline') {
    groups = [{ id: 'all', title: t('chosen actors'), keys: chosen }]
    groupOfKey = () => groups[0]
  } else {
    groups = setup.Groups.map(g => ({ id: g.Id, title: g.Name, keys: chosen.filter(key => g.EntityTypeIds.includes(typeOf(key) ?? '')) }))
    groupOfKey = (key) => groups.find(g => setup.Groups.find(x => x.Id === g.id)?.EntityTypeIds.includes(typeOf(key) ?? ''))
  }
  const unchosen = actorKeys.filter(key => !chosen.includes(key))
    .sort((a, b) => actors[a].name.localeCompare(actors[b].name, 'sv'))
    .map(key => ({ key, groupName: groupOfKey(key)?.title }))

  // A group is reordered in the places its entities have in the common order
  function reorder (groupId: string, keys: string[]) {
    const group = groups.find(g => g.id === groupId)
    if (group == null) return
    const queue = [...keys]
    const inGroup = new Set(keys)
    const base = chosen.some(key => inGroup.has(key)) ? chosen : [...chosen, ...keys]
    const withNew = [...base, ...keys.filter(key => !base.includes(key))]
    setChosen(view!, withNew.map(key => (inGroup.has(key) ? queue.shift()! : key)))
  }

  // All dates go from the first phase or activity to the last; the time line counts its phases only when it shows them
  const rangePhases = view === 'timeline' && !timeline.ShowPhases ? [] : phases
  const range = periodOf(periodFrom, periodTo, allActivities, rangePhases)

  const title = (view === 'timeline' ? timeline.Title : phase.Title) || defaultTitle()
  function defaultTitle () {
    const { first, last } = range
    const period = first && last ? ' ' + toDateString(first) + ' – ' + toDateString(last) : ''
    return (view === 'timeline' ? t('event flow') : t('phase analysis')) + period
  }

  const lanes = chosen
  const typeName = (id?: string) => (id ? (configService.getEntityConfiguration(id)?.Name ?? configService.getLinkConfiguration(id)?.Name ?? id) : '')
  const notices: string[] = []
  if (allActivities.length === 0 && undated.length === 0) {
    notices.push(t('no activities of type', { type: typeName(basis.EntityTypeId) }))
  } else if (allActivities.length > 0 && activities.length === 0) {
    notices.push(t('no activities in period'))
  }
  if (undated.length > 0) {
    notices.push(t('undated activities', { count: undated.length }))
  }
  if (otherLinks > 0) {
    notices.push(t('other link types', { count: otherLinks, type: typeName(basis.LinkTypeId) }))
  }
  const shownActivities = view === 'timeline' ? activities.filter(a => !excluded.includes(a.key)) : activities

  // The phases that are in the period the user chose for the phase analysis
  const periodPhases = periodFrom || periodTo ? phases.filter(p => phasesOutside([p], range.first, range.last).length === 0) : phases

  const setPeriod = (patch: { From?: string, To?: string }) => {
    if (view === 'timeline') setTimeline(patch); else setPhase(patch)
  }
  const whole = periodOf(undefined, undefined, allActivities, rangePhases)
  const dayField = 'm:w-full m:box-border m:bg-white m:border m:border-gray-300 m:text-gray-900 m:text-[14px] m:rounded m:px-1.5 m:py-1'
  const periodFields = (
    <section aria-label={t('period')} className="m:flex m:flex-col m:gap-1.5 m:px-4 m:py-3 m:border-b m:border-gray-200">
      <div className="m:flex m:items-baseline m:justify-between">
        <h3 className="m:text-[14px] m:font-bold">{t('period')}</h3>
        {(periodFrom || periodTo)
          ? <button type="button" onClick={() => { setPeriod({ From: undefined, To: undefined }) }} className="m:text-[12px] m:text-blue-700 m:cursor-pointer">{t('all dates')}</button>
          : <span className="m:text-[12px] m:text-gray-600">{t('all dates')}</span>}
      </div>
      <div className="m:grid m:grid-cols-2 m:gap-2">
        <label className="m:flex m:flex-col m:gap-0.5 m:text-[12px] m:font-semibold m:text-gray-700">{t('from')}
          {/* Without a date of its own, it shows the first date there is, and has nothing to empty */}
          <DateField name={t('from')} label={false} value={periodFrom ?? whole.first?.toISODate() ?? ''} max={periodTo} className={dayField} clearable={periodFrom != null}
            onChange={(value) => { setPeriod({ From: value || undefined }) }} />
        </label>
        <label className="m:flex m:flex-col m:gap-0.5 m:text-[12px] m:font-semibold m:text-gray-700">{t('to')}
          <DateField name={t('to')} label={false} value={periodTo ?? whole.last?.toISODate() ?? ''} min={periodFrom} className={dayField} clearable={periodTo != null}
            onChange={(value) => { setPeriod({ To: value || undefined }) }} />
        </label>
      </div>
    </section>
  )

  return (
    <div className={'m:flex m:bg-gray-100 ' + (props.className ?? '')}>
      {selectionOpen
        ? <SelectionPanel
          help={view === 'timeline' ? t('selection help timeline') : t('selection help phase')}
          groups={groups}
          unchosen={unchosen}
          emptyText={actorKeys.length === 0 ? t('no entities in chart') : undefined}
          period={periodFields}
          actors={actors}
          countText={countText}
          onReorder={reorder}
          onRemove={(key) => { setChosen(view, chosen.filter(k => k !== key)) }}
          onAdd={(key) => {
            const group = groupOfKey(key)
            if (group) reorder(group.id, [...group.keys, key])
          }}
          onHide={() => { setSelectionOpen(false) }}>
          {view === 'timeline' && <section className="m:flex-[3_1_0] m:min-h-0 m:flex m:flex-col m:border-t m:border-gray-200">
            <div className="m:shrink-0 m:px-4 m:pt-3 m:pb-1.5 m:flex m:justify-between m:items-baseline">
              <h3 className="m:text-[15px] m:font-bold">{t('events')}</h3>
              <div className="m:flex m:gap-2.5 m:text-[12px]">
                <button type="button" className="m:text-blue-700 m:cursor-pointer" onClick={() => { setExcluded([]) }}>{t('all')}</button>
                <button type="button" className="m:text-blue-700 m:cursor-pointer" onClick={() => { setExcluded(activities.map(a => a.key)) }}>{t('none')}</button>
              </div>
            </div>
            <ul className="m:flex-1 m:min-h-0 m:overflow-y-auto m:px-2 m:pb-3">
              {activities.map(a => {
                const on = !excluded.includes(a.key)
                return (
                  <li key={a.key}>
                    <label className={'m:flex m:gap-2.5 m:items-start m:p-2 m:rounded m:cursor-pointer ' + (on ? '' : 'm:opacity-55')}>
                      <input type="checkbox" checked={on} className="m:w-4 m:h-4 m:mt-0.5 m:accent-primary"
                        onChange={() => { setExcluded(on ? [...excluded, a.key] : excluded.filter(k => k !== a.key)) }} />
                      <span className="m:w-[22px] m:h-[22px] m:shrink-0 m:rounded-full m:text-white m:text-[11px] m:font-bold m:flex m:items-center m:justify-center" style={{ background: a.color }}>{a.n}</span>
                      <span className="m:flex m:flex-col m:gap-0.5 m:min-w-0">
                        <span className="m:text-[13px]"><span className="m:font-semibold">{a.title}</span>{a.description && ' – ' + a.description}</span>
                        <span className="m:text-[12px]">{toDateString(a.date)} {a.date.toLocal().toFormat('HH:mm')}</span>
                      </span>
                    </label>
                  </li>
                )
              })}
              {undated.map(a => (
                <li key={a.key} className="m:flex m:gap-2.5 m:items-start m:p-2 m:opacity-70">
                  <input type="checkbox" checked={false} disabled aria-label={a.title + ', ' + t('no date')} className="m:w-4 m:h-4 m:mt-0.5" />
                  <span className="m:w-[22px] m:h-[22px] m:shrink-0 m:rounded-full m:border-2 m:border-dashed m:border-gray-400" aria-hidden="true" />
                  <span className="m:flex m:flex-col m:gap-0.5 m:min-w-0">
                    <span className="m:text-[13px]"><span className="m:font-semibold">{a.title}</span>{a.description && ' – ' + a.description}</span>
                    <span className="m:text-[12px] m:font-semibold m:text-amber-900">{t('no date')}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>}
        </SelectionPanel>
        : <CollapsedPanel label={t('selection')} showLabel={t('show selection')} side="left" onShow={() => { setSelectionOpen(true) }} />}

      <main className="m:flex-1 m:min-w-0 m:p-5 m:flex m:flex-col m:min-h-0">
        <div className="m:flex-1 m:min-h-0 m:bg-white m:border m:border-gray-300 m:shadow-sm m:flex m:flex-col">
          <div className="m:flex m:items-center m:gap-3 m:border-b-2 m:border-gray-400 m:px-5 m:pt-4 m:pb-3.5">
            <input type="text" value={title} aria-label={t('heading')} title={t('click to change heading')}
              onChange={(e) => { if (view === 'timeline') setTimeline({ Title: e.target.value }); else setPhase({ Title: e.target.value }) }}
              className="m:flex-1 m:min-w-0 m:text-xl m:font-bold m:border m:border-transparent m:hover:border-gray-300 m:focus:border-primary m:rounded m:px-1.5 m:py-0.5 m:-ml-2 m:bg-transparent" />
          </div>
          <div className="m:flex-1 m:min-h-0 m:overflow-auto m:relative">
            {view === 'timeline'
              ? <TimelineDocument activities={shownActivities} lanes={lanes} actors={actors} phases={phases} settings={timeline}
                from={range.first} to={range.last} />
              : <PhaseDocument phases={periodPhases} activities={activities} groups={groups} actors={actors} setup={setup} settings={phase} />}
          </div>
          <div className="m:flex m:items-center m:gap-4 m:border-t m:border-gray-300 m:px-5 m:py-2">
            {notices.length > 0 && <Warnings texts={notices} />}
            <p className="m:flex-1 m:min-w-0 m:text-[12px] m:text-gray-600">{view === 'timeline' ? t('timeline footer') : t('phase footer')}</p>
          </div>
        </div>
      </main>

      {settingsOpen
        ? (view === 'timeline' ? <TimelineSettingsPanel /> : <PhaseSettingsPanel />)
        : <CollapsedPanel label={t('settings')} showLabel={t('show settings')} side="right" onShow={() => { setSettingsOpen(true) }} />}
    </div>
  )
}

export default AnalysisView
