// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import {  useEffect, useState } from 'react'
import { Polyline } from 'leaflet'
import * as L from 'leaflet'
import { IEntity } from '../../../interfaces/data-models'
import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'

interface Props {
  from: IEntity
  to: IEntity
  map: L.Map
}

function MapLine (props: Props) {

  const { from, to, map } = props

  const historyMode = useAppStore(state => state.historyMode)
  const currentDate = useMainStore(state => state.currentDate)
  const [line, setLine] = useState(undefined as undefined | Polyline)

  useEffect(() => {
    if (historyMode || from?.Coordinates == null || to?.Coordinates == null) {
      setLine(undefined)
    } else {
      const newLine = new Polyline(
        [
          new L.LatLng(from.Coordinates?.lat, from.Coordinates?.lng),
          new L.LatLng(to.Coordinates?.lat, to.Coordinates?.lng)
        ], {
          color: 'blue',
          weight: 3,
          opacity: 0.5,
          smoothFactor: 1
        }
      );
  
      setLine(newLine)
    }
  }, [from, historyMode, to])

  useEffect(() => {
    if (map == null || line == null) {
      return
    }
    
    line.addTo(map)
    
    return () => {
      line?.removeFrom(map)
    }
  }, [currentDate, from, historyMode, line, map])

  return <></>
}

export default MapLine
