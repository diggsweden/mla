// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type RefObject, useEffect, useRef } from 'react'
import { type Network } from 'vis-network'

import useAppStore from '../store/app-store'

interface CustomClickDetail {
  type?: string
  button: number
  x: number
  y: number
}

// Mouse events are also sent as custom events with the position and button in the detail
function isCustomClick (e: Event): e is CustomEvent<CustomClickDetail> {
  const detail = (e as CustomEvent).detail as unknown
  return typeof detail === 'object' && detail != null && (detail as CustomClickDetail).type === 'customclick'
}

// vis-network does not type its internals, only what is used here
interface HammerEvent {
  pointerType?: string
  center: { x: number, y: number }
}

interface NetworkInternals {
  body?: {
    eventListeners?: {
      onHold?: (event: HammerEvent) => void
      onTap?: (event: HammerEvent) => void
    }
  }
}

// Holding the mouse button down on a node must not add it to the selection (vis-network does so with the multiselect option),
// the selection rectangle is used for selecting many. A hold is treated as a click instead. Touch has no rectangle, so it keeps the long press
function clickOnMouseHold (network: Network, container: HTMLElement) {
  const listeners = (network as NetworkInternals).body?.eventListeners
  const onHold = listeners?.onHold
  const onTap = listeners?.onTap
  if (listeners == null || onHold == null || onTap == null) {
    return
  }

  listeners.onHold = (event) => {
    if (event.pointerType !== 'mouse') {
      onHold(event)
      return
    }

    // A selection that already has the node under the mouse is kept, so that it can be dragged as a group
    const bounds = container.getBoundingClientRect()
    const pointer = { x: event.center.x - bounds.x, y: event.center.y - bounds.y }
    const nodeId = network.getNodeAt(pointer)
    const edgeId = network.getEdgeAt(pointer)
    const selected = nodeId != null
      ? network.getSelectedNodes().includes(nodeId)
      : edgeId != null && network.getSelectedEdges().includes(edgeId)
    if (!selected) {
      onTap(event)
    }
  }

  return () => {
    listeners.onHold = onHold
  }
}

const LEFT_CLICK = 0
const RIGHT_CLICK = 2
// Bit mask of MouseEvent.buttons while the right button is held down
const RIGHT_BUTTONS = 2
// A drag shorter than this (in pixels) is a click
const MIN_DRAG = 4

const canvasify = (network: Network, DOMx: number, DOMy: number) => {
  const { x, y } = network.DOMtoCanvas({ x: DOMx, y: DOMy })
  return [x, y]
}

const correctRange = (start: number, end: number) => start < end ? [start, end] : [end, start]

