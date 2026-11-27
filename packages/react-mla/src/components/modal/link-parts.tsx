// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from 'react-i18next'
import type { IEntity } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import viewService from '../../services/viewService'
import Icon from '../common/Icon'
import { type LinkDirection, nameOf } from './link-utils'

// The parts that show a relation between two entities, in the dialog for a new relation and in the properties of a relation

export function EntityChip (props: { entity: IEntity }) {
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
export function DirectionLine (props: { direction: LinkDirection }) {
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

// The four ways a relation can point, as buttons with arrows, and what the chosen one means in words
export function DirectionButtons (props: { direction: LinkDirection, first: IEntity, second: IEntity, onChange: (direction: LinkDirection) => void, compact?: boolean }) {
  const { t } = useTranslation()
  const { direction } = props
  const directions: Array<{ value: LinkDirection, label: string }> = [
    { value: 'end', label: t('toward', { name: nameOf(props.second) }) },
    { value: 'start', label: t('toward', { name: nameOf(props.first) }) },
    { value: 'both', label: t('both directions') },
    { value: 'none', label: t('no direction') }
  ]
  const label = 'm:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600'
  return (
    <div role="radiogroup" aria-label={t('direction')} className={'m:flex m:items-center m:gap-3' + (props.compact ? ' m:flex-wrap m:gap-y-1.5' : '')}>
      <span className={label}>{t('direction')}</span>
      <div className="m:inline-flex m:rounded-lg m:border m:border-gray-300 m:overflow-hidden">
        {directions.map(d => (
          <button key={d.value} type="button" role="radio" aria-checked={direction === d.value} aria-label={d.label} title={d.label}
            onClick={() => { props.onChange(d.value) }}
            className={'m:px-3 m:py-1.5 m:border-r m:last:border-r-0 m:border-gray-300 m:cursor-pointer ' + (direction === d.value ? 'm:bg-primary m:text-white' : 'm:bg-white m:text-gray-700 m:hover:bg-gray-100')}>
            <DirectionIcon direction={d.value} />
          </button>
        ))}
      </div>
      <span className={'m:text-[14px] m:text-gray-700' + (props.compact ? ' m:basis-full' : '')}>{directions.find(d => d.value === direction)?.label}</span>
    </div>
  )
}
