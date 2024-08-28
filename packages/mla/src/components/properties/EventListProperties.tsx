// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useState } from 'react'
import type { IEventLink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import Property from '../common/property'
import Modal from '../common/Modal'
import TableTool from '../tools/TableTool'
import Icon from '../common/Icon'

interface Props {
  eventLink: IEventLink
}

function EventListProperties (props: Props) {
  const { eventLink } = props

  const [showModal, setShowModal] = useState(false)

  if (eventLink.Events.length === 0) {
    return null
  }

  return (
    <div className='px-3 mt-3'>
      {configService.getProperties(eventLink).map(e => (
        <Property key={eventLink.Id + e.propertyConfiguration.TypeId}
          readOnly={true}
          value={e.property?.Value}
          config={e.propertyConfiguration} />
      ))}
      <div>
        <button onClick={() => { setShowModal(true) }} className='w-full text-white bg-primary enabled:hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded px-2 py-1 mr-2 my-2 disabled:opacity-50'>
          <Icon name="table_view" className='w-5 h-5 inline-block m-0 -mb-1' color='#ffffff'></Icon>
          Visa som tabell ({eventLink.Events.length})</button>
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
