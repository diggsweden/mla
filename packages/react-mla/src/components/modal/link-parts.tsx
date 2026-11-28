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

// An entity of the relation. On one row it has its type in gray after the name, to take less room
export function EntityChip (props: { entity: IEntity, oneRow?: boolean }) {
  const view = viewService.getView(props.entity.TypeId, props.entity.GlobalType)
  if (props.oneRow) {
    return (
      <div className="m:flex m:flex-1 m:items-center m:gap-2 m:min-w-0 m:h-9 m:px-2.5 m:border m:border-gray-300 m:rounded-lg m:bg-white">
        <Icon name={view.Icon} color={view.Color} className="m:h-5 m:w-5 m:shrink-0" />
        <span className="m:text-[14px] m:font-semibold m:truncate">{nameOf(props.entity)}</span>
        <span className="m:ml-auto m:pl-2 m:text-[12px] m:text-gray-600 m:whitespace-nowrap">{configService.getTypeName(props.entity)}</span>
      </div>
    )
  }
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

function DirectionIcon (props: { direction: LinkDirection }) {
  const d = { end: 'M3 10h11M10 6l4 4-4 4', start: 'M17 10H6M10 6l-4 4 4 4', both: 'M5 10h10M8 7l-3 3 3 3M12 7l3 3-3 3', none: 'M3 10h14' }[props.direction]
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// The four ways a relation can point, as buttons with arrows, and what the chosen one means in words.
// The way the relation points. Only the buttons, when they stand between the two entities as the arrow itself:
// what the chosen one means is then in its tooltip and read by a screen reader
export function DirectionButtons (props: { direction: LinkDirection, first: IEntity, second: IEntity, onChange: (direction: LinkDirection) => void, compact?: boolean, onlyButtons?: boolean }) {
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
    <div role="radiogroup" aria-label={t('direction')} className={'m:flex m:items-center m:gap-3' + (props.compact ? ' m:flex-wrap m:gap-y-1.5' : '') + (props.onlyButtons ? ' m:shrink-0' : '')}>
      {!props.onlyButtons && <span className={label}>{t('direction')}</span>}
      <div className="m:inline-flex m:rounded-lg m:border m:border-gray-300 m:overflow-hidden">
        {directions.map(d => (
          <button key={d.value} type="button" role="radio" aria-checked={direction === d.value} aria-label={d.label} title={d.label}
            onClick={() => { props.onChange(d.value) }}
            className={'m:px-3 m:py-1.5 m:border-r m:last:border-r-0 m:border-gray-300 m:cursor-pointer ' + (direction === d.value ? 'm:bg-primary m:text-white' : 'm:bg-white m:text-gray-700 m:hover:bg-gray-100')}>
            <DirectionIcon direction={d.value} />
          </button>
        ))}
      </div>
      {!props.onlyButtons && <span className={'m:text-[14px] m:text-gray-700' + (props.compact ? ' m:basis-full' : '')}>{directions.find(d => d.value === direction)?.label}</span>}
    </div>
  )
}
