// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import useMainStore from '../../../store/main-store'
import viewService, { type IIcon } from '../../../services/viewService'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isActive, isSelected } from '../../../utils/vis-data-utils'
import useAppStore from '../../../store/app-store'
import { Marker, Icon, LatLng } from 'leaflet'
import * as L from 'leaflet'
import { IEntity } from '../../../interfaces/data-models'
import { useEffectDebugger } from '../../../utils/debug'

interface Props {
  from?: IEntity
  entity: IEntity
  map: L.Map
  click?: (e: IEntity) => void
}

function MapMarker (props: Props) {
  const selectedIds = useMainStore(state => state.selectedIds)
  const date = useMainStore(state => state.currentDate)
  const historyMode = useAppStore(state => state.historyMode)
  const view = useAppStore(state => state.currentViewConfiguration)
  const [marker, setMarker] = useState(undefined as Marker | undefined)
  const [icon, setIcon] = useState(undefined as IIcon | undefined)

  const { entity, from, map, click } = props

  useEffect(() => {
    if (entity) {
      const asyncUpdate = async () => {
        setIcon(await viewService.getIconByRule(entity, view))
      }
      void asyncUpdate()
    }
  }, [entity, view])

  const selected = useMemo(() => {
    return entity != null ? isSelected(entity, selectedIds) : false
  }, [selectedIds, entity])

  const active = useMemo(() => {
    return entity != null ? isActive(entity, date) : false
  }, [date, entity])

  const [coordinates, setCoordinates] = useState(undefined as undefined | LatLng)

  useEffect(() => {
    if (historyMode && from?.Coordinates) {
      setCoordinates(L.latLng(from.Coordinates.lat, from.Coordinates.lng))
    } else if (entity.Coordinates == null) {
      setCoordinates(undefined)
    } else {
      setCoordinates(L.latLng(entity.Coordinates.lat, entity.Coordinates.lng))
    }
  }, [entity, from, historyMode])

  const animate = useRef(0)
  useEffectDebugger(() => {
    if (from?.Coordinates != null && entity.Coordinates != null && historyMode) {
      const latDiff = entity.Coordinates.lat - from.Coordinates.lat
      const lngDiff = entity.Coordinates.lng - from.Coordinates.lng

      let i = 0
      const count = 40
      setCoordinates(L.latLng(from.Coordinates.lat, from.Coordinates.lng))
      animate.current = window.setInterval(() => {
        setCoordinates((value) => {
          if (i === count) {
            window.clearInterval(animate.current)
            return new LatLng(entity.Coordinates!.lat, entity.Coordinates!.lng)
          }

          i++
          if (value) {
            return new LatLng(value.lat + latDiff / count, value.lng + lngDiff / count)
          }
          return value
        })
      }, 25)
    }

    return () => {
      window.clearInterval(animate.current)
    }
  }, [from, entity, historyMode, active])

  useEffect(() => {
    const newMarker = new Marker(new LatLng(0, 0), {
      icon: undefined,
      opacity: 1
    })

    setMarker(newMarker)
  }, [])

  useEffect(() => {
    if (marker && coordinates) {
      marker.setLatLng(coordinates)
    }
  }, [coordinates, marker])

  useEffect(() => {
    function getIcon() {
      if (!active) {
        return icon?.unselected
      }

      if (selected) {
        return icon?.selected
      }

      return icon?.unselected;
    }

    if (marker && icon) {
      marker.setIcon(new Icon({
        iconUrl: getIcon(),
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      }))
    }
  }, [active, coordinates, entity, icon, marker, selected])

  useEffect(() => {
    if (marker) {
      if (historyMode && !active) {
        return
      }
      marker.addTo(map)
    }

    return () => {
      marker?.removeFrom(map)
    }
  }, [entity, marker, map, selected, active, historyMode])

  useEffect(() => {
    if (marker) {
      if (selected && !map.getBounds().contains(marker.getLatLng())) {
        map.flyTo(marker.getLatLng())
      } else if (selected) {
        map.setView(marker.getLatLng())
      }

      marker.bindTooltip(entity.LabelChart, 
      {
          permanent: true, 
          direction: 'center',
          offset: new L.Point(0, 10),
          opacity: 1
      })

      marker.on('click', () => {
        if (click) {
          click(entity)
        }
      })
    }
  }, [click, entity, map, marker, selected])

  return <></>
}

export default MapMarker
