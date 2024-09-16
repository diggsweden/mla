// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import { type IPhaseEvent } from '../../interfaces/data-models'
import { generateUUID } from '../../utils/utils'
import { DateTime } from 'luxon'
import { fixDate } from '../../utils/date'
import { useTranslation } from 'react-i18next'

interface Props {
  onChange: (event: IPhaseEvent) => void
  value?: IPhaseEvent
}

function PhaseCreator (props: Props) {
  const { t } = useTranslation();
  const { onChange, value } = props
  const [newEvent, setEvent] = useState(value ?? {
    Id: generateUUID(),
    Description: '',
    Date: DateTime.now()
  } satisfies IPhaseEvent)

  function setDate (date: Date | null): void {
    if (date == null) {
      return
    }
    const update = {
      ...newEvent,
      Date: fixDate(date)!
    }
    setEvent(update)
    onChange(update)
  }

  function setText (text: string) {
    const update = {
      ...newEvent,
      Description: text
    }
    setEvent(update)
    onChange(update)
  }

  const inputStyle = "m-bg-white m-border m-border-gray-300 m-text-gray-900 m-rounded-lg focus:m-ring-blue-500 focus:m-border-blue-500 m-block m-w-full m-p-1"
  return (
    <div className="m-grid m-grid-cols-2 m-gap-2 m-text-left m-p-6 m-pb-8 m-w-full">
      <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900">{t('description')}</span>
      <input autoFocus type="text" value={newEvent.Description} onChange={(e) => { setText(e.target.value) }} className={inputStyle}></input>

      <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900">{t('date')}</span>
      <input required type="date" value={newEvent.Date.toISO()!.slice(0, 10)} onChange={(e) => { setDate(e.target.valueAsDate) }} className={inputStyle}></input>
    </div>
  )
}

export default PhaseCreator
