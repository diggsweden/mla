// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type KeyboardEvent, useState } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import type { IPhaseEvent } from '../../interfaces/data-models'
import useMainStore from '../../store/main-store'
import configService from '../../services/configurationService'
import viewService from '../../services/viewService'
import { generateUUID } from '../../utils/utils'
import { phaseStyle } from '../../utils/color'
import ColorPalette from '../common/ColorPalette'
import Icon from '../common/Icon'
import Modal from '../common/Modal'
import DateField from '../common/DateField'

interface Props {
  onClose: () => void
  // The phase to start in, when the dialog is opened from one of them
  focusId?: string
}

const inputClass = 'm:bg-white m:border m:border-gray-300 m:text-gray-900 m:rounded m:focus:ring-blue-500 m:focus:border-blue-500 m:px-2 m:py-1 m:text-[14px]'

// The day a phase starts, as the date input shows it
function dateOf (value: string): DateTime | undefined {
  const date = DateTime.fromISO(value)
  return value !== '' && date.isValid ? date.startOf('day') : undefined
}

// A button with the color of a phase, that shows or hides the colors to choose from
function ColorButton (props: { color?: string, label: string, open: boolean, onToggle: () => void }) {
  // As the phase will look, softened when it has a color of its own
  const style = props.color != null ? phaseStyle(props.color) : { background: viewService.getTheme().Primary, color: '#ffffff' }
  return (
    <button type="button" aria-label={props.label} title={props.label} aria-expanded={props.open} onClick={props.onToggle}
      className="m:w-8 m:h-8 m:shrink-0 m:rounded m:border m:border-gray-300 m:flex m:items-center m:justify-center m:cursor-pointer"
      style={style}>
      <Icon name="arrow_drop_down" className="m:h-4" />
    </button>
  )
}

// The colors of the theme and the standard colors, below the row of the phase. A dialog cuts off what lies outside it, so they are not a menu of their own
function ColorChoice (props: { label: string, onSelect: (color?: string) => void }) {
  return (
    <div role="group" aria-label={props.label} className="m:col-span-full m:w-fit m:border m:border-gray-300 m:rounded m:bg-white m:shadow-sm m:p-1">
      <ColorPalette kind="shape" colors={viewService.getTheme().CustomContourColorPicklist} onSelect={props.onSelect} />
    </div>
  )
}

