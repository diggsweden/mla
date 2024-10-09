// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { produce } from 'immer'
import { type Direction, type ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import useMainStore from '../../store/main-store'
import Property from '../common/Property'
import { IPropertyConfiguration } from '../../interfaces/configuration'
import { isSameType } from '../../utils/utils'
import { useTranslation } from 'react-i18next'

interface Props {
  link: ILink
}

function LinkProperties (props: Props) {
  const { t } = useTranslation();
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
        <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900" title={t('select relation direction')}>{t('arrow')}</span>
        <select onChange={(e) => { linkDirectionChanged(link, e.target.value as Direction) }} value={link.Direction ?? 'NONE'} className="m-w-full m-bg-white m-border m-border-gray-300 m-text-gray-900 m-rounded-lg focus:m-ring-blue-500 focus:m-border-blue-500 m-block m-p-1">
          <option value="TO">{t('to')}</option>
          <option value="FROM">{t('from')}</option>
          <option value="BOTH">{t('both')}</option>
          <option value="NONE">{t('none')}</option>
        </select>
      </div>
    </div>
  )
}

export default LinkProperties
