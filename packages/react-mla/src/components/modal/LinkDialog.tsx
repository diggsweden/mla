// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ILinkConfiguration } from '../../interfaces/configuration'
import type { IEntity, ILink } from '../../interfaces/data-models'
import { type LinkDirection, buildLink, defaultDirection, directionOf } from './link-utils'
import { DirectionButtons, EntityChip } from './link-parts'
import CreateDialog, { sectionLabel } from './CreateDialog'

interface Props {
  // The two entities, in the order the user gave them: where a drawn relation started, and where it ended
  first: IEntity
  second: IEntity
  // The types of relation that can be chosen; the only one is shown chosen
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
  const chooseType = (next: ILinkConfiguration) => {
    setType(next)
    // A new type has other properties, so its details start over, but the direction is kept
    setLink(buildLink(first, second, next, direction))
  }
  const chooseDirection = (next: LinkDirection) => {
    setDirection(next)
    setLink(current => ({ ...current, Direction: directionOf(current, first, second, next) }))
  }

  return (
    <CreateDialog title={t('new link')} createLabel={t('create link')} item={link} configs={type.Properties} fieldsKey={type.TypeId}
      onChange={(next) => { setLink({ ...next, Direction: directionOf(next, first, second, direction) }) }}
      onSave={() => { props.onSave(link) }} onCancel={props.onCancel}
      // Whom it is between and which way it points, on one row: the buttons of the direction are the arrow between them
      top={
        <section aria-label={t('between')} className="m:flex m:items-center m:gap-3 m:px-6 m:py-4">
          <EntityChip oneRow entity={first} />
          <DirectionButtons onlyButtons direction={direction} first={first} second={second} onChange={chooseDirection} />
          <EntityChip oneRow entity={second} />
        </section>
      }
      // Also the only type there can be is shown as the choice, chosen, so that the dialog looks the same and it is seen what is made
      choice={
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
      } />
  )
}

export default LinkDialog
