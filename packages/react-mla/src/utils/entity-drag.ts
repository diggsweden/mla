// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { DragEvent } from 'react'

export interface IDropPosition {
  x: number
  y: number
}

type DropHandler = (position: IDropPosition | null) => void

const ENTITY_DRAG_TYPE = 'application/x-mla-entity'

// Only one drag can be active at a time, so the source of the current drag is kept here
// until the chart reports where it was dropped
let activeDrop: DropHandler | null = null

export function startEntityDrag (event: DragEvent, onDrop: DropHandler, preview?: { image: HTMLImageElement, x: number, y: number }) {
  event.dataTransfer.setData(ENTITY_DRAG_TYPE, 'entity')
  event.dataTransfer.effectAllowed = 'move'
  if (preview) {
    event.dataTransfer.setDragImage(preview.image, preview.x, preview.y)
  }
  activeDrop = onDrop
}

export function endEntityDrag () {
  activeDrop = null
}

export function isEntityDrag (event: DragEvent) {
  return event.dataTransfer.types.includes(ENTITY_DRAG_TYPE)
}

export function dropEntity (position: IDropPosition | null) {
  const handler = activeDrop
  activeDrop = null
  handler?.(position)
}
