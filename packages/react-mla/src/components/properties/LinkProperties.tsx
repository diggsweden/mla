// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { produce } from 'immer'
import { type Direction, type ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import useMainStore from '../../store/main-store'
import Property from '../common/property'
import { IPropertyConfiguration } from '../../interfaces/configuration'
import { isSameType } from '../../utils/utils'

interface Props {
  link: ILink
}

function LinkProperties (props: Props) {
  const { link } = props
  const updateLink = useMainStore((state) => state.updateLink)

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

  if (link == null) {
    return null
  }

  return (
    <div className="m-px-3 m-mt-3">
      <div>
        {configService.getProperties(link).map(e => (
          <Property key={link.Id + e.propertyConfiguration.TypeId + e.propertyConfiguration.GlobalType + link.DateFrom?.toISO() + link.DateTo?.toISO()}
            value={e.property?.Value}
            config={e.propertyConfiguration}
            onChange={(value) => { linkChanged(link, value, e.propertyConfiguration) }} />
        ))}
      </div>
      <div>
        <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900" title="Välj riktning på relationen">Pil</span>
        <select onChange={(e) => { linkDirectionChanged(link, e.target.value as Direction) }} value={link.Direction ?? 'NONE'} className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1">
          <option value="TO">Till</option>
          <option value="FROM">Från</option>
          <option value="BOTH">Båda</option>
          <option value="NONE">Ingen</option>
        </select>
      </div>
    </div>
  )
}

export default LinkProperties
