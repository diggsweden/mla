// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { IChartBase, ILinked } from './base'

type Direction = 'TO' | 'FROM' | 'NONE'
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
