// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IEntityConfiguration } from '../../interfaces/configuration'
import type { IEntity } from '../../interfaces/data-models'
import viewService from '../../services/viewService'
import { newEntity } from '../../utils/new-entity'
import Icon from '../common/Icon'
import CreateDialog from './CreateDialog'

interface Props {
  type: IEntityConfiguration
  // Where in the chart it is placed, when it was made from there
  position?: { x: number, y: number }
  onSave: (entity: IEntity) => void
  onCancel: () => void
}

// The name of the type inside a sentence, like "Create person", unless it is written in capitals like an abbreviation
function inSentence (name: string): string {
  return name.length > 1 && name[1] === name[1].toLowerCase() ? name[0].toLowerCase() + name.slice(1) : name
}

// The dialog that makes an entity of a type: the type at the top, and its details
function EntityDialog (props: Props) {
  const { t } = useTranslation()
  const { type } = props
  const view = viewService.getView(type.TypeId, type.GlobalType)
  const [entity, setEntity] = useState(() => newEntity(type, props.position))

  return (
    <CreateDialog title={t('new entity')} createLabel={t('create named', { name: inSentence(type.Name) })}
      item={entity} configs={type.Properties} fieldsKey={type.TypeId}
      onChange={setEntity} onSave={() => { props.onSave(entity) }} onCancel={props.onCancel}
      top={
        <div className="m:flex m:items-center m:gap-2.5 m:px-6 m:py-4">
          <Icon name={view.Icon} color={view.Color} className="m:h-6 m:w-6 m:shrink-0" />
          <span className="m:text-[15px] m:font-semibold">{type.Name}</span>
          {type.Description && <span className="m:text-[13px] m:text-gray-600 m:truncate">{type.Description}</span>}
        </div>
      } />
  )
}

export default EntityDialog