// The phases of the chart: each can be renamed, moved to another date, given a color or deleted, and new ones added, one at a time or from a template.
// Nothing is changed in the chart until the dialog is saved
function PhaseDialog (props: Props) {
  const { t } = useTranslation()
  const stored = useMainStore((s) => s.phaseEvents)
  const setPhase = useMainStore((s) => s.setPhaseEvent)
  const removePhase = useMainStore((s) => s.removePhaseEvent)
  const templates = configService.getConfiguration().TimeAnalysis?.PhaseAnalysis?.PhaseTemplates ?? []

  const [phases, setPhases] = useState<IPhaseEvent[]>(() => [...stored].sort((a, b) => a.Date.toMillis() - b.Date.toMillis()))
  const [template, setTemplate] = useState('')
  const [name, setName] = useState('')
  const [date, setDate] = useState<DateTime>(DateTime.now().startOf('day'))
  const [color, setColor] = useState<string>()
  // The phase whose colors are shown, or 'new' for the one that is added
  const [colorFor, setColorFor] = useState<string>()
  const toggleColors = (id: string) => { setColorFor(colorFor === id ? undefined : id) }

  const update = (id: string, patch: Partial<IPhaseEvent>) => {
    setPhases(list => list.map(p => (p.Id === id ? { ...p, ...patch } : p)))
  }

  // The phases that the form at the bottom would add
  const pending = (): IPhaseEvent[] => {
    const chosen = templates.find(x => x.Name === template)
    if (chosen != null) {
      // One day apart from the chosen date, to be moved to their real dates
      return chosen.Phases.map((n, i) => ({ Id: generateUUID(), Description: n, Date: date.plus({ days: i }), Color: color }))
    }
    return name.trim() !== '' ? [{ Id: generateUUID(), Description: name.trim(), Date: date, Color: color }] : []
  }

  const add = () => {
    const added = pending()
    if (added.length === 0) {
      return
    }
    setPhases(list => [...list, ...added].sort((a, b) => a.Date.toMillis() - b.Date.toMillis()))
    setName('')
    setTemplate('')
    // The next phase starts the day after the last one that was added
    setDate(added.at(-1)!.Date.plus({ days: 1 }))
  }

  // Enter in the form adds the phase, instead of saving the dialog
  const addOnEnter = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      add()
    }
  }

  const save = () => {
    // What is written in the form but not yet added, is added too
    const all = [...phases, ...pending()]
    stored.filter(p => !all.some(x => x.Id === p.Id)).forEach(p => { removePhase(p) })
    all.forEach(p => {
      const before = stored.find(x => x.Id === p.Id)
      if (before == null || before.Description !== p.Description || before.Color !== p.Color || !before.Date.equals(p.Date)) {
        setPhase(p)
      }
    })
    props.onClose()
  }

  const valid = phases.every(p => p.Description.trim() !== '')
  const label = 'm:text-[12px] m:font-semibold m:text-gray-600'

  return (
    <Modal mode="save" show={true} title={t('phases')} valid={valid} onNegative={props.onClose} onPositive={save}>
      <div className="m:flex m:flex-col m:gap-4 m:text-left m:p-6">
        <section aria-label={t('phases')} className="m:flex m:flex-col m:gap-2">
          {phases.length > 0 && <div className={'m:grid m:grid-cols-[32px_minmax(0,1fr)_150px_32px] m:gap-2 ' + label}>
            <span>{t('color')}</span><span>{t('description')}</span><span>{t('starts')}</span><span />
          </div>}
          {phases.map(p => (
            <div key={p.Id} className="m:grid m:grid-cols-[32px_minmax(0,1fr)_150px_32px] m:gap-2 m:items-center">
              <ColorButton color={p.Color} label={t('color of', { name: p.Description })} open={colorFor === p.Id} onToggle={() => { toggleColors(p.Id) }} />
              <input type="text" value={p.Description} autoFocus={p.Id === props.focusId} aria-label={t('description')} aria-invalid={p.Description.trim() === ''}
                onChange={(e) => { update(p.Id, { Description: e.target.value }) }}
                className={inputClass + (p.Description.trim() === '' ? ' m:border-red-500!' : '')} />
              <DateField name={t('starts') + ', ' + p.Description} label={false} required value={p.Date.toISODate() ?? ''}
                onChange={(value) => { const d = dateOf(value); if (d) update(p.Id, { Date: d }) }} className={inputClass} />
              <button type="button" aria-label={t('delete phase', { name: p.Description })} title={t('delete')}
                onClick={() => { setPhases(list => list.filter(x => x.Id !== p.Id)) }}
                className="m:w-8 m:h-8 m:flex m:items-center m:justify-center m:rounded m:text-gray-600 m:hover:bg-red-50 m:hover:text-red-700 m:cursor-pointer">
                <Icon name="delete" className="m:h-5" />
              </button>
              {colorFor === p.Id && <ColorChoice label={t('color of', { name: p.Description })} onSelect={(c) => { update(p.Id, { Color: c }); setColorFor(undefined) }} />}
            </div>
          ))}
          {phases.length === 0 && <p className="m:text-[14px] m:text-gray-600">{t('no phases yet')}</p>}
        </section>

        <section aria-label={t('add phase')} className="m:flex m:flex-col m:gap-2 m:border-t m:border-gray-200 m:pt-4">
          <h4 className="m:text-[14px] m:font-semibold m:text-gray-900">{t('add phase')}</h4>
          {templates.length > 0 && <label className="m:flex m:items-center m:gap-2 m:text-[13px]">
            <span className="m:w-28">{t('template')}</span>
            <select value={template} onChange={(e) => { setTemplate(e.target.value) }} className={inputClass}>
              <option value="">{t('one phase')}</option>
              {templates.map(x => <option key={x.Name} value={x.Name}>{x.Name}</option>)}
            </select>
          </label>}
          <div className="m:grid m:grid-cols-[32px_minmax(0,1fr)_150px_auto] m:gap-2 m:items-center">
            <ColorButton color={color} label={t('color of new phase')} open={colorFor === 'new'} onToggle={() => { toggleColors('new') }} />
            <input type="text" value={template !== '' ? t('phases of template', { count: templates.find(x => x.Name === template)?.Phases.length ?? 0 }) : name}
              disabled={template !== ''} placeholder={t('name of the phase')} aria-label={t('name of the phase')} autoFocus={props.focusId == null}
              onChange={(e) => { setName(e.target.value) }} onKeyDown={addOnEnter} className={inputClass + ' m:disabled:bg-gray-100'} />
            <DateField name={template !== '' ? t('first phase starts') : t('starts')} label={false} required value={date.toISODate() ?? ''}
              onChange={(value) => { const d = dateOf(value); if (d) setDate(d) }} onKeyDown={addOnEnter} className={inputClass} />
            <button type="button" onClick={add} disabled={template === '' && name.trim() === ''}
              className="m:text-[13px] m:px-3 m:py-1.5 m:border m:border-gray-300 m:rounded m:bg-white m:hover:bg-gray-100 m:disabled:opacity-50 m:cursor-pointer m:disabled:cursor-default">{t('add')}</button>
            {colorFor === 'new' && <ColorChoice label={t('color of new phase')} onSelect={(c) => { setColor(c); setColorFor(undefined) }} />}
          </div>
          {template !== '' && <p className="m:text-[12px] m:text-gray-600">{t('template help')}</p>}
        </section>
      </div>
    </Modal>
  )
}

export default PhaseDialog
