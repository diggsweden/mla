// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import {  useRef, useState } from 'react'
import { type IEntity } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import Property from '../common/property'
import { produce } from 'immer'

interface Props {
  entity: IEntity
  validChanged: (valid: boolean) => void
  onChange: (entity: IEntity) => void
}

function EntityCreator (props: Props) {
  const { onChange, entity } = props

  const [properties, setProperties] = useState(configService.getProperties(entity))
  function setProperty (id: string, value?: string | number | boolean) {
    const up = produce(entity, draft => {
      const existing = draft.Properties.find(p => p.TypeId === id)
      if (existing) {
        existing.Value = value
      } else {
        draft.Properties.push({
          TypeId: id,
          Value: value
        })
      }
    })
    
    setProperties(configService.getProperties(up))
    onChange(up)
  }

  const validMap = useRef({} as any)
  function setValidity (id: string, validity: boolean) {
    validMap.current = {
      ...validMap.current,
      [id]: validity
    }
    props.validChanged(!Object.values(validMap.current).some(v => !v))
  }

  let first = -1

  return (
    <div className="grid grid-cols-2 gap-2 text-left p-6 pb-8 w-full">
      {properties.map(e => {
        first++
        return (
          <Property key={e.propertyConfiguration.TypeId}
            value={e.property?.Value}
            config={e.propertyConfiguration}
            autofocus={first === 0}
            validChanged={(validity) => { setValidity(e.propertyConfiguration.TypeId, validity) }}
            onChange={(newValue) => { setProperty(e.propertyConfiguration.TypeId, newValue) }} />
        )
      })}
    </div>
  )
}

export default EntityCreator
