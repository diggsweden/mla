// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import configService from '../../services/configurationService'
import useAnalysisStore, { type AnalysisSource, type LineText } from '../../store/analysis-store'
import GroupEditor from './GroupEditor'
import { MinusIcon, PanelHeading, SquareButton } from './PanelParts'

const fieldClass = 'm:text-[13px] m:font-normal m:px-1.5 m:py-1.5 m:border m:border-gray-300 m:rounded m:bg-white m:text-gray-900'

function Check (props: { label: string, help?: string, checked: boolean, onChange: () => void }) {
  return (
    <label className="m:flex m:items-start m:gap-2.5 m:text-[13px] m:leading-snug m:cursor-pointer">
      <input type="checkbox" checked={props.checked} onChange={props.onChange} className="m:w-4 m:h-4 m:mt-px m:accent-primary" />
      <span className="m:flex m:flex-col m:gap-0.5">
        <span className="m:font-semibold">{props.label}</span>
        {props.help && <span className="m:text-[12px] m:text-gray-600">{props.help}</span>}
      </span>
    </label>
  )
}

function Field (props: { label: string, help?: string, children: ReactNode }) {
  return (
    <label className="m:flex m:flex-col m:gap-1 m:text-[13px] m:font-semibold">
      {props.label}
      {props.children}
      {props.help && <span className="m:text-[12px] m:font-normal m:text-gray-600">{props.help}</span>}
    </label>
  )
}

function Heading (props: { children: ReactNode }) {
  return <h3 className="m:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600">{props.children}</h3>
}

function Shell (props: { children: ReactNode, tabs?: ReactNode }) {
  const { t } = useTranslation()
  const setOpen = useAnalysisStore((s) => s.setSettingsOpen)
  return (
    <aside aria-label={t('settings')} className="m:w-[300px] m:shrink-0 m:bg-white m:border-l m:border-gray-300 m:flex m:flex-col m:min-h-0">
      <PanelHeading title={t('settings')} hideLabel={t('hide settings')} side="right" onHide={() => { setOpen(false) }} />
      {props.tabs}
      <div className="m:flex-1 m:min-h-0 m:overflow-y-auto m:px-4 m:pt-3.5 m:pb-4">{props.children}</div>
    </aside>
  )
}

// What a view is built on: the type that is an activity, the type of link to the ones that take part, and the role
function SourceFields (props: { source: AnalysisSource, onChange: (patch: Partial<AnalysisSource>) => void }) {
  const { t } = useTranslation()
  const { source, onChange } = props
  const config = configService.getConfiguration()
  const entityTypes = config.Domain.EntityTypes.filter(x => x.Internal !== true)
  const linkTypes = config.Domain.LinkTypes.filter(x => x.Internal !== true)
  const linkProperties = linkTypes.find(x => x.TypeId === source.LinkTypeId)?.Properties ?? []
  return (
    <>
      <Field label={t('activities are')}>
        <select value={source.EntityTypeId} onChange={(e) => { onChange({ EntityTypeId: e.target.value }) }} className={fieldClass}>
          {entityTypes.map(x => <option key={x.TypeId} value={x.TypeId}>{x.Name ?? x.TypeId}</option>)}
        </select>
      </Field>
      <Field label={t('linked by')}>
        <select value={source.LinkTypeId ?? ''} onChange={(e) => { onChange({ LinkTypeId: e.target.value || undefined, LinkPropertyId: undefined }) }} className={fieldClass}>
          <option value="">{t('all link types')}</option>
          {linkTypes.map(x => <option key={x.TypeId} value={x.TypeId}>{x.Name ?? x.TypeId}</option>)}
        </select>
      </Field>
      <Field label={t('role from')}>
        <select value={source.LinkPropertyId ?? ''} onChange={(e) => { onChange({ LinkPropertyId: e.target.value || undefined }) }} className={fieldClass}>
          <option value="">{t('none')}</option>
          {linkProperties.map(x => <option key={x.TypeId} value={x.TypeId}>{x.Name ?? x.TypeId}</option>)}
        </select>
      </Field>
    </>
  )
}

