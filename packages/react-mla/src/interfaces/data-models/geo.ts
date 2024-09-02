// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { LatLngBounds } from 'leaflet'

interface ICoordinate {
  lat: number
  lng: number
}

interface IGeoFeature {
  Point?: ICoordinate
  Polygon?: ICoordinate[]
  Circle?: {
    Position: ICoordinate
    Radius: number
  }
}

interface IGeoFeatureBounds extends IGeoFeature {
  Bounds?: LatLngBounds
}

export type {
  ICoordinate,
  IGeoFeature,
  IGeoFeatureBounds
}
