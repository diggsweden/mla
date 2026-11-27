// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { type ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import Property from '../common/Property'
import { produce } from 'immer'
import { IPropertyConfiguration } from '../../interfaces/configuration'

interface Props {
  link: ILink
  validChanged: (valid: boolean) => void
  // The properties that are not filled in as they must be, by their type
  invalidChanged?: (typeIds: string[]) => void
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

  const validMap = useRef<Record<string, boolean>>({})
  function setValidity (id: string, validity: boolean) {
    validMap.current = {
      ...validMap.current,
      [id]: validity
    }
    props.validChanged(!Object.values(validMap.current).some(v => !v))
    props.invalidChanged?.(Object.keys(validMap.current).filter(key => !validMap.current[key]))
  }

  // Report the initial link to the parent when mounting
  const reportLink = useEffectEvent(() => { onChange(link) })
  useEffect(() => {
    reportLink()
  }, [])

  let first = -1
  // The fields that are alone on their row: a text of more lines has a row of its own, and the others are two to a row
  const alone = new Set<string>()
  let pending: string | undefined
  for (const e of properties) {
    if (e.propertyConfiguration.FieldType === 'Multiline') {
      if (pending != null) alone.add(pending)
      pending = undefined
    } else if (pending == null) {
      pending = e.propertyConfiguration.TypeId
    } else {
      pending = undefined
    }
  }
  if (pending != null) alone.add(pending)

  return (
    <div className="m:grid m:grid-cols-2 m:gap-x-3 m:gap-y-3 m:text-left m:px-6 m:pt-2 m:pb-6 m:w-full">
      {properties.map(e => {
        first++
        const config = e.propertyConfiguration
        const help = helpOf(config.Name, config.Description)
        return (
          // A text of more lines has the whole width and room for a few lines, and a yes or no lines up with the fields beside it
          // A field alone on its row keeps its width, and its help has the whole row
          <div key={config.TypeId} className={config.FieldType === 'Multiline' ? 'm:col-span-2 m:[&_textarea]:min-h-24' : alone.has(config.TypeId) ? 'm:col-span-2 m:grid m:grid-cols-2 m:gap-x-3' : config.FieldType === 'Boolean' ? 'm:self-end m:pb-1' : undefined}>
            <Property
              value={e.property?.Value ?? ''}
              // A field that must be filled in has a star after its name
              config={config.Required ? { ...config, Name: config.Name + ' *' } : config}
              autofocus={first === 0}
              validChanged={(validity) => { setValidity(config.TypeId, validity) }}
              onChange={(newValue) => { setProperty(config, newValue) }} />
            {help && <p className="m:col-span-2 m:mt-1 m:text-[12px] m:leading-snug m:text-gray-600">{help}</p>}
          </div>
        )
      })}
    </div>
  )
}

// The description of a field, shown below it, when it says more than the name of the field does
function helpOf (name: string, description?: string): string | undefined {
  const text = description?.trim()
  if (!text) return undefined
  const plain = (value: string) => value.toLowerCase().replace(/[^a-zåäöæø0-9]/g, '')
  return plain(text) === plain(name) ? undefined : text
}

export default LinkCreator
