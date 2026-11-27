// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { Network } from 'vis-network'

interface LabelSize { left: number, top: number, width: number, height: number }
interface Label {
  fontOptions: { background?: string, vadjust?: number }
  getSize: () => LabelSize
  _drawBackground: (ctx: CanvasRenderingContext2D) => void
}
interface Body {
  nodes?: Record<string, { labelModule?: Label } | undefined>
  edges?: Record<string, { labelModule?: Label } | undefined>
}

const fixed = new WeakSet<object>()

// The margin of the background around the text, so that the text does not touch its edge
export const LABEL_MARGIN = { x: 4, top: 2, bottom: 4 }

// vis-network moves the text of a label by its vadjust, but draws the background of the label where the text would be without it.
// The chart moves the labels of the entities up to their icons, so the background was below the text: the top of the text stuck out
// and the background stuck out under it, which is seen over a shape with a color and most of all on a label of more than one line.
// The background is moved as much as the text, and has a small margin around it. All labels share the same class, so it is done once, when the first label is drawn
export function alignLabelBackgrounds (network: Network) {
  const fix = () => {
    const body = (network as unknown as { body?: Body }).body
    const label = Object.values(body?.nodes ?? {}).find(n => n?.labelModule != null)?.labelModule ??
      Object.values(body?.edges ?? {}).find(e => e?.labelModule != null)?.labelModule
    if (label == null) {
      return
    }
    const proto = Object.getPrototypeOf(label) as Label
    if (!fixed.has(proto) && typeof proto._drawBackground === 'function') {
      proto._drawBackground = function (this: Label, ctx: CanvasRenderingContext2D) {
        const background = this.fontOptions.background
        if (background !== undefined && background !== 'none') {
          ctx.fillStyle = background
          const size = this.getSize()
          ctx.fillRect(size.left - LABEL_MARGIN.x, size.top + (this.fontOptions.vadjust ?? 0) - LABEL_MARGIN.top, size.width + 2 * LABEL_MARGIN.x, size.height + LABEL_MARGIN.top + LABEL_MARGIN.bottom)
        }
      }
      fixed.add(proto)
    }
    network.off('beforeDrawing', fix)
  }
  network.on('beforeDrawing', fix)
}
