// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { produce } from 'immer'
import { type Direction, type ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import useMainStore from '../../store/main-store'
import Property from '../common/Property'
import { type IPropertyConfiguration } from '../../interfaces/configuration'
import { isSameType } from '../../utils/utils'
import { DirectionButtons, EntityChip } from '../modal/link-parts'
import type { LinkDirection } from '../modal/link-utils'
import LaterValue from './LaterValue'

interface Props {
  link: ILink
  // When an older version is shown: what the latest version has instead, by the field
  later?: Record<string, string>
}

// The way a link points, seen from its start and its end, and back
const toChoice: Record<Direction, LinkDirection> = { TO: 'end', FROM: 'start', BOTH: 'both', NONE: 'none' }
const toDirection: Record<LinkDirection, Direction> = { end: 'TO', start: 'FROM', both: 'BOTH', none: 'NONE' }

// An arrow down between the two entities, with heads the way the relation points
function VerticalArrow (props: { direction: LinkDirection }) {
  const down = props.direction === 'end' || props.direction === 'both'
  const up = props.direction === 'start' || props.direction === 'both'
  return (
    <svg width="16" height="28" viewBox="0 0 16 28" aria-hidden="true" className="m:text-primary">
      <line x1="8" y1={up ? 8 : 2} x2="8" y2={down ? 20 : 26} stroke="currentColor" strokeWidth="2" />
      {down && <path d="M3 18 L8 27 L13 18 Z" fill="currentColor" />}
      {up && <path d="M3 10 L8 1 L13 10 Z" fill="currentColor" />}
    </svg>
  )
}

// The properties of a relation: which two entities it is between, which way it points, and its fields
function LinkProperties (props: Props) {
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

  const direction = toChoice[link.Direction ?? 'NONE']

  return (
    <div className="m:px-3 m:mt-3 m:flex m:flex-col m:gap-3">
      {from != null && to != null && (
        <div className="m:flex m:flex-col m:gap-3 m:pb-3 m:border-b m:border-gray-200">
          <div className="m:flex m:flex-col m:items-stretch">
            <EntityChip entity={from} />
            <div className="m:flex m:justify-center m:py-1"><VerticalArrow direction={direction} /></div>
            <EntityChip entity={to} />
          </div>
          <DirectionButtons compact direction={direction} first={from} second={to} onChange={(d) => { linkDirectionChanged(link, toDirection[d]) }} />
        </div>
      )}
      <div className="m:flex m:flex-col m:gap-2">
        {configService.getProperties(link).map(e => (
          <LaterValue key={link.Id + e.propertyConfiguration.TypeId + e.propertyConfiguration.GlobalType + link.DateFrom?.toISO() + link.DateTo?.toISO()}
            later={props.later?.[e.propertyConfiguration.TypeId]}>
            <Property
              value={e.property?.Value}
              config={e.propertyConfiguration}
              onChange={(value) => { linkChanged(link, value, e.propertyConfiguration) }} />
          </LaterValue>
        ))}
      </div>
    </div>
  )
}

export default LinkProperties
