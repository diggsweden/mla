// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useMemo } from 'react'
import useAppStore from '../../../store/app-store'
import * as L from 'leaflet'
import { IGeoFeature } from '../../../interfaces/data-models/geo'
import { leafletId } from '../../../utils/leaflet-utils'

interface Props {
  geo: IGeoFeature
  map: L.Map
  click?: (e: unknown) => void
}

function GeoFeature (props: Props) {
  const setSelectedGeoFeature = useAppStore(state => state.setSelectedGeoFeature)
  const showContextMenu = useAppStore(state => state.showContextMenu)
  const { geo, map, click } = props
  const poly = useMemo((): L.Circle | L.Polygon | undefined => {
    if (geo?.Circle) {
      return new L.Circle(geo.Circle.Position, geo.Circle.Radius)
    }

    if (geo?.Polygon) {
      return new L.Polygon(geo.Polygon)
    }

    return undefined
  }, [geo])

  useEffect(() => {
    if (poly && map) {
      map.eachLayer(l => {
        if (leafletId(l) === geo.Id) {
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
