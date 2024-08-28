// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import useMainStore from '../../../store/main-store'
import * as L from 'leaflet'
import MapMarker from './MapMarker'
import { IEntity } from '../../../interfaces/data-models'
import { useMemo } from 'react'
import MapLine from './MapLine'

interface Props {
  entityId: string
  map: L.Map
  click?: (e: IEntity) => void
}

function EntityMarker (props: Props) {
  const { map, click } = props
  const entities = useMainStore(state => state.getEntityHistory(props.entityId))

  const positioned = useMemo(() => {
    return entities?.filter(e => e.Coordinates != null && e.ShowOnMap)
  }, [entities])

  const lines = useMemo(() => {
    const result = [] as { from: IEntity, to:IEntity}[]
    if (positioned && positioned.length > 1) {
      for (let i = 1; i < positioned.length; i++) {
        const from = positioned[i - 1]
        const to = positioned[i]

        if (from.Coordinates?.lat !== to.Coordinates?.lat || from.Coordinates?.lng !== to.Coordinates?.lng) {
          result.push( {from, to })
        }
      }
    }

    return result
  }, [positioned])

  return <>
      { positioned && positioned.map((e, i) =>
        <MapMarker key={e.InternalId} entity={e} from={i > 0 ? positioned[i-1] : undefined} map={map} click={click}></MapMarker>
      )}
      { lines && lines.map(e =>
        <MapLine key={e.from.InternalId + "-line"} from={e.from} to={e.to} map={map}></MapLine>
      )}
  </>
}

export default EntityMarker
