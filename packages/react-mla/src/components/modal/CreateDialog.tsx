// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IPropertyConfiguration } from '../../interfaces/configuration'
import type { IEntity, ILink } from '../../interfaces/data-models'
import Modal from '../common/Modal'
import PropertyFields from './PropertyFields'

export const sectionLabel = 'm:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600'

interface Props<T extends IEntity | ILink> {
  title: string
  // The button that makes it, which says what is made, like "Create person"
  createLabel: string
  // What is always seen at the top, like what is made or whom a relation is between
  top: ReactNode
  // What is chosen before the details, like the type of a relation
  choice?: ReactNode
  item: T
  // The fields of what is made. When they change, as with another type, the fields start over
  configs: IPropertyConfiguration[]
  fieldsKey: string
  onChange: (item: T) => void
  onSave: () => void
  onCancel: () => void
}

// The dialog that makes an entity or a relation: what is made at the top, its details, and what is missing at the bottom
function CreateDialog<T extends IEntity | ILink> (props: Props<T>) {
  const { t } = useTranslation()
  // Valid until a field says it is not; a type without properties has no fields to say so
  const [valid, setValid] = useState(true)
  // The fields that are not filled in as they must be, by their type. Other fields start with nothing missing
  const [invalid, setInvalid] = useState<string[]>([])
  const [fieldsKey, setFieldsKey] = useState(props.fieldsKey)
  if (fieldsKey !== props.fieldsKey) {
    setFieldsKey(props.fieldsKey)
    setInvalid([])
  }

  const missing = invalid.map(key => props.configs.find(p => p.TypeId === key)?.Name).filter(Boolean)
  const hasRequired = props.configs.some(p => p.Required)

  return (
    <Modal mode="save" show={true} valid={valid} title={props.title} positiveLabel={props.createLabel} fitScreen
      footerNote={!valid && missing.length > 0 ? <span className="m:text-[13px] m:text-red-700">{t('fill in', { names: missing.join(', ') })}</span> : undefined}
      onNegative={props.onCancel} onPositive={props.onSave}>
      {/* What is made is always seen */}
      <div className="m:shrink-0 m:text-left m:border-b m:border-gray-200">
        {props.top}
      </div>

      {/* The choice and the details scroll when they do not fit */}
      <div className="mla-form-fields m:min-h-0 m:flex-1 m:overflow-y-auto">
        {props.choice}
        <div className="m:flex m:items-baseline m:justify-between m:text-left m:px-6 m:pt-4">
          <span className={sectionLabel}>{t('details')}</span>
          {hasRequired && <span className="m:text-[12px] m:text-gray-600">{t('required fields')}</span>}
        </div>
        <PropertyFields key={props.fieldsKey} item={props.item} validChanged={setValid}
          // The fields tell their validity at every render, so the list is only changed when what is in it is
          invalidChanged={(keys) => { setInvalid(current => (current.join() === keys.join() ? current : keys)) }}
          onChange={props.onChange} />
      </div>
    </Modal>
  )
}

export default CreateDialog
