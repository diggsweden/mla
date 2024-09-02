// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useRef } from 'react'
import { type Network } from 'vis-network'

import useAppStore from '../store/app-store'

const LEFT_CLICK = 0
const RIGHT_CLICK = 2

const canvasify = (network: Network, DOMx: number, DOMy: number) => {
  const { x, y } = network.DOMtoCanvas({ x: DOMx, y: DOMy })
  return [x, y]
}

const correctRange = (start: number, end: number) => start < end ? [start, end] : [end, start]
const CONTEXT_TIMEOUT = 250

export function useMultiselect (container: HTMLElement | null, network: Network | undefined, selectCallback: (startX: number, endX: number, startY: number, endY: number, ctxMenu: boolean) => void) {
  const drag = useRef(false)
  const time = useRef(0)
  const DOMRect = useRef({ startX: 0, endX: 0, startY: 0, endY: 0 })
  const showContextMenu = useAppStore(state => state.showContextMenu)
  const setGeo = useAppStore(state => state.setSelectedGeoFeature)

  useEffect(() => {
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

    container.oncontextmenu = (e) => {
      e.preventDefault()
      const diff = Date.now() - time.current
      if (diff < CONTEXT_TIMEOUT) {
        selectPoint()

        setGeo()
        showContextMenu(e.clientX, e.clientY)
      }
    }

    const down = function (e: any) {
      const { buttons, layerX, layerY } = e
      // When mousedown, save the initial rectangle state
      if (buttons === RIGHT_CLICK) {
        time.current = Date.now()
        Object.assign(DOMRect.current, {
          startX: layerX,
          startY: layerY,
          endX: layerX,
          endY: layerY
        })
        drag.current = true
      }
    }

    const move = function (e: any) {
      const { buttons, layerX, layerY } = e
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

    const up = function (e: any) {
      if (e.detail?.type === 'customclick') {
        e = e as CustomEvent
        const { button, x, y } = e.detail
        time.current = Date.now()
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
          showContextMenu(x as number, y as number)
        }
      } else {
        e = e as MouseEvent
        const { button } = e
        // When mouseup, select the nodes in the rectangle
        if (button === RIGHT_CLICK) {
          drag.current = false
          network.redraw()
          const diff = Date.now() - time.current
          if (diff >= CONTEXT_TIMEOUT) {
            selectFromDOMRect()
          }
        }
      }
    }

    container.addEventListener('mousedown', down)
    container.addEventListener('mousemove', move)
    container.addEventListener('mouseup', up)

    return () => {
      container.removeEventListener('mousedown', down)
      container.removeEventListener('mousemove', move)
      container.removeEventListener('mouseup', up)
    }
  }, [container, network, selectCallback, setGeo, showContextMenu])

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
  }, [container, network])
}

export default useMultiselect
