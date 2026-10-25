// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { DragEvent } from 'react'
import type { ShapeType } from '../../../interfaces/data-models/shape'

// A shape is dragged from the ribbon to the chart, and the chart creates it where it is dropped
const SHAPE_DRAG_TYPE = 'application/x-mla-shape'

export function startShapeDrag (event: DragEvent, type: ShapeType) {
  event.dataTransfer.setData(SHAPE_DRAG_TYPE, type)
  event.dataTransfer.effectAllowed = 'copy'
}

export function isShapeDrag (event: DragEvent) {
  return event.dataTransfer.types.includes(SHAPE_DRAG_TYPE)
}

export function draggedShapeType (event: DragEvent): ShapeType | undefined {
  return (event.dataTransfer.getData(SHAPE_DRAG_TYPE) || undefined) as ShapeType | undefined
}