export function useMultiselect (containerRef: RefObject<HTMLElement | null>, network: Network | undefined, selectCallback: (startX: number, endX: number, startY: number, endY: number, ctxMenu: boolean) => void) {
  const drag = useRef(false)
  const pan = useRef<{ x: number, y: number, view: { x: number, y: number }, moved: boolean } | null>(null)
  const DOMRect = useRef({ startX: 0, endX: 0, startY: 0, endY: 0 })
  const showContextMenu = useAppStore(state => state.showContextMenu)
  const setGeo = useAppStore(state => state.setSelectedGeoFeature)

  useEffect(() => {
    const container = containerRef.current
    if (container == null || network == null) {
      return
    }

    const selectFromDOMRect = () => {
      const rect = DOMRect.current
      const [sX, sY] = canvasify(network, rect.startX, rect.startY)
      const [eX, eY] = canvasify(network, rect.endX, rect.endY)
      const [startX, endX] = correctRange(sX, eX)
      const [startY, endY] = correctRange(sY, eY)

      selectCallback(startX - 5, endX + 5, startY - 5, endY + 5, false)
    }

    const selectPoint = () => {
      const rect = DOMRect.current
      const [x, y] = canvasify(network, rect.startX, rect.startY)

      // Size of icon is 40
      const [xi] = canvasify(network, 0, 0)
      const [xi2] = canvasify(network, 40, 0)
      const iSize = Math.round(Math.abs((xi2 - xi)))

      selectCallback(x - iSize, x + iSize, y - iSize, y + iSize, true)
    }

    // The right button moves the view when dragged and opens the context menu when clicked, see down and up
    const contextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const down = function (e: MouseEvent) {
      const { button, layerX, layerY } = e
      if (button === RIGHT_CLICK) {
        // The view is moved with the right button, since the left button selects
        Object.assign(DOMRect.current, {
          startX: layerX,
          startY: layerY,
          endX: layerX,
          endY: layerY
        })
        pan.current = { x: e.clientX, y: e.clientY, view: network.getViewPosition(), moved: false }
      } else if (button === LEFT_CLICK && network.getNodeAt({ x: layerX, y: layerY }) == null && network.getEdgeAt({ x: layerX, y: layerY }) == null) {
        // When mousedown on empty space, save the initial rectangle state. Nodes and edges are left to vis-network
        Object.assign(DOMRect.current, {
          startX: layerX,
          startY: layerY,
          endX: layerX,
          endY: layerY
        })
        drag.current = true
      }
    }

    const move = function (e: MouseEvent) {
      const { buttons, layerX, layerY } = e
      if (pan.current != null) {
        if ((buttons & RIGHT_BUTTONS) === 0) {
          pan.current = null
        } else {
          const dx = e.clientX - pan.current.x
          const dy = e.clientY - pan.current.y
          // A click is not a drag, so the view is moved first when the pointer has moved a bit
          pan.current.moved ||= Math.abs(dx) >= MIN_DRAG || Math.abs(dy) >= MIN_DRAG
          if (pan.current.moved) {
            const scale = network.getScale()
            network.moveTo({
              position: {
                x: pan.current.view.x - dx / scale,
                y: pan.current.view.y - dy / scale
              },
              animation: false
            })
          }
        }
        return
      }

      if (buttons === 0 && drag.current) {
        // Make selection rectangle disappear when accidently mouseupped outside 'container'
        drag.current = false
        network.redraw()
      } else if (drag.current) {
        // When mousemove, update the rectangle state
        Object.assign(DOMRect.current, {
          endX: layerX,
          endY: layerY
        })
        network.redraw()
      }
    }

    const up = function (e: MouseEvent | CustomEvent<CustomClickDetail>) {
      if (isCustomClick(e)) {
        const { button, x, y } = e.detail
        Object.assign(DOMRect.current, {
          startX: x,
          startY: y,
          endX: x,
          endY: y
        })

        // Select nodes
        if (button === LEFT_CLICK) {
          selectPoint()
        }

        if (button === RIGHT_CLICK) {
          selectPoint()
          showContextMenu(x, y)
        }
      } else {
        const { button } = e
        if (button === RIGHT_CLICK && pan.current != null) {
          const moved = pan.current.moved
          pan.current = null
          if (!moved) {
            selectPoint()

            setGeo()
            showContextMenu(e.clientX, e.clientY)
          }
        } else if (button === LEFT_CLICK && drag.current) {
          // When mouseup, select the nodes in the rectangle. A click is left to vis-network, which selects or deselects
          drag.current = false
          network.redraw()
          const { startX, endX, startY, endY } = DOMRect.current
          if (Math.abs(endX - startX) >= MIN_DRAG || Math.abs(endY - startY) >= MIN_DRAG) {
            selectFromDOMRect()
          }
        }
      }
    }

    container.addEventListener('contextmenu', contextMenu)
    container.addEventListener('mousedown', down)
    container.addEventListener('mousemove', move)
    container.addEventListener('mouseup', up)

    return () => {
      container.removeEventListener('contextmenu', contextMenu)
      container.removeEventListener('mousedown', down)
      container.removeEventListener('mousemove', move)
      container.removeEventListener('mouseup', up)
    }
  }, [containerRef, network, selectCallback, setGeo, showContextMenu])

  useEffect(() => {
    const container = containerRef.current
    if (network != null && container != null) {
      return clickOnMouseHold(network, container)
    }
  }, [containerRef, network])

  useEffect(() => {
    if (network == null) {
      return
    }

    const act = (ctx: CanvasRenderingContext2D) => {
      if (drag.current) {
        const rect = DOMRect.current

        const [startX, startY] = canvasify(network, rect.startX, rect.startY)
        const [endX, endY] = canvasify(network, rect.endX, rect.endY)

        ctx.setLineDash([5])
        ctx.strokeStyle = 'rgba(78, 146, 237, 0.75)'
        ctx.strokeRect(startX, startY, endX - startX, endY - startY)
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(151, 194, 252, 0.45)'
        ctx.fillRect(startX, startY, endX - startX, endY - startY)
      }
    }
    network.on('afterDrawing', act)

    return () => {
      network.off('afterDrawing', act)
    }
  }, [network])
}

export default useMultiselect
