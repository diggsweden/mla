// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type RefObject, useEffect, useRef } from 'react'
import type { DataInterfaceEdges, DataInterfaceNodes, Network } from 'vis-network'
import useAppStore from '../../../store/app-store'
import viewService from '../../../services/viewService'

interface Point { x: number, y: number }

// The light blue behind the icons of the entities a relation is drawn between
const HIGHLIGHT = '#dbeafe'

interface ChartData {
  nodes: DataInterfaceNodes
  edges: DataInterfaceEdges
}

// While the link tool is on, a relation is drawn by pressing on an entity, dragging and letting go on another.
// The line follows the mouse and snaps to the entity it is over. Letting go elsewhere, or Escape, cancels it.
// Started from the menu of an entity, the line starts there and follows the mouse until another entity is clicked
export function useLinkDrawing (containerRef: RefObject<HTMLElement | null>, network: Network | undefined, data: ChartData) {
  const linkTool = useAppStore((state) => state.linkTool)
  const setLinkTool = useAppStore((state) => state.setLinkTool)
  const setDrawnLink = useAppStore((state) => state.setDrawnLink)
  const linkFrom = useAppStore((state) => state.linkFrom)
  const drag = useRef<{ from: string, to?: string, point: Point } | undefined>(undefined)

  // While it is dragged, the entity it starts from, and the one it would end on, get a light blue background,
  // and the line goes between the edges of those backgrounds
  useEffect(() => {
    if (network == null) {
      return
    }
    const RADIUS = 34
    const ends = () => {
      const current = drag.current
      if (current == null) return undefined
      return { start: network.getPosition(current.from), end: current.to != null ? network.getPosition(current.to) : current.point, current }
    }
    // The icons have a white background of their own, which would hide anything below them. The light blue is laid over them
    // and multiplied, so that the white turns light blue and the icon is seen as it is
    const tint = (ctx: CanvasRenderingContext2D) => {
      const e = ends()
      if (e == null) return
      ctx.save()
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillStyle = HIGHLIGHT
      for (const id of [e.current.from, e.current.to]) {
        if (id == null) continue
        const p = network.getPosition(id)
        ctx.beginPath()
        ctx.arc(p.x, p.y, RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    const after = (ctx: CanvasRenderingContext2D) => {
      tint(ctx)
      const e = ends()
      if (e == null) return
      const dx = e.end.x - e.start.x
      const dy = e.end.y - e.start.y
      const length = Math.hypot(dx, dy)
      if (length <= RADIUS) return
      const ux = dx / length
      const uy = dy / length
      // It starts at the edge of the background, and ends at the edge of the other one or at the mouse
      const stop = e.current.to != null ? RADIUS : 0
      const scale = network.getScale()
      ctx.save()
      ctx.strokeStyle = viewService.getTheme().Primary
      ctx.lineWidth = 2 / scale
      ctx.setLineDash([6 / scale, 4 / scale])
      ctx.beginPath()
      ctx.moveTo(e.start.x + ux * RADIUS, e.start.y + uy * RADIUS)
      ctx.lineTo(e.end.x - ux * stop, e.end.y - uy * stop)
      ctx.stroke()
      ctx.restore()
    }
    network.on('afterDrawing', after)
    return () => {
      network.off('afterDrawing', after)
    }
  }, [network])

  useEffect(() => {
    const container = containerRef.current
    if (container == null || network == null || !linkTool) {
      return
    }
    const chart: Network = network

    const dom = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    // The visible entity under the mouse
    const nodeAt = (p: Point) => {
      const id = chart.getNodeAt(p) as string | undefined
      return id != null && data.nodes.get(id)?.hidden !== true ? id : undefined
    }

    const stop = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', stop)
      const dragging = drag.current != null
      drag.current = undefined
      // Only a line that was drawn needs to be taken away, and the chart may be gone when the tool is
      if (dragging) {
        chart.redraw()
      }
    }
    // Started from the menu: the line is drawn from the entity until a click
    let clicked = false
    const onMove = (e: PointerEvent) => {
      if (drag.current == null) return
      const p = dom(e)
      const over = nodeAt(p)
      drag.current = { ...drag.current, point: chart.DOMtoCanvas(p), to: over !== drag.current.from ? over : undefined }
      chart.redraw()
    }
    const onUp = (e: PointerEvent) => {
      const current = drag.current
      const to = nodeAt(dom(e))
      stop()
      if (current != null && to != null && to !== current.from) {
        setDrawnLink({ from: current.from, to, drawn: true })
      }
    }

    // The press is taken before the chart gets it, so that the entity is not moved and the view is not panned
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      const p = dom(e)
      // A click ends the line that was started from the menu: on another entity it is made, elsewhere the tool is done
      if (clicked) {
        const current = drag.current
        const to = nodeAt(p)
        clicked = false
        stop()
        if (current != null && to != null && to !== current.from) {
          // The tool stays on, as for a drawn relation, but no longer starts from the entity of the menu
          useAppStore.setState({ linkFrom: undefined })
          setDrawnLink({ from: current.from, to, drawn: true })
        } else {
          setLinkTool(false)
        }
        return
      }
      const from = nodeAt(p)
      if (from == null) {
        return
      }
      drag.current = { from, point: chart.DOMtoCanvas(p) }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', stop)
      chart.redraw()
    }
    const onHover = (e: PointerEvent) => {
      if (drag.current == null) {
        container.style.cursor = nodeAt(dom(e)) != null ? 'crosshair' : 'not-allowed'
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drag.current != null && !clicked) {
          stop()
        } else {
          setLinkTool(false)
        }
      }
    }

    container.addEventListener('pointerdown', onPointerDown, true)
    container.addEventListener('pointermove', onHover)
    window.addEventListener('keydown', onKeyDown)
    if (linkFrom != null && data.nodes.get(linkFrom) != null) {
      clicked = true
      drag.current = { from: linkFrom, point: chart.getPosition(linkFrom) }
      window.addEventListener('pointermove', onMove)
      chart.redraw()
    }
    return () => {
      container.removeEventListener('pointerdown', onPointerDown, true)
      container.removeEventListener('pointermove', onHover)
      window.removeEventListener('keydown', onKeyDown)
      container.style.cursor = ''
      stop()
    }
  }, [containerRef, network, data, linkTool, linkFrom, setLinkTool, setDrawnLink])
}
