// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { produce } from 'immer'
import { type IEntity } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import useMainStore from '../../store/main-store'
import Property from '../common/property'
import { useEffect, useState } from 'react'
import Icon from '../common/Icon'
import useAppStore from '../../store/app-store'
import { getId } from '../../utils/utils'

interface Props {
  entity: IEntity
}

function EntityProperties (props: Props) {
  const { entity } = props
  const updateEntity = useMainStore((state) => state.updateEntity)
  const placeEntity = useAppStore((state) => state.setPlaceEntityId)
  const usingMap = useAppStore((state) => state.showMap)

  useEffect(() => {
    return () => {
      placeEntity(undefined)
    }
  }, [placeEntity, entity])

  function entityChanged (entity: IEntity, newValue: string | number | boolean | undefined, propertyId: string) {
    const update = produce(entity, copy => {
      const prop = copy.Properties.find(p => p.TypeId === propertyId)
      if (prop == null) {
        copy.Properties.push({ TypeId: propertyId, Value: newValue })
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
    <div className='px-3 mt-3'>
      <div>
        {configService.getProperties(entity).map(e => (
          <Property key={entity.Id + e.propertyConfiguration.TypeId + entity.DateFrom?.toISO() + entity.DateTo?.toISO()}
            value={e.property?.Value}
            config={e.propertyConfiguration}
            onChange={(newValue) => { entityChanged(entity, newValue, e.propertyConfiguration.TypeId) }} />
        ))}
      </div>
      { usingMap && <div>
        <span className="mb-1 text-sm font-medium text-gray-900" title="Latitud och Longitud">Position</span>
        <input type="text" value={inputCoords} onChange={(e) => { updateCoords(e.target.value) }} className={'border-gray-300 bg-white border text-gray-900 rounded-lg block w-full p-1'}></input>
        <button onClick={() => { place(entity) }} className='w-full text-white bg-primary enabled:hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded px-2 py-1 mr-2 my-2 disabled:opacity-50'><Icon name="pin_drop" className='w-5 h-5 inline-block m-0 -mb-1' color='#ffffff'></Icon> Placera på karta</button>
      </div>}
    </div>
  )
}

export default EntityProperties
