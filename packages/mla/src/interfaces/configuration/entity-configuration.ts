// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type IChartThing } from './common-configuration'

interface IEntityConfiguration extends IChartThing {
  Description: string
  Coordinates?: { lat: number, lng: number }
}

export type {
  IEntityConfiguration
}
