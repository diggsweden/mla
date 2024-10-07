// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useState } from 'react'
import useAppStore from '../../../store/app-store'
import * as L from 'leaflet'
import { IGeoFeature } from '../../../interfaces/data-models/geo'

interface Props {
  geo: IGeoFeature
  map: L.Map
  click?: (e: any) => void
}

function GeoFeature (props: Props) {
  const setSelectedGeoFeature = useAppStore(state => state.setSelectedGeoFeature)
  const showContextMenu = useAppStore(state => state.showContextMenu)
  const { geo, map, click } = props
  const [poly, setPoly] = useState(undefined as L.Circle | L.Polygon | undefined)

  useEffect(() => {
    if (geo) {
      if (geo.Circle) {
        setPoly(new L.Circle(geo.Circle.Position, geo.Circle.Radius))
      }
      else if (geo.Polygon) {
        setPoly(new L.Polygon(geo.Polygon))
      }
    }
  }, [geo])

  useEffect(() => {
    if (poly && map) {
      map.eachLayer(l => {
        if ((l as any)._leaflet_id.toString() === geo.Id) {
          map.removeLayer(l)
        }
      })

      poly.on('contextmenu', (ev) => {
        const selected = { Point: { lat: ev.latlng.lat, lng: ev.latlng.lng }, Circle: geo.Circle, Polygon: geo.Polygon, Bounds: poly.getBounds() }
        setSelectedGeoFeature(selected)
        showContextMenu(ev.originalEvent.clientX, ev.originalEvent.clientY)
      })

      poly.addTo(map)
    }

    return () => {
      poly?.removeFrom(map)
    }
  }, [click, poly, map, geo, setSelectedGeoFeature, showContextMenu])

  return <></>
}

export default GeoFeature
