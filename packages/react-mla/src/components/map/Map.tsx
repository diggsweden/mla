// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import configService from '../../services/configurationService'
import useMainStore from '../../store/main-store'
import useAppStore from '../../store/app-store'
import { LatLng, type PM } from 'leaflet'
import * as L from 'leaflet'

import './Map.scss'
import '@geoman-io/leaflet-geoman-free'
import './fullscreen/Control.FullScreen'

import { produce } from 'immer'
import EntityMarker from './elements/EntityMarker'
import { getId } from '../../utils/utils'
import { IEntity } from '../../interfaces/data-models'
import { TileConfiguration, WmsConfiguration } from '../../interfaces/configuration/map-configuration'
import { IGeoFeatureBounds } from '../../interfaces/data-models/geo'
import GeoFeature from './elements/GeoFeature'
import { useTranslation } from 'react-i18next'

interface Props {
  className?: string
}

export default function Map(props: Props) {
  const { t } = useTranslation();
  const showContextMenu = useAppStore(state => state.showContextMenu)
  const showMap = useAppStore(state => state.showMap)
  const setSelectedGeoFeature = useAppStore(state => state.setSelectedGeoFeature)

  const placeEntityId = useAppStore(state => state.placeEntityId)
  const setPlaceEntityId = useAppStore(state => state.setPlaceEntityId)
  const getEntity = useMainStore(state => state.getCurrentEntity)
  const getEntities = useMainStore(state => state.getEntityHistory)

  const setSelected = useMainStore(state => state.setSelected)
  const setDate = useMainStore(state => state.setDate)
  const entities = useMainStore(state => state.entities)
  const update = useMainStore(state => state.updateEntity)

  const addGeo = useMainStore(state => state.setGeoFeature)
  const removeGeo = useMainStore(state => state.removeGeoFeature)
  const geoFeatures = useMainStore(state => state.geoFeatures)

  const [map, setMap] = useState<L.Map | null>(null)

  function onSelect(e: IEntity) {
    setSelected([getId(e)])
    if (e.DateFrom) {
      setDate(e.DateFrom)
    }
  }

  const mapRef = useCallback((node: HTMLDivElement | null) => {
    if (node != null) {
      const center = new LatLng(57.697909930605185, 12.006280860668483)
      const zoom = 13

      const mapOptions = {
        maxBounds: [[-90, -180], [90, 180]],
        center,
        zoom,
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: 'topleft'
        }
      } as any

      try {
        const config = configService.getConfiguration().MapConfiguration!
        const lMap = new L.Map(node, mapOptions)

        const layerControl = L.control.layers().addTo(lMap)

        const layers = [] as L.TileLayer[]
        if (config.MapLayers) {
          (config.MapLayers as TileConfiguration[]).forEach((layer) => {
            const mapLayer = L.tileLayer(layer.Url, {
              attribution: layer.Attribution,
              maxZoom: layer.MaxZoom,
              minZoom: layer.MinZoom,
              tms: layer.TMS, 
              subdomains: layer.SubDomains ?? []
            })

            layers.push(mapLayer)
            layerControl.addBaseLayer(mapLayer, layer.Name)
          })
        }

        if (config.WmsMapLayers) {
          (config.WmsMapLayers as WmsConfiguration[]).forEach((layer) => {
            const mapLayer = L.tileLayer.wms(layer.Url, {
              layers: layer.Layers,
              format: layer.Format,
              transparent: layer.Transparent,
              version: layer.Version,
              attribution: layer.Attribution
            })

            layers.push(mapLayer)
            layerControl.addBaseLayer(mapLayer, layer.Name)
          })
        }

        if (layers.length == 0) {
          console.error(config)
          throw new Error("No map layers configured")
        }

        layers[0].addTo(lMap)

        if (config.Layers != null) {
          (config.Layers as WmsConfiguration[]).forEach((map) => {
            const overlay = L.tileLayer.wms(map.Url, {
              layers: map.Layers,
              format: map.Format,
              transparent: map.Transparent,
              version: map.Version,
              attribution: map.Attribution
            })
            layerControl.addOverlay(overlay, map.Name)
          })
        }


        lMap.pm.addControls({
          position: 'topright',
          drawCircleMarker: false,
          drawRectangle: false,
          drawMarker: false,
          drawText: false,
          drawPolyline: false,
          editMode: false,
          rotateMode: false,
          dragMode: false,
          cutPolygon: false
        })

        setMap(lMap)
      } catch (e) {
        console.debug(e)
      }
    }
  }, [])

  useLayoutEffect(() => {
    if (map == null) {
      return
    }

    function getGeo (e: { shape: PM.SUPPORTED_SHAPES, layer: L.Layer }): IGeoFeatureBounds | undefined {
      switch (e.shape) {
        case 'Circle': {
          const circle = e.layer as L.Circle
          return { Id: (circle as any)._leaflet_id.toString(), Circle: { Position: { lat: circle.getLatLng().lat, lng: circle.getLatLng().lng }, Radius: circle.getRadius() } }
        }
        case 'Polygon': {
          const poly = e.layer as L.Polygon
          return { Id: (poly as any)._leaflet_id.toString(), Polygon: (poly.getLatLngs() as L.LatLng[]) }
        }
      }

      return undefined
    }

    function polygonCreated(e: { shape: PM.SUPPORTED_SHAPES, layer: L.Layer}) {
      const geo = getGeo(e)
      if (geo) {
        addGeo(geo)
      }
      
      // We add this manually
      if (map) {
        e.layer.removeFrom(map)
      }
    }

    function polygonRemoved(e: { shape: PM.SUPPORTED_SHAPES, layer: L.Layer }) {
      const geo = getGeo(e)
      if (geo) {
        removeGeo(geo)
      }
    }

    map.on('contextmenu', (e) => {
      const container = (map as any)._container

      // Click was on another layer / feature
      if (container._leaflet_id !== (e.originalEvent.target as any)?._leaflet_id) {
        return
      }

      e.originalEvent.preventDefault()
      setSelectedGeoFeature({ Point: { lat: e.latlng.wrap().lat, lng: e.latlng.wrap().lng } })
      showContextMenu(e.originalEvent.clientX, e.originalEvent.clientY)
    })

    map.on('pm:create', (e) => {
      polygonCreated(e)
    })

    map.on('pm:remove', (e) => {
      polygonRemoved(e)
    })

    map.pm.setLang('sv')
  }, [map, setSelectedGeoFeature, showContextMenu, addGeo, removeGeo])

  const mapEntities = useMemo(() => {
    const showOnMap = [] as string[]

    for (const ent of Object.keys(entities)) {
      const entity = entities[ent].find(e => e.Coordinates != null && e.ShowOnMap)
      if (entity != null) {
        showOnMap.push(ent)
      }
    }
    return showOnMap
  }, [entities])

  useEffect(() => {
    if (showMap && map) {
      map.invalidateSize()
    }
  }, [showMap, map])

  useEffect(() => {
    const setPosition = (ev: any) => {
      if (placeEntityId != null) {
        const ent = getEntity(placeEntityId)
        if (ent) {
          const updateEntity = produce(ent, draft => {
            draft.Coordinates = { lat: ev.latlng.wrap().lat, lng: ev.latlng.wrap().lng }
            draft.ShowOnMap = true
          })
          update(updateEntity)
          setPlaceEntityId()
        }
      }
    }

    if (map && placeEntityId) {
      map.on('click', setPosition)
      return () => {
        map.off('click', setPosition)
      }
    }

    return
  }, [map, placeEntityId, update, getEntities, setPlaceEntityId, getEntity])

  if (configService.getConfiguration().MapConfiguration == null) {
    return null
  }

  return (
    <div className={props.className + ' m-bg-white'}>
      <div className="m-h-full m-w-full m-relative">
        {placeEntityId && <div className="m-absolute m-h-full m-w-full m-z-30 m-opacity-75 m-pointer-events-none">
          <p className="m-bg-white m-mx-20 m-mt-5 m-text-center m-rounded-md">
            {t('click to place', { name: getEntity(placeEntityId)!.LabelShort})}
          </p>
        </div>}

        <div ref={mapRef} className="m-h-full m-w-full m-z-20" ></div>
      </div>
      {map && showMap && mapEntities.map(s =>
        <EntityMarker key={s} entityId={s} map={map} click={(e) => { onSelect(e) }}></EntityMarker>
      )}
      {map && showMap && geoFeatures.map(g =>
        <GeoFeature key={g.Id} geo={g} map={map}></GeoFeature>
      )}
    </div>)
}
