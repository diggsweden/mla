// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect } from 'react'
import type { Network } from 'vis-network'
import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'

// The light blue of the entity in focus, the same as when a relation is drawn
const HIGHLIGHT = '#dbeafe'
const RADIUS = 34

// When more than one is selected, the entity the panel of properties shows, or that the pointer is on in its list,
// gets a light blue background, so that it is seen which of the selected it is
export function useFocusHighlight (network: Network | undefined) {
  const focusedId = useAppStore((state) => state.focusedId)
  const selectedCount = useMainStore((state) => state.selectedIds.length)

  useEffect(() => {
    if (network == null || focusedId == null || selectedCount < 2) {
      return
    }
    const id = focusedId
    const after = (ctx: CanvasRenderingContext2D) => {
      const position = (network.getPositions([id]) as Record<string, { x: number, y: number } | undefined>)[id]
      if (position == null) return
      // Laid over the icon and multiplied, as the icons have a white background of their own
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = HIGHLIGHT
      ctx.beginPath()
      ctx.arc(position.x, position.y, RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    network.on('afterDrawing', after)
    network.redraw()
    return () => {
      network.off('afterDrawing', after)
      network.redraw()
    }
  }, [network, focusedId, selectedCount])
}
