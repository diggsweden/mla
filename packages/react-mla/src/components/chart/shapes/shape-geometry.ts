// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { IShape } from '../../../interfaces/data-models/shape'

// The functions of this file work in the coordinates of the chart, and do not draw anything

export interface Point {
  x: number
  y: number
}

export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

// The corners of a rectangle, an ellipse or a text, and the ends of a line
export type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'start' | 'end'

export function bounds (shape: IShape): Rect {
  return {
    left: Math.min(shape.X, shape.X + shape.Width),
    top: Math.min(shape.Y, shape.Y + shape.Height),
    right: Math.max(shape.X, shape.X + shape.Width),
    bottom: Math.max(shape.Y, shape.Y + shape.Height)
  }
}

// A rectangle, an ellipse or a text has a positive size, and a line keeps its direction
export function normalise (shape: IShape): IShape {
  if (shape.Type === 'line') {
    return shape
  }

  const r = bounds(shape)
  return { ...shape, X: r.left, Y: r.top, Width: r.right - r.left, Height: r.bottom - r.top }
}

function distanceToSegment (p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

// The tolerance is how far from the shape a point still hits it, in the units of the chart
export function containsPoint (shape: IShape, point: Point, tolerance: number): boolean {
  const r = bounds(shape)
  switch (shape.Type) {
    case 'line':
      return distanceToSegment(point, { x: shape.X, y: shape.Y }, { x: shape.X + shape.Width, y: shape.Y + shape.Height }) <= tolerance
    case 'ellipse': {
      const rx = (r.right - r.left) / 2 + tolerance
      const ry = (r.bottom - r.top) / 2 + tolerance
      const dx = point.x - (r.left + r.right) / 2
      const dy = point.y - (r.top + r.bottom) / 2
      return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1
    }
    default:
      return point.x >= r.left - tolerance && point.x <= r.right + tolerance && point.y >= r.top - tolerance && point.y <= r.bottom + tolerance
  }
}

export function handlePositions (shape: IShape): Array<{ handle: Handle, point: Point }> {
  if (shape.Type === 'line') {
    return [
      { handle: 'start', point: { x: shape.X, y: shape.Y } },
      { handle: 'end', point: { x: shape.X + shape.Width, y: shape.Y + shape.Height } }
    ]
  }

  const r = bounds(shape)
  return [
    { handle: 'nw', point: { x: r.left, y: r.top } },
    { handle: 'ne', point: { x: r.right, y: r.top } },
    { handle: 'sw', point: { x: r.left, y: r.bottom } },
    { handle: 'se', point: { x: r.right, y: r.bottom } }
  ]
}

export function hitHandle (shape: IShape, point: Point, tolerance: number): Handle | undefined {
  return handlePositions(shape).find(h => Math.abs(h.point.x - point.x) <= tolerance && Math.abs(h.point.y - point.y) <= tolerance)?.handle
}

export function moveShape (shape: IShape, dx: number, dy: number): IShape {
  return { ...shape, X: shape.X + dx, Y: shape.Y + dy }
}

// Moves one handle to the point, and the opposite one stays. The result is not normalised, so a shape can be turned inside out while it is resized
export function resizeShape (shape: IShape, handle: Handle, point: Point): IShape {
  if (handle === 'start') {
    return { ...shape, X: point.x, Y: point.y, Width: shape.X + shape.Width - point.x, Height: shape.Y + shape.Height - point.y }
  }

  if (handle === 'end') {
    return { ...shape, Width: point.x - shape.X, Height: point.y - shape.Y }
  }

  const r = bounds(shape)
  const left = handle === 'nw' || handle === 'sw' ? point.x : r.left
  const right = handle === 'ne' || handle === 'se' ? point.x : r.right
  const top = handle === 'nw' || handle === 'ne' ? point.y : r.top
  const bottom = handle === 'sw' || handle === 'se' ? point.y : r.bottom
  return { ...shape, X: left, Y: top, Width: right - left, Height: bottom - top }
}

export function intersectsRect (shape: IShape, rect: Rect): boolean {
  const r = bounds(shape)
  return r.left <= rect.right && r.right >= rect.left && r.top <= rect.bottom && r.bottom >= rect.top
}

// A rectangle that holds all the shapes, to place a copy of them
export function boundsOf (shapes: IShape[]): Rect | undefined {
  if (shapes.length === 0) {
    return undefined
  }

  const all = shapes.map(bounds)
  return {
    left: Math.min(...all.map(r => r.left)),
    top: Math.min(...all.map(r => r.top)),
    right: Math.max(...all.map(r => r.right)),
    bottom: Math.max(...all.map(r => r.bottom))
  }
}
