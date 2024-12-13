// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { IChartBase } from './base'

interface IEntity extends IChartBase {
  PosX?: number
  PosY?: number
  Coordinates?: { lat: number, lng: number }
  ShowOnMap?: boolean
}

export type {
  IEntity
}