// What the time line is built on, and what it shows
export function TimelineSettingsPanel () {
  const { t } = useTranslation()
  const settings = useAnalysisStore((s) => s.timeline)
  const set = useAnalysisStore((s) => s.setTimeline)
  const source = settings.Source ?? useAnalysisStore.getState().getTimelineSource()
  return (
    <Shell>
      <div className="m:flex m:flex-col m:gap-4">
        <div className="m:flex m:flex-col m:gap-2 m:pb-3 m:border-b m:border-gray-200">
          <Heading>{t('basis')}</Heading>
          <SourceFields source={source} onChange={(patch) => { set({ Source: { ...source, ...patch } }) }} />
          <p className="m:text-[12px] m:text-gray-600">{t('basis of the event flow help')}</p>
        </div>
        <Check label={t('show phases')} help={t('show phases help')} checked={settings.ShowPhases} onChange={() => { set({ ShowPhases: !settings.ShowPhases }) }} />
        <Check label={t('date at each event')} help={t('date at each event help')} checked={settings.ShowDate} onChange={() => { set({ ShowDate: !settings.ShowDate }) }} />
        <Check label={t('hours on the axis')} help={t('hours on the axis help')} checked={settings.ShowTicks} onChange={() => { set({ ShowTicks: !settings.ShowTicks }) }} />
        <Check label={t('show direction')} help={t('show direction help')} checked={settings.ShowArrows} onChange={() => { set({ ShowArrows: !settings.ShowArrows }) }} />
        <Field label={t('text on the lines')} help={t('text on the lines help')}>
          <select value={settings.LineText} onChange={(e) => { set({ LineText: e.target.value as LineText }) }} className={fieldClass}>
            <option value="title">{t('title of the event')}</option>
            <option value="role">{t('label of the relation')}</option>
            <option value="none">{t('none')}</option>
          </select>
        </Field>
        <Field label={t('width per day')} help={t('px per day', { width: settings.DayWidth })}>
          <input type="range" min={90} max={1440} step={10} value={settings.DayWidth} onChange={(e) => { set({ DayWidth: Number(e.target.value) }) }} className="m:accent-primary" />
        </Field>
        <Check label={t('long label')} help={t('long label help')} checked={settings.LongLabel} onChange={() => { set({ LongLabel: !settings.LongLabel }) }} />
      </div>
    </Shell>
  )
}

