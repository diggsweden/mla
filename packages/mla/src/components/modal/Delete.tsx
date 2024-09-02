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
    <div className="m-p-6">
      <p className="m-mb-1">Följande objekt är markerade</p>
      <ul className="m-list-inside m-list-disc">
        {props.entities.map(e => (
          <li key={e.InternalId}>{configService.getEntityConfiguration(e.TypeId).Name}: {e.LabelShort} </li>
        ))}
        {props.links.map(e => (
          <li key={e.InternalId}>{configService.getLinkConfiguration(e.TypeId).Name}: {e.LabelShort} </li>
        ))}
      </ul>
      <p className="m-font-medium m-mt-3">Vill du radera dem?</p>
    </div>
  )
}

export default Delete
