// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { produce } from 'immer'
import { type IEntity } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import useMainStore from '../../store/main-store'
import Property from '../common/Property'
import { useEffect, useState } from 'react'
import Icon from '../common/Icon'
import useAppStore from '../../store/app-store'
import { getId, isSameType } from '../../utils/utils'
import Button from '../common/Button'
import { IPropertyConfiguration } from '../../interfaces/configuration'
import { useTranslation } from 'react-i18next'

interface Props {
  entity: IEntity
}

function EntityProperties (props: Props) {
  const { t } = useTranslation();
  const { entity } = props
  const updateEntity = useMainStore((state) => state.updateEntity)
  const placeEntity = useAppStore((state) => state.setPlaceEntityId)
  const usingMap = useAppStore((state) => state.showMap)

  useEffect(() => {
    return () => {
      placeEntity(undefined)
    }
  }, [placeEntity, entity])

  function entityChanged (entity: IEntity, newValue: string | number | boolean | undefined, property: IPropertyConfiguration) {
    const update = produce(entity, copy => {
      const prop = copy.Properties.find(p => isSameType(p, property))
      if (prop == null) {
        copy.Properties.push({ TypeId: property.TypeId, Value: newValue, GlobalType: property.GlobalType })
      } else {
        prop.Value = newValue
      }
    })

    updateEntity(update)
  }

  const [inputCoords, setInputCoords] = useState(getCoordinates(entity))
  function getCoordinates (e: IEntity): string {
    if (e.Coordinates != null) {
      return `${e.Coordinates.lat}, ${e.Coordinates.lng}`
    }

    return ''
  }

  function updateCoords(input: string) {
    setInputCoords(input)

    if (input == null || input.length === 0) {
      const update = produce(entity, draft => {
        draft.Coordinates = undefined
      })
  
      updateEntity(update)
      return;
    }

    const sp = input.split(",")
    if (inputCoords.split.length != 2) {
      return
    }

    const lat = Number.parseFloat(sp[0])
    const lng = Number.parseFloat(sp[1])
    if (!isNaN(lat) && !isNaN(lng)) {
      const update = produce(entity, draft => {
        draft.Coordinates = {
          lat,
          lng
        }

      })
  
      updateEntity(update)
    }
  }

  function place (e: IEntity) {
    placeEntity(getId(e))
  }

  if (entity == null) {
    return null
  }

  return (
    <div className="m-px-3 m-mt-3">
      <div>
        {configService.getProperties(entity).map(e => (
          <Property key={entity.Id + e.propertyConfiguration.TypeId + e.propertyConfiguration.GlobalType + entity.DateFrom?.toISO() + entity.DateTo?.toISO()}
            value={e.property?.Value}
            config={e.propertyConfiguration}
            onChange={(newValue) => { entityChanged(entity, newValue, e.propertyConfiguration) }} />
        ))}
      </div>
      { usingMap && <div>
        <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900" title={t('lat lng')}>{t('position')}</span>
        <input type="text" value={inputCoords} onChange={(e) => { updateCoords(e.target.value) }} className={'m-border-gray-300 m-bg-white m-border m-text-gray-900 m-rounded-lg m-block m-w-full m-p-1'}></input>
        <Button className="m-w-full" onClick={() => { place(entity) }}><Icon name="pin_drop" className="m-w-5 m-h-5 m-inline-block m-m-0 -m-mb-1" color='#ffffff'></Icon>{t('place on map')}</Button>
      </div>}
    </div>
  )
}

export default EntityProperties
