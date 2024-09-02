// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import type { IChartBase, ILinked } from './base'

type Direction = 'TO' | 'FROM' | 'BOTH' | 'NONE'
type LinkDashStyle = 'LINE' | 'DASHED' | 'DOTTED'
interface ILink extends IChartBase, ILinked {
  Direction: Direction
  Style?: LinkDashStyle
}

export type {
  ILink,
  Direction,
  LinkDashStyle
}
