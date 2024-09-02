// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import type { IChartBase } from './base'

interface IEntity extends IChartBase {
  PosX?: number
  PosY?: number
  Coordinates?: { lat: number, lng: number }
  MarkIcon?: string
  ShowOnMap?: boolean
}

export type {
  IEntity
}
