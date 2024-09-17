// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from 'react-i18next';
import { type IEntity, type ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'

interface Props {
  entities: IEntity[]
  links: ILink[]
}

function Delete (props: Props) {
  const { t } = useTranslation();
  return (
    <div className="m-p-6">
      <p className="m-mb-1">{t('these objects are selected')}</p>
      <ul className="m-list-inside m-list-disc">
        {props.entities.map(e => (
          <li key={e.InternalId}>{configService.getEntityConfiguration(e.TypeId)?.Name}: {e.LabelShort} </li>
        ))}
        {props.links.map(e => (
          <li key={e.InternalId}>{configService.getLinkConfiguration(e.TypeId)?.Name}: {e.LabelShort} </li>
        ))}
      </ul>
      <p className="m-font-medium m-mt-3">{t('delete them?')}</p>
    </div>
  )
}

export default Delete
