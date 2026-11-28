// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type ReactNode } from 'react'
import { produce } from 'immer'
import { useTranslation } from 'react-i18next'
import { type Direction, type IEntity, type ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import useMainStore from '../../store/main-store'
import useAppStore from '../../store/app-store'
import viewService from '../../services/viewService'
import Icon from '../common/Icon'
import Property from '../common/Property'
import { type IPropertyConfiguration } from '../../interfaces/configuration'
import { getId, isSameType } from '../../utils/utils'
import { type LinkDirection, nameOf } from '../modal/link-utils'
import LaterValue from './LaterValue'
import DetailsHeading, { sectionLabel } from './DetailsHeading'

interface Props {
  link: ILink
  // When an older version is shown: what the latest version has instead, by the field
  later?: Record<string, string>
}

// The way a link points, seen from its start and its end, and back
const toChoice: Record<Direction, LinkDirection> = { TO: 'end', FROM: 'start', BOTH: 'both', NONE: 'none' }
const toDirection: Record<LinkDirection, Direction> = { end: 'TO', start: 'FROM', both: 'BOTH', none: 'NONE' }

// One of the two entities of the relation: a click opens it in the panel, and the chart shows which it is while the pointer is on it
function End (props: { entity: IEntity, linkId: string }) {
  const { t } = useTranslation()
  const view = viewService.getView(props.entity.TypeId, props.entity.GlobalType)
  const setSelected = useMainStore((state) => state.setSelected)
  const setFocusedId = useAppStore((state) => state.setFocusedId)
  const id = getId(props.entity)
  return (
    <button type="button" title={t('open entity', { name: nameOf(props.entity) })}
      onClick={() => { setSelected([id]) }}
      onMouseEnter={() => { setFocusedId(id) }} onMouseLeave={() => { setFocusedId(props.linkId) }}
      onFocus={() => { setFocusedId(id) }} onBlur={() => { setFocusedId(props.linkId) }}
      className="m:flex m:items-center m:gap-2.5 m:w-full m:px-2 m:py-1.5 m:rounded-md m:text-left m:cursor-pointer m:hover:bg-blue-50 m:focus-visible:bg-blue-50 m:outline-none">
      <Icon name={view.Icon} color={view.Color} className="m:w-5 m:h-5 m:shrink-0" />
      <span className="m:text-[13px] m:font-semibold m:truncate">{nameOf(props.entity)}</span>
      <span className="m:ml-auto m:text-[12px] m:text-gray-600 m:shrink-0">{configService.getTypeName(props.entity)}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="m:text-gray-400 m:shrink-0"><path d="M9 6l6 6-6 6" /></svg>
    </button>
  )
}

// A short arrow down between the two entities, with heads the way the relation points
function ShortArrow (props: { direction: LinkDirection }) {
  const down = props.direction === 'end' || props.direction === 'both'
  const up = props.direction === 'start' || props.direction === 'both'
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true" className="m:text-gray-500 m:shrink-0">
      <line x1="6" y1={up ? 6 : 1} x2="6" y2={down ? 14 : 19} stroke="currentColor" strokeWidth="1.5" />
      {down && <path d="M2 13 L6 19 L10 13 Z" fill="currentColor" />}
      {up && <path d="M2 7 L6 1 L10 7 Z" fill="currentColor" />}
    </svg>
  )
}

