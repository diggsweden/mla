// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { Network } from 'vis-network'

interface Point { x: number, y: number }
interface ArrowData { core: Point }
interface EdgeValues { hidden?: boolean, arrowStrikethrough?: boolean, fromArrow?: boolean, toArrow?: boolean }
interface EdgeType {
  from: Point
  to: Point
  fromPoint: Point
  toPoint: Point
  getViaNode: () => unknown
  getArrowData: (ctx: CanvasRenderingContext2D, position: 'from' | 'to', viaNode: unknown, selected: boolean, hover: boolean, values: EdgeValues) => ArrowData
}
interface Edge {
  connected: boolean
  selected: boolean
  hover: boolean
  edgeType?: EdgeType
  getFormattingValues: () => EdgeValues
}
interface Body {
  edges?: Record<string, Edge | undefined>
  emitter?: { on: (event: string, callback: (ctx: CanvasRenderingContext2D) => void) => void }
}

// With arrowStrikethrough off, vis-network ends a line where its arrow starts, but finds that point only when it draws the arrows,
// which is after the lines. A line is so drawn to where the arrow was in the frame before, or to the middle of the entity when the edge is new
// or was just changed, as when it is selected and grows wider. When only one frame is drawn, the line then sticks out in front of the arrow.
// The ends of the lines are found before the lines are drawn, the same way vis-network finds them
export function alignArrowEnds (network: Network) {
  const body = (network as unknown as { body?: Body }).body
  body?.emitter?.on('beforeDrawing', (ctx) => {
    for (const edge of Object.values(body.edges ?? {})) {
      const type = edge?.edgeType
      if (edge == null || type == null || !edge.connected) {
        continue
      }
      const values = edge.getFormattingValues()
      if (values.hidden === true || values.arrowStrikethrough !== false) {
        continue
      }
      // A curve is found from the ends of the line, so both ends are first set back to the entities, as vis-network does
      type.fromPoint = type.from
      type.toPoint = type.to
      const viaNode = type.getViaNode()
      const from = values.fromArrow === true ? type.getArrowData(ctx, 'from', viaNode, edge.selected, edge.hover, values).core : type.from
      const to = values.toArrow === true ? type.getArrowData(ctx, 'to', viaNode, edge.selected, edge.hover, values).core : type.to
      type.fromPoint = from
      type.toPoint = to
    }
  })
}
