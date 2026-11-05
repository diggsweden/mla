// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { IShape, StrokeStyle } from '../../../interfaces/data-models/shape'
import { bounds, handlePositions } from './shape-geometry'

export const DEFAULT_STROKE_COLOR = '#446995'
// The fill of a shape is see-through, so that what is behind it can still be seen
export const FILL_OPACITY = 0.12
export const DEFAULT_FILL_COLOR = `rgba(68, 105, 149, ${FILL_OPACITY})`
export const DEFAULT_FONT_COLOR = '#111827'
export const DEFAULT_FONT_SIZE = 16

const FONT_FAMILY = 'Arial, sans-serif'
export const DEFAULT_STROKE_WIDTH = 2
const LINE_HEIGHT = 1.25
const PADDING = 4
const SELECTION_COLOR = '#4e92ed'
// The blue of the border of the text editor, which is Tailwind's blue-500
const TEXT_EDITOR_BORDER_COLOR = '#3b82f6'

export const textFont = (fontSize: number) => `${fontSize}px ${FONT_FAMILY}`

let measureContext: CanvasRenderingContext2D | null | undefined
function measure (): CanvasRenderingContext2D | null {
  measureContext ??= document.createElement('canvas').getContext('2d')
  return measureContext
}

const fillCache = new Map<string, string>()

// The color with the see-through of the default fill. Any color that the canvas understands can be given
function withFillOpacity (color: string): string {
  const cached = fillCache.get(color)
  if (cached != null) {
    return cached
  }

  const result = seeThrough(color)
  fillCache.set(color, result)
  return result
}

// The fill of a shape, as it is drawn. The shape keeps the color that was chosen, and the see-through is added here
export function shapeFill (shape: IShape): string | undefined {
  return shape.FillColor != null ? withFillOpacity(shape.FillColor) : undefined
}

function seeThrough (color: string): string {
  const ctx = measure()
  // Transparent stays as it is, and white is kept solid, since it would look like no fill at all if it was see-through
  if (ctx == null || color === 'transparent' || color.toLowerCase() === '#ffffff') {
    return color
  }
  ctx.fillStyle = '#000000'
  ctx.fillStyle = color
  // The canvas gives the color back as #rrggbb, or as rgba() when it is not opaque
  const value = ctx.fillStyle
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value)
  if (hex != null) {
    return `rgba(${parseInt(hex[1], 16)}, ${parseInt(hex[2], 16)}, ${parseInt(hex[3], 16)}, ${FILL_OPACITY})`
  }
  const rgba = /^rgba\((\d+), (\d+), (\d+),/.exec(value)
  return rgba != null ? `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${FILL_OPACITY})` : color
}

// The lines of a text, as they are wrapped to the width. A word that is too long gets its own line
export function wrapText (ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(' ')) {
      const test = line === '' ? word : line + ' ' + word
      if (line !== '' && ctx.measureText(test).width > width) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    lines.push(line)
  }

  return lines
}

// The text box is at least as high as its text needs, so that the text stays inside it
export function fitText (shape: IShape): IShape {
  return shape.Type === 'text' ? { ...shape, Height: Math.max(shape.Height, textHeight(shape)) } : shape
}

// The height that a text needs in its shape
export function textHeight (shape: IShape): number {
  const ctx = measure()
  const fontSize = shape.FontSize ?? DEFAULT_FONT_SIZE
  if (ctx == null) {
    return shape.Height
  }

  ctx.font = textFont(fontSize)
  return wrapText(ctx, shape.Text ?? '', Math.abs(shape.Width) - 2 * PADDING).length * fontSize * LINE_HEIGHT + 2 * PADDING
}

// The dashes follow the width, so that a thick line does not turn into a row of blobs. A dot is a dash without length, that the round caps of the line make visible
export function strokeDash (style: StrokeStyle | undefined, width: number): number[] {
  switch (style) {
    case 'dashed':
      return [width * 4, width * 3]
    case 'dotted':
      return [0, width * 2]
    default:
      return []
  }
}