// The way the relation points, chosen with four small buttons. Their names, like "Toward Bo Lind", are in their tooltips
function DirectionChoice (props: { direction: LinkDirection, first: IEntity, second: IEntity, onChange: (direction: LinkDirection) => void }) {
  const { t } = useTranslation()
  const choices: Array<{ value: LinkDirection, label: string, icon: ReactNode }> = [
    { value: 'end', label: t('toward', { name: nameOf(props.second) }), icon: <path d="M12 4v15M6 13l6 6 6-6" /> },
    { value: 'start', label: t('toward', { name: nameOf(props.first) }), icon: <path d="M12 20V5M6 11l6-6 6 6" /> },
    { value: 'both', label: t('both directions'), icon: <path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4" /> },
    { value: 'none', label: t('no direction'), icon: <path d="M5 12h14" /> }
  ]
  return (
    <div role="radiogroup" aria-label={t('direction')} className="m:flex m:ml-auto m:border m:border-gray-300 m:rounded-md m:overflow-hidden">
      {choices.map(c => (
        <button key={c.value} type="button" role="radio" aria-checked={props.direction === c.value} aria-label={c.label} title={c.label}
          onClick={() => { props.onChange(c.value) }}
          className={'m:w-8 m:h-7 m:flex m:items-center m:justify-center m:border-r m:last:border-r-0 m:border-gray-300 m:cursor-pointer ' +
            (props.direction === c.value ? 'm:bg-primary m:text-white' : 'm:bg-white m:text-gray-600 m:hover:bg-gray-100')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{c.icon}</svg>
        </button>
      ))}
    </div>
  )
}

// The properties of a relation: which two entities it is between and which way it points, and its fields
function LinkProperties (props: Props) {
  const { t } = useTranslation()
  const { link } = props
  const updateLink = useMainStore((state) => state.updateLink)
  const from = useMainStore((state) => state.getCurrentEntity(link.FromEntityId + link.FromEntityTypeId))
  const to = useMainStore((state) => state.getCurrentEntity(link.ToEntityId + link.ToEntityTypeId))

  function linkChanged (link: ILink, newValue: string | number | boolean | undefined, property: IPropertyConfiguration) {
    const update = produce(link, copy => {
      const prop = copy.Properties.find(p => isSameType(p, property))
      if (prop == null) {
        copy.Properties.push({ TypeId: property.TypeId, Value: newValue, GlobalType: property.GlobalType })
      } else {
        prop.Value = newValue
      }
    })

    updateLink(update)
  }

  function linkDirectionChanged (link: ILink, newValue: Direction) {
    const update = produce(link, copy => {
      copy.Direction = newValue
    })

    updateLink(update)
  }

  const fieldHelp = useAppStore((state) => state.fieldHelp)
  const direction = toChoice[link.Direction ?? 'NONE']
  const properties = configService.getProperties(link)

  return (
    <div className="m:flex m:flex-col">
      {from != null && to != null && (
        <section aria-label={t('between')} className="m:px-3 m:pt-3 m:pb-3 m:border-b m:border-gray-200">
          <h3 className={sectionLabel + ' m:px-1 m:mb-1'}>{t('between')}</h3>
          <End entity={from} linkId={getId(link)} />
          <div className="m:flex m:items-center m:gap-2 m:pl-[13px] m:pr-1">
            <ShortArrow direction={direction} />
            <DirectionChoice direction={direction} first={from} second={to} onChange={(d) => { linkDirectionChanged(link, toDirection[d]) }} />
          </div>
          <End entity={to} linkId={getId(link)} />
        </section>
      )}
      {properties.length > 0 && (
        <section aria-label={t('details')} className="m:px-4 m:pt-3 m:pb-1 m:flex m:flex-col m:gap-2">
          <DetailsHeading configs={properties.map(e => e.propertyConfiguration)} />
          {properties.map(e => (
            <LaterValue key={link.Id + e.propertyConfiguration.TypeId + e.propertyConfiguration.GlobalType + link.DateFrom?.toISO() + link.DateTo?.toISO()}
              later={props.later?.[e.propertyConfiguration.TypeId]}>
              <Property
                value={e.property?.Value}
                config={e.propertyConfiguration}
                helpOpen={fieldHelp}
                onChange={(value) => { linkChanged(link, value, e.propertyConfiguration) }} />
            </LaterValue>
          ))}
        </section>
      )}
    </div>
  )
}

export default LinkProperties
