// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { IShape, ShapeType, StrokeStyle } from '../interfaces/data-models/shape'

const SHAPE_TYPES: ShapeType[] = ['text', 'rectangle', 'ellipse', 'line']
const STROKE_STYLES: StrokeStyle[] = ['solid', 'dashed', 'dotted']

// What a number of a shape can be, so that a shape from a file can not make the chart unusable
const MAX_COORDINATE = 1e7
const FONT_SIZE = { min: 1, max: 500 }
const STROKE_WIDTH = { min: 0.5, max: 50 }
const MAX_TEXT_LENGTH = 10000
const MAX_COLOR_LENGTH = 100

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function number (value: unknown, min = -MAX_COORDINATE, max = MAX_COORDINATE): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : undefined
}

function text (value: unknown, maxLength: number): string | undefined {
  return typeof value === 'string' && value.length <= maxLength ? value : undefined
}

function parseShape (value: unknown): IShape | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = text(value.Id, MAX_COLOR_LENGTH)
  const type = SHAPE_TYPES.find(t => t === value.Type)
  const x = number(value.X)
  const y = number(value.Y)
  const width = number(value.Width)
  const height = number(value.Height)
  if (id == null || id === '' || type == null || x == null || y == null || width == null || height == null) {
    return undefined
  }

  return {
    Id: id,
    Type: type,
    X: x,
    Y: y,
    Width: width,
    Height: height,
    StrokeColor: text(value.StrokeColor, MAX_COLOR_LENGTH),
    StrokeWidth: number(value.StrokeWidth, STROKE_WIDTH.min, STROKE_WIDTH.max),
    StrokeStyle: STROKE_STYLES.find(s => s === value.StrokeStyle),
    FillColor: text(value.FillColor, MAX_COLOR_LENGTH),
    Text: text(value.Text, MAX_TEXT_LENGTH),
    FontSize: number(value.FontSize, FONT_SIZE.min, FONT_SIZE.max),
    FontColor: text(value.FontColor, MAX_COLOR_LENGTH)
  }
}

// The shapes that can be used, from something that is read from a file or the clipboard. The rest is left out, and so is a shape that is there twice
export function parseShapes (value: unknown): IShape[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const shapes: IShape[] = []
  for (const item of value) {
    const shape = parseShape(item)
    if (shape != null && !seen.has(shape.Id)) {
      seen.add(shape.Id)
      shapes.push(shape)
    }
  }

  return shapes
}
