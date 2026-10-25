// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

type ShapeType = 'text' | 'rectangle' | 'ellipse' | 'line'
type StrokeStyle = 'solid' | 'dashed' | 'dotted'

// A shape that is drawn on the chart, to mark an area, to connect things or to write a text. The position and the size are in the coordinates of the chart,
// so a shape follows the chart when it is moved and zoomed. A line goes from (X, Y) to (X + Width, Y + Height), and the size can be negative.
interface IShape {
  Id: string
  Type: ShapeType
  X: number
  Y: number
  Width: number
  Height: number
  StrokeColor?: string
  StrokeWidth?: number
  StrokeStyle?: StrokeStyle
  FillColor?: string
  Text?: string
  FontSize?: number
  FontColor?: string
}

export type {
  IShape,
  ShapeType,
  StrokeStyle
}