function applyStroke (ctx: CanvasRenderingContext2D, shape: IShape) {
  const width = shape.StrokeWidth ?? DEFAULT_STROKE_WIDTH
  ctx.lineWidth = width
  ctx.lineCap = shape.StrokeStyle === 'dotted' ? 'round' : 'butt'
  ctx.setLineDash(strokeDash(shape.StrokeStyle, width))
}

function drawText (ctx: CanvasRenderingContext2D, shape: IShape) {
  const r = bounds(shape)
  const fontSize = shape.FontSize ?? DEFAULT_FONT_SIZE
  // A text has no background or border, unless it is given one
  const fill = shapeFill(shape)
  if (fill != null) {
    ctx.fillStyle = fill
    ctx.fillRect(r.left, r.top, r.right - r.left, r.bottom - r.top)
  }
  if (shape.StrokeColor != null) {
    ctx.strokeStyle = shape.StrokeColor
    ctx.strokeRect(r.left, r.top, r.right - r.left, r.bottom - r.top)
  }

  ctx.font = textFont(fontSize)
  ctx.fillStyle = shape.FontColor ?? DEFAULT_FONT_COLOR
  ctx.textBaseline = 'top'
  wrapText(ctx, shape.Text ?? '', r.right - r.left - 2 * PADDING).forEach((line, i) => {
    ctx.fillText(line, r.left + PADDING, r.top + PADDING + i * fontSize * LINE_HEIGHT)
  })
}

export function drawShape (ctx: CanvasRenderingContext2D, shape: IShape) {
  const r = bounds(shape)
  ctx.save()
  applyStroke(ctx, shape)
  ctx.strokeStyle = shape.StrokeColor ?? DEFAULT_STROKE_COLOR
  ctx.fillStyle = shapeFill(shape) ?? DEFAULT_FILL_COLOR
  switch (shape.Type) {
    case 'rectangle':
      ctx.fillRect(r.left, r.top, r.right - r.left, r.bottom - r.top)
      ctx.strokeRect(r.left, r.top, r.right - r.left, r.bottom - r.top)
      break
    case 'ellipse':
      ctx.beginPath()
      ctx.ellipse((r.left + r.right) / 2, (r.top + r.bottom) / 2, (r.right - r.left) / 2, (r.bottom - r.top) / 2, 0, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
      break
    case 'line':
      ctx.beginPath()
      ctx.moveTo(shape.X, shape.Y)
      ctx.lineTo(shape.X + shape.Width, shape.Y + shape.Height)
      ctx.stroke()
      break
    case 'text':
      drawText(ctx, shape)
      break
  }
  ctx.restore()
}

// The dashed border of the text editor, for a text box that is being drawn
export function drawTextOutline (ctx: CanvasRenderingContext2D, shape: IShape, scale: number) {
  const r = bounds(shape)
  ctx.save()
  ctx.lineWidth = 1 / scale
  ctx.strokeStyle = TEXT_EDITOR_BORDER_COLOR
  ctx.setLineDash([4 / scale, 3 / scale])
  ctx.strokeRect(r.left, r.top, r.right - r.left, r.bottom - r.top)
  ctx.restore()
}

// The outline of a selected shape, and the handles to resize it. They keep their size on the screen when the chart is zoomed
export function drawSelection (ctx: CanvasRenderingContext2D, shape: IShape, scale: number, handles: boolean) {
  const r = bounds(shape)
  const pad = 4 / scale
  ctx.save()
  ctx.lineWidth = 1 / scale
  ctx.strokeStyle = SELECTION_COLOR
  ctx.setLineDash([5 / scale, 4 / scale])
  ctx.strokeRect(r.left - pad, r.top - pad, r.right - r.left + 2 * pad, r.bottom - r.top + 2 * pad)
  ctx.setLineDash([])
  if (handles) {
    const size = 8 / scale
    ctx.fillStyle = '#ffffff'
    for (const { point } of handlePositions(shape)) {
      ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size)
      ctx.strokeRect(point.x - size / 2, point.y - size / 2, size, size)
    }
  }
  ctx.restore()
}
