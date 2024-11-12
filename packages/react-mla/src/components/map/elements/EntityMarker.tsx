// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useMainStore from '../../../store/main-store'
import * as L from 'leaflet'
import MapMarker from './MapMarker'
import { IEntity } from '../../../interfaces/data-models'
import { useCallback } from 'react'
import MapLine from './MapLine'
import useAppStore from '../../../store/app-store'
import { isActive } from '../../../utils/utils'

interface Props {
  entityId: string
  map: L.Map
  click?: (e: IEntity) => void
}

function EntityMarker (props: Props) {
  const { map, click } = props
  const entities = useMainStore(state => state.getEntityHistory(props.entityId))
  const currentDate = useMainStore(state => state.currentDate)
  const historymode = useAppStore(state => state.historyMode)

  const positionedCb = useCallback(() => {
    return entities?.filter(e => e.Coordinates != null && e.ShowOnMap) || []
  }, [entities])

  const linesCb = useCallback(() => {
    const positioned = positionedCb();
    const result = [] as { from: IEntity, to:IEntity}[]
    if (positioned.length > 1) {
      for (let i = 1; i < positioned.length; i++) {
        const from = positioned[i - 1]
        const to = positioned[i]

        if (from.Coordinates?.lat !== to.Coordinates?.lat || from.Coordinates?.lng !== to.Coordinates?.lng) {
          result.push( {from, to })
        }
      }
    }

    return result
  }, [positionedCb])

  const historyPositionedCb = useCallback(() => {
    const positioned = positionedCb();
    if (positioned.length == 0) {
      return null
    }

    let from = undefined as IEntity | undefined
    let last = positioned[0]
    let active = isActive(last, currentDate)
    for (let i = 1; i < positioned.length; i ++) {
      const e = positioned[i]
      if (!isActive(e, currentDate) && active) {
        break
      }
      
      from = last
      last = e
      if (isActive(e, currentDate)) {
        active = true
      }
    }
    return { from, last }
  }, [positionedCb, currentDate])

  if (historymode) {
    const positioned = historyPositionedCb()
    if (positioned) {
      return <MapMarker key={positioned.last.InternalId} entity={positioned.last} from={positioned.from} map={map} click={click}></MapMarker>
    }
  } else {
    const positioned = positionedCb()
    const lines = linesCb()
    return <>
        { positioned && positioned.map((e, i) =>
          <MapMarker key={e.InternalId} entity={e} from={i > 0 ? positioned[i-1] : undefined} map={map} click={click}></MapMarker>
        )}
        { lines && lines.map(e =>
          <MapLine key={e.from.InternalId + "-line"} from={e.from} to={e.to} map={map}></MapLine>
        )}
    </>
  }

}

export default EntityMarker
