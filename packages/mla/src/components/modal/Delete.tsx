// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type IEntity, type ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'

interface Props {
  entities: IEntity[]
  links: ILink[]
}

function Delete (props: Props) {
  return (
    <div className='p-6'>
      <p className='mb-1'>Följande objekt är markerade</p>
      <ul className='list-inside list-disc'>
        {props.entities.map(e => (
          <li key={e.InternalId}>{configService.getEntityConfiguration(e.TypeId).Name}: {e.LabelShort} </li>
        ))}
        {props.links.map(e => (
          <li key={e.InternalId}>{configService.getLinkConfiguration(e.TypeId).Name}: {e.LabelShort} </li>
        ))}
      </ul>
      <p className='font-medium mt-3'>Vill du radera dem?</p>
    </div>
  )
}

export default Delete
