// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

interface IMapConfiguration {
  Layers?: WmsConfiguration[]
  WmsMapLayers?: WmsConfiguration[]
  MapLayers?: TileConfiguration[]
}

interface TileConfiguration {
  Url: string
  MaxZoom?: number
  MinZoom?: number
  SubDomains?: string[]
  TMS: boolean
  Attribution?: string
  Name: string
}

interface WmsConfiguration {
  Url: string
  Layers: string
  Format: string
  Version: string
  Transparent: boolean
  Attribution?: string
  Name: string
}

export type {
  IMapConfiguration,
  WmsConfiguration,
  TileConfiguration
}
