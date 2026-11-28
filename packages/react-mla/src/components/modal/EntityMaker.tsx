// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import configService from '../../services/configurationService'
import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'
import { getId } from '../../utils/utils'
import EntityDialog from './EntityDialog'

// Makes the entities that are asked for, from the ribbon or the menu of the chart: it opens the dialog of the type,
// and the entity is added and selected when it is made. It is always there, whatever tab is shown
export default function EntityMaker () {
  const request = useAppStore((state) => state.entityRequest)
  const setRequest = useAppStore((state) => state.requestEntity)
  const addEntity = useMainStore((state) => state.addEntity)
  const setSelected = useMainStore((state) => state.setSelected)

  const type = request != null ? configService.getEntityConfiguration(request.typeId) : undefined
  if (request == null || type == null) {
    return null
  }

  return (
    <EntityDialog key={request.key} type={type} position={request.position}
      onCancel={() => { setRequest(undefined) }}
      onSave={(entity) => {
        setRequest(undefined)
        addEntity(entity)
        window.setTimeout(() => { setSelected([getId(entity)]) }, 100)
      }} />
  )
}
