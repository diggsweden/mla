// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from 'react'
import type { Network } from 'vis-network'
import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'
import { bounds } from './shape-geometry'
import { DEFAULT_FONT_COLOR, DEFAULT_FONT_SIZE, textFont, textHeight } from './shape-render'

interface Props {
  network: Network | undefined
}

// A text box over the shape, where the text of the shape is written. It is kept when the focus leaves it or with Ctrl+Enter, and Escape leaves the text as it was
function ShapeTextEditor (props: Props) {
  const editingShapeId = useAppStore((state) => state.editingShapeId)
  const setEditingShapeId = useAppStore((state) => state.setEditingShapeId)
  const shape = useMainStore((state) => state.shapes.find(s => s.Id === editingShapeId))
  const updateShapes = useMainStore((state) => state.updateShapes)
  const removeShapes = useMainStore((state) => state.removeShapes)
  const input = useRef<HTMLTextAreaElement>(null)
  const done = useRef(false)

  useEffect(() => {
    done.current = false
    input.current?.focus()
    input.current?.select()
  }, [editingShapeId])

  if (props.network == null || shape == null) {
    return null
  }

  const scale = props.network.getScale()
  const r = bounds(shape)
  const topLeft = props.network.canvasToDOM({ x: r.left, y: r.top })
  const fontSize = shape.FontSize ?? DEFAULT_FONT_SIZE

  function finish (save: boolean) {
    if (done.current || input.current == null || shape == null) {
      return
    }

    done.current = true
    const text = input.current.value
    setEditingShapeId(undefined)
    if (!save || text === shape.Text) {
      return
    }

    // A text that is emptied is taken away
    if (text.trim() === '') {
      removeShapes(shape)
    } else {
      const changed = { ...shape, Text: text }
      updateShapes({ ...changed, Height: Math.max(shape.Height, textHeight(changed)) })
    }
  }

  function grow (element: HTMLTextAreaElement) {
    element.style.height = 'auto'
    element.style.height = Math.max(element.scrollHeight, (r.bottom - r.top) * scale) + 'px'
  }

  return (
    <textarea
      ref={input}
      defaultValue={shape.Text}
      aria-label={shape.Text}
      onFocus={(e) => { grow(e.currentTarget) }}
      onInput={(e) => { grow(e.currentTarget) }}
      onBlur={() => { finish(true) }}
      onKeyDown={(e) => {
        // The shortcuts of the chart are not for the text
        e.stopPropagation()
        if (e.key === 'Escape') {
          finish(false)
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          finish(true)
        }
      }}
      data-shape-editor
      className="m:absolute m:z-20 m:border m:border-dashed m:border-blue-500 m:outline-hidden m:resize-none m:overflow-hidden"
      style={{
        left: topLeft.x,
        top: topLeft.y,
        width: (r.right - r.left) * scale,
        height: (r.bottom - r.top) * scale,
        font: textFont(fontSize * scale),
        lineHeight: 1.25,
        padding: 4 * scale,
        boxSizing: 'border-box',
        color: shape.FontColor ?? DEFAULT_FONT_COLOR,
        background: shape.FillColor ?? 'transparent'
      }}
    />
  )
}

export default ShapeTextEditor
