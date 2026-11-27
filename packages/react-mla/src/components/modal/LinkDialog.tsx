// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ILinkConfiguration } from '../../interfaces/configuration'
import type { IEntity, ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import viewService from '../../services/viewService'
import { type LinkDirection, buildLink, defaultDirection, directionOf, nameOf } from './link-utils'
import Icon from '../common/Icon'
import Modal from '../common/Modal'
import LinkCreator from './LinkCreator'

function EntityChip (props: { entity: IEntity }) {
  const view = viewService.getView(props.entity.TypeId, props.entity.GlobalType)
  return (
    <div className="m:flex m:items-center m:gap-2 m:min-w-0 m:px-3 m:py-2 m:border m:border-gray-300 m:rounded-lg m:bg-white">
      <Icon name={view.Icon} color={view.Color} className="m:h-6 m:w-6 m:shrink-0" />
      <div className="m:flex m:flex-col m:min-w-0">
        <span className="m:text-[14px] m:font-semibold m:truncate">{nameOf(props.entity)}</span>
        <span className="m:text-[12px] m:text-gray-600">{configService.getTypeName(props.entity)}</span>
      </div>
    </div>
  )
}

// The line between the two entities, with the arrows of the direction, as the chart will show it
function DirectionLine (props: { direction: LinkDirection }) {
  const toEnd = props.direction === 'end' || props.direction === 'both'
  const toStart = props.direction === 'start' || props.direction === 'both'
  return (
    <svg viewBox="0 0 100 16" preserveAspectRatio="none" className="m:w-full m:h-4" aria-hidden="true">
      <line x1={toStart ? 10 : 2} y1="8" x2={toEnd ? 90 : 98} y2="8" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {toEnd && <path d="M88 2 L99 8 L88 14 Z" fill="currentColor" />}
      {toStart && <path d="M12 2 L1 8 L12 14 Z" fill="currentColor" />}
    </svg>
  )
}

function DirectionIcon (props: { direction: LinkDirection }) {
  const d = { end: 'M3 10h11M10 6l4 4-4 4', start: 'M17 10H6M10 6l-4 4 4 4', both: 'M5 10h10M8 7l-3 3 3 3M12 7l3 3-3 3', none: 'M3 10h14' }[props.direction]
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface Props {
  // The two entities, in the order the user gave them: where a drawn relation started, and where it ended
  first: IEntity
  second: IEntity
  // The types of relation that can be chosen; with one, it is not a choice
  types: ILinkConfiguration[]
  direction?: LinkDirection
  onSave: (link: ILink) => void
  onCancel: () => void
}

// The dialog that makes a relation between two entities: who it is between, of which type, which way it points and its details
function LinkDialog (props: Props) {
  const { t } = useTranslation()
  const { first, second, types } = props
  const id = useId()
  const [type, setType] = useState(types[0])
  const [direction, setDirection] = useState<LinkDirection>(props.direction ?? defaultDirection(first, second, types[0]))
  const [link, setLink] = useState(() => buildLink(first, second, types[0], direction))
  // Valid until a field says it is not; a type without properties has no fields to say so
  const [valid, setValid] = useState(true)
  // The fields that are not filled in as they must be, by their type
  const [invalid, setInvalid] = useState<string[]>([])

  const chooseType = (next: ILinkConfiguration) => {
    setType(next)
    setInvalid([])
    // A new type has other properties, so its details start over, but the direction is kept
    setLink(buildLink(first, second, next, direction))
  }
  const chooseDirection = (next: LinkDirection) => {
    setDirection(next)
    setLink(current => ({ ...current, Direction: directionOf(current, first, second, next) }))
  }

  const directions: Array<{ value: LinkDirection, label: string }> = [
    { value: 'end', label: t('toward', { name: nameOf(second) }) },
    { value: 'start', label: t('toward', { name: nameOf(first) }) },
    { value: 'both', label: t('both directions') },
    { value: 'none', label: t('no direction') }
  ]
  const sectionLabel = 'm:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600'
  const missing = invalid.map(key => type.Properties.find(p => p.TypeId === key)?.Name).filter(Boolean)
  const hasRequired = type.Properties.some(p => p.Required)

  return (
    <Modal mode="save" show={true} valid={valid} title={t('new link')} positiveLabel={t('create link')} fitScreen
      footerNote={!valid && missing.length > 0 ? <span className="m:text-[13px] m:text-red-700">{t('fill in', { names: missing.join(', ') })}</span> : undefined}
      onNegative={props.onCancel} onPositive={() => { props.onSave(link) }}>
      {/* Who it is between and which way it points are always seen */}
      <div className="m:shrink-0 m:flex m:flex-col m:gap-4 m:text-left m:px-6 m:pt-5 m:pb-4 m:border-b m:border-gray-200">
        <section aria-label={t('between')} className="m:grid m:grid-cols-[minmax(0,1fr)_minmax(80px,140px)_minmax(0,1fr)] m:items-center m:gap-3">
          <EntityChip entity={first} />
          <div className="m:flex m:flex-col m:items-center m:gap-1 m:text-primary">
            <span className="m:text-[12px] m:font-semibold m:text-gray-700 m:text-center">{type.Name}</span>
            <DirectionLine direction={direction} />
          </div>
          <EntityChip entity={second} />
        </section>

        <div role="radiogroup" aria-label={t('direction')} className="m:flex m:items-center m:gap-3">
          <span className={sectionLabel}>{t('direction')}</span>
          <div className="m:inline-flex m:rounded-lg m:border m:border-gray-300 m:overflow-hidden">
            {directions.map(d => (
              <button key={d.value} type="button" role="radio" aria-checked={direction === d.value} aria-label={d.label} title={d.label}
                onClick={() => { chooseDirection(d.value) }}
                className={'m:px-3 m:py-1.5 m:border-r m:last:border-r-0 m:border-gray-300 m:cursor-pointer ' + (direction === d.value ? 'm:bg-primary m:text-white' : 'm:bg-white m:text-gray-700 m:hover:bg-gray-100')}>
                <DirectionIcon direction={d.value} />
              </button>
            ))}
          </div>
          <span className="m:text-[14px] m:text-gray-700">{directions.find(d => d.value === direction)?.label}</span>
        </div>
      </div>

      {/* The type and the details scroll when they do not fit */}
      <div className="mla-form-fields m:min-h-0 m:flex-1 m:overflow-y-auto">
        {types.length > 1 && (
          <div className="m:flex m:flex-col m:gap-1.5 m:text-left m:px-6 m:pt-4">
            {types.length > 3
              // Many types are a list, with the description of the one chosen below it
              ? <label className="m:flex m:flex-col m:gap-1.5">
                <span className={sectionLabel}>{t('link type')}</span>
                <select value={type.TypeId} onChange={(e) => { const next = types.find(x => x.TypeId === e.target.value); if (next) chooseType(next) }}
                  className="m:bg-white m:border m:border-gray-300 m:text-gray-900 m:text-[14px] m:rounded-lg m:block m:w-full m:p-1.5">
                  {types.map(x => <option key={x.TypeId} value={x.TypeId}>{x.Name}</option>)}
                </select>
                {type.Description && <span className="m:text-[12px] m:text-gray-600">{type.Description}</span>}
              </label>
              : <fieldset className="m:flex m:flex-col m:gap-1">
                <legend className={sectionLabel + ' m:mb-1.5'}>{t('link type')}</legend>
                {types.map(x => (
                  <label key={x.TypeId} title={x.Description} className={'m:flex m:gap-2.5 m:items-baseline m:px-3 m:py-1.5 m:rounded-md m:border m:cursor-pointer m:min-w-0 ' + (x.TypeId === type.TypeId ? 'm:border-primary m:bg-blue-50' : 'm:border-transparent m:hover:bg-gray-50')}>
                    <input type="radio" name={id} checked={x.TypeId === type.TypeId} onChange={() => { chooseType(x) }} className="m:accent-primary m:self-center" />
                    <span className="m:text-[14px] m:font-semibold m:shrink-0">{x.Name}</span>
                    {x.Description && <span className="m:text-[12px] m:text-gray-600 m:truncate">{x.Description}</span>}
                  </label>
                ))}
              </fieldset>}
          </div>
        )}

        <div className="m:flex m:items-baseline m:justify-between m:text-left m:px-6 m:pt-4">
          <span className={sectionLabel}>{t('details')}</span>
          {hasRequired && <span className="m:text-[12px] m:text-gray-600">{t('required fields')}</span>}
        </div>
        <LinkCreator key={type.TypeId} link={link} validChanged={setValid}
          // The fields tell their validity at every render, so the list is only changed when what is in it is
          invalidChanged={(keys) => { setInvalid(current => (current.join() === keys.join() ? current : keys)) }}
          onChange={(next) => { setLink({ ...next, Direction: directionOf(next, first, second, direction) }) }} />
      </div>
    </Modal>
  )
}

export default LinkDialog
