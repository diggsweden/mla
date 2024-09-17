// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

interface ICoordinate {
  lat: number
  lng: number
}

interface IGeoFeature {
  Id?: string
  Point?: ICoordinate
  Polygon?: ICoordinate[]
  Circle?: {
    Position: ICoordinate
    Radius: number
  }
}

interface IGeoFeatureBounds extends IGeoFeature {
  Bounds?: Bounds
}

interface Bounds {
  contains(coordinate: ICoordinate): boolean
}

export type {
  ICoordinate,
  IGeoFeature,
  IGeoFeatureBounds
}
