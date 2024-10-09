// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef, useState } from 'react'
import { type ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import Property from '../common/Property'
import { produce } from 'immer'
import { IPropertyConfiguration } from '../../interfaces/configuration'

interface Props {
  link: ILink
  validChanged: (valid: boolean) => void
  onChange: (entity: ILink) => void
}

function LinkCreator (props: Props) {
  const { link, onChange } = props

  const [properties, setProperties] = useState(configService.getProperties(link))
  function setProperty (prop: IPropertyConfiguration, value?: string | number | boolean) {
    const up = produce(link, draft => {
      const existing = draft.Properties.find(p => p.TypeId === prop.TypeId)
      if (existing) {
        existing.Value = value
      } else {
        draft.Properties.push({
          GlobalType: prop.GlobalType,
          TypeId: prop.TypeId,
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

  useEffect(() => {
    onChange(link)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  let first = -1

  return (
    <div className="m-grid m-grid-cols-2 m-gap-2 m-text-left m-p-6 m-pb-8 m-w-full">
      {properties.map(e => {
        first++
        return (
          <Property key={e.propertyConfiguration.TypeId}
            value={e.property?.Value ?? ''}
            config={e.propertyConfiguration}
            autofocus={first === 0}
            validChanged={(validity) => { setValidity(e.propertyConfiguration.TypeId, validity) }}
            onChange={(newValue) => { setProperty(e.propertyConfiguration, newValue) }} />
        )
      })}
    </div>
  )
}

export default LinkCreator
