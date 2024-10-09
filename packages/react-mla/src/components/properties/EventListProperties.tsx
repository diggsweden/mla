// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import type { IEventLink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import Property from '../common/Property'
import Modal from '../common/Modal'
import TableTool from '../tools/TableTool'
import Icon from '../common/Icon'
import { useTranslation } from 'react-i18next'

interface Props {
  eventLink: IEventLink
}

function EventListProperties (props: Props) {
  const { t } = useTranslation();
  const { eventLink } = props

  const [showModal, setShowModal] = useState(false)

  if (eventLink.Events.length === 0) {
    return null
  }

  return (
    <div className="m-px-3 m-mt-3">
      {configService.getProperties(eventLink).map(e => (
        <Property key={eventLink.Id + e.propertyConfiguration.TypeId}
          readOnly={true}
          value={e.property?.Value}
          config={e.propertyConfiguration} />
      ))}
      <div>
        <button onClick={() => { setShowModal(true) }} className='w-full text-white bg-primary enabled:hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded px-2 py-1 mr-2 my-2 disabled:opacity-50'>
          <Icon name="table_view" className="m-w-5 m-h-5 m-inline-block m-m-0 -m-mb-1" color='#ffffff'></Icon>
          {t('show as table count', { count: eventLink.Events.length})}</button>
      </div>
      {showModal &&
        <Modal mode='ok' wide={true} show={showModal} title={configService.getTypeName(eventLink.Events[0])} onNegative={() => { setShowModal(false) }} onPositive={() => { setShowModal(false) }}>
          <TableTool items={eventLink.Events} />
        </Modal>
      }
    </div>
  )
}

export default EventListProperties