// How the phase analysis is set up, and what it shows
export function PhaseSettingsPanel () {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'setup' | 'view'>('setup')
  const setup = useAnalysisStore((s) => s.setup) ?? useAnalysisStore.getState().getSetup()
  const changeSetup = useAnalysisStore((s) => s.changeSetup)
  const applyPreset = useAnalysisStore((s) => s.applyPreset)
  const settings = useAnalysisStore((s) => s.phase)
  const set = useAnalysisStore((s) => s.setPhase)
  const [newNote, setNewNote] = useState('')

  const config = configService.getConfiguration()
  const presets = config.TimeAnalysis?.PhaseAnalysis?.Presets ?? []
  const templates = config.TimeAnalysis?.PhaseAnalysis?.PhaseTemplates ?? []
  const entityTypes = config.Domain.EntityTypes.filter(x => x.Internal !== true)
  const groupTypes = entityTypes.filter(x => x.TypeId !== setup.EntityTypeId).map(x => ({ id: x.TypeId, name: x.Name ?? x.TypeId }))

  const tabs = (
    <div role="tablist" aria-label={t('settings')} className="m:flex m:border-b m:border-gray-300 m:px-4">
      {(['setup', 'view'] as const).map(key => (
        <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => { setTab(key) }}
          className={'m:text-[13px] m:px-3 m:py-2 m:-mb-px m:border-b-2 m:cursor-pointer ' + (tab === key ? 'm:font-bold m:border-primary m:text-gray-900' : 'm:font-medium m:border-transparent m:text-gray-600')}>
          {key === 'setup' ? t('setup') : t('display')}
        </button>
      ))}
    </div>
  )

  return (
    <Shell tabs={tabs}>
      {tab === 'setup' && <div className="m:flex m:flex-col m:gap-4">
        <Field label={t('preset')} help={t('preset help')}>
          <select value={setup.Preset} onChange={(e) => { if (e.target.value) applyPreset(e.target.value) }} className={fieldClass}>
            {presets.map(p => <option key={p.Name} value={p.Name}>{p.Name}</option>)}
            <option value="">{t('own preset')}</option>
          </select>
        </Field>

        <div className="m:flex m:flex-col m:gap-2 m:pt-3 m:border-t m:border-gray-200">
          <Heading>{t('basis')}</Heading>
          <SourceFields source={setup} onChange={changeSetup} />
          {templates.length > 0 && <p className="m:text-[12px] m:text-gray-600">{t('phase templates help')}</p>}
        </div>

        <div className="m:flex m:flex-col m:gap-2 m:pt-3 m:border-t m:border-gray-200">
          <Heading>{t('groups')}</Heading>
          <GroupEditor groups={setup.Groups} types={groupTypes} onChange={(groups) => { changeSetup({ Groups: groups }) }} />
        </div>

        <div className="m:flex m:flex-col m:gap-2 m:pt-3 m:border-t m:border-gray-200">
          <Heading>{t('note rows per phase')}</Heading>
          <ul className="m:flex m:flex-col m:gap-1.5">
            {setup.NoteRows.map(row => (
              <li key={row} className="m:flex m:items-center m:gap-2 m:text-[13px]">
                <span className="m:flex-1">{row}</span>
                <SquareButton label={t('remove row', { name: row })} onClick={() => { changeSetup({ NoteRows: setup.NoteRows.filter(x => x !== row) }) }}><MinusIcon /></SquareButton>
              </li>
            ))}
          </ul>
          <form className="m:flex m:gap-1.5" onSubmit={(e) => {
            e.preventDefault()
            const name = newNote.trim()
            if (name && !setup.NoteRows.includes(name)) {
              changeSetup({ NoteRows: [...setup.NoteRows, name] })
            }
            setNewNote('')
          }}>
            <input type="text" value={newNote} onChange={(e) => { setNewNote(e.target.value) }} placeholder={t('new row placeholder')} aria-label={t('name of new row')} className={fieldClass + ' m:flex-1 m:min-w-0'} />
            <button type="submit" className="m:text-[13px] m:px-2.5 m:border m:border-gray-300 m:rounded m:bg-white m:hover:bg-gray-100">{t('add')}</button>
          </form>
        </div>

        <div className="m:flex m:flex-col m:gap-2 m:pt-3 m:border-t m:border-gray-200">
          <Heading>{t('phases')}</Heading>
          <Field label={t('text for empty phase')}>
            <input type="text" value={setup.EmptyPhaseText ?? ''} placeholder={t('no info')} onChange={(e) => { changeSetup({ EmptyPhaseText: e.target.value || undefined }) }} className={fieldClass} />
          </Field>
        </div>
      </div>}

      {tab === 'view' && <div className="m:flex m:flex-col m:gap-4">
        <Check label={t('show as date diff short')} help={t('show as date diff help')} checked={settings.DateDiff} onChange={() => { set({ DateDiff: !settings.DateDiff }) }} />
        <Check label={t('show roles')} help={t('show roles help')} checked={settings.ShowRoles} onChange={() => { set({ ShowRoles: !settings.ShowRoles }) }} />
        <Check label={t('show empty rows')} help={t('show empty rows help')} checked={settings.ShowEmpty} onChange={() => { set({ ShowEmpty: !settings.ShowEmpty }) }} />
        <Field label={t('width per phase')} help={t('px per phase', { width: settings.PhaseWidth })}>
          <input type="range" min={240} max={520} step={10} value={settings.PhaseWidth} onChange={(e) => { set({ PhaseWidth: Number(e.target.value) }) }} className="m:accent-primary" />
        </Field>
        <Check label={t('long label')} help={t('long label help')} checked={settings.LongLabel} onChange={() => { set({ LongLabel: !settings.LongLabel }) }} />
      </div>}
    </Shell>
  )
}
