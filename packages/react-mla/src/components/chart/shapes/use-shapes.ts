// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type RefObject, useCallback, useEffect, useRef } from 'react'
import { type DataInterfaceEdges, type DataInterfaceNodes, type Network } from 'vis-network'
import { produce } from 'immer'
import { useTranslation } from 'react-i18next'
import type { IEntity } from '../../../interfaces/data-models'
import type { IShape, ShapeType } from '../../../interfaces/data-models/shape'
import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'
import { internalUpdate } from '../../../store/internal-actions'
import { generateUUID } from '../../../utils/utils'
import { type Handle, type Point, containsPoint, hitHandle, moveShape, normalise, resizeShape } from './shape-geometry'
import { drawSelection, drawShape, drawTextOutline, fitText, textHeight } from './shape-render'

// How far from a shape, in pixels on the screen, a click still hits it
const HIT_TOLERANCE = 6
// A drag that is shorter than this, in pixels, is a click
const MIN_DRAG = 3

const DEFAULT_SIZE: Record<ShapeType, { width: number, height: number }> = {
  text: { width: 200, height: 0 },
  rectangle: { width: 160, height: 100 },
  ellipse: { width: 160, height: 100 },
  line: { width: 160, height: 0 }
}

type Mode =
  | { kind: 'draw', shape: IShape, start: Point, startDom: Point }
  | { kind: 'move', start: Point, startDom: Point, origin: Map<string, IShape>, nodes: Map<string, Point>, moved: boolean, collapseTo?: string }
  | { kind: 'resize', handle: Handle, origin: IShape }

const RESIZE_CURSORS: Record<Handle, string> = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', start: 'move', end: 'move' }

interface ChartData {
  nodes: DataInterfaceNodes
  edges: DataInterfaceEdges
}

// Draws the shapes of the chart, and lets the user draw them, select them, move them, resize them and write in them.
// The shapes are in the coordinates of the chart, so they follow it when it is moved and zoomed
export function useShapes (containerRef: RefObject<HTMLElement | null>, network: Network | undefined, data: ChartData) {
  const { t } = useTranslation()
  const shapes = useMainStore((state) => state.shapes)
  const selectedShapeIds = useMainStore((state) => state.selectedShapeIds)
  const shapeTool = useAppStore((state) => state.shapeTool)
  const editingShapeId = useAppStore((state) => state.editingShapeId)
  const addShapes = useMainStore((state) => state.addShapes)
  const updateShapes = useMainStore((state) => state.updateShapes)
  const setSelectedShapeIds = useMainStore((state) => state.setSelectedShapeIds)
  const setShapeTool = useAppStore((state) => state.setShapeTool)
  const setEditingShapeId = useAppStore((state) => state.setEditingShapeId)

  // The handlers are set once, and read what they need from here
  const current = useRef({ shapes, selectedShapeIds, shapeTool, editingShapeId })
  useEffect(() => {
    current.current = { shapes, selectedShapeIds, shapeTool, editingShapeId }
  })

  // The shapes as they look while they are moved or resized, before the change is saved
  const live = useRef(new Map<string, IShape>())
  const drawing = useRef<IShape | undefined>(undefined)
  const mode = useRef<Mode | undefined>(undefined)
  const groupDrag = useRef<{ node: string, start: Point, origin: Map<string, IShape> } | undefined>(undefined)
  // Where a node was when it was pressed. The chart tells that it is dragged first when it has moved a little, and the shapes are to follow all of it
  const pressed = useRef<{ node: string, position: Point } | undefined>(undefined)

  const create = useCallback((type: ShapeType, at: Point): IShape => {
    const size = DEFAULT_SIZE[type]
    const shape: IShape = { Id: generateUUID(), Type: type, X: at.x, Y: at.y, Width: size.width, Height: size.height }
    if (type === 'text') {
      shape.Text = t('text')
      shape.Height = textHeight(shape)
    }

    return shape
  }, [t])

  const finishShape = useCallback((shape: IShape) => {
    addShapes(shape)
    setShapeTool(undefined)
    // A text is written at once
    if (shape.Type === 'text') {
      setEditingShapeId(shape.Id)
    }
  }, [addShapes, setShapeTool, setEditingShapeId])

  // The shape that is dropped from the ribbon is centered on the place where it is dropped
  const dropShape = useCallback((type: ShapeType, at: Point) => {
    const shape = create(type, at)
    finishShape({ ...shape, X: at.x - shape.Width / 2, Y: at.y - (type === 'line' ? 0 : shape.Height / 2) })
  }, [create, finishShape])

  // Draws the shapes below the nodes, and what shows that a shape is selected above them
  useEffect(() => {
    if (network == null) {
      return
    }

    const visible = () => current.current.shapes.map(s => live.current.get(s.Id) ?? s).filter(s => s.Id !== current.current.editingShapeId)
    const before = (ctx: CanvasRenderingContext2D) => {
      visible().forEach(s => { drawShape(ctx, s) })
      if (drawing.current?.Type === 'text') {
        // The text box is written in right after it is drawn, so it looks like the text editor while it is drawn
        drawTextOutline(ctx, drawing.current, network.getScale())
      } else if (drawing.current != null) {
        drawShape(ctx, drawing.current)
      }
    }
    const after = (ctx: CanvasRenderingContext2D) => {
      const selected = visible().filter(s => current.current.selectedShapeIds.includes(s.Id))
      // The handles are for one shape at a time
      selected.forEach(s => { drawSelection(ctx, s, network.getScale(), selected.length === 1) })
    }

    network.on('beforeDrawing', before)
    network.on('afterDrawing', after)
    return () => {
      network.off('beforeDrawing', before)
      network.off('afterDrawing', after)
    }
  }, [network])

  useEffect(() => {
    network?.redraw()
  }, [network, shapes, selectedShapeIds, editingShapeId])

  // The shapes follow the selected nodes when the nodes are dragged. The shapes are saved with the nodes, in one change
  useEffect(() => {
    if (network == null) {
      return
    }

    const onDragStart = (params: { nodes: string[] }) => {
      const selected = current.current.shapes.filter(s => current.current.selectedShapeIds.includes(s.Id))
      if (selected.length > 0 && params.nodes.length > 0) {
        const node = params.nodes[0]
        const start = pressed.current?.node === node ? pressed.current.position : network.getPosition(node)
        groupDrag.current = { node, start, origin: new Map(selected.map(s => [s.Id, s])) }
      }
    }
    const onDragging = () => {
      const drag = groupDrag.current
      if (drag != null) {
        const position = network.getPosition(drag.node)
        drag.origin.forEach((s, id) => { live.current.set(id, moveShape(s, position.x - drag.start.x, position.y - drag.start.y)) })
        network.redraw()
      }
    }
    network.on('dragStart', onDragStart)
    network.on('dragging', onDragging)
    return () => {
      network.off('dragStart', onDragStart)
      network.off('dragging', onDragging)
    }
  }, [network])

  // The shapes that followed the nodes, to be saved together with the new positions of the nodes
  const finishNodeDrag = useCallback((): IShape[] => {
    const drag = groupDrag.current
    live.current.clear()
    groupDrag.current = undefined
    if (drag == null || network == null) {
      return []
    }

    // The chart tells that a node is dragged before the node has moved, so the end is what the node is at now
    const position = network.getPosition(drag.node)
    const dx = position.x - drag.start.x
    const dy = position.y - drag.start.y
    return Math.hypot(dx, dy) < 0.01 ? [] : [...drag.origin.values()].map(s => moveShape(s, dx, dy))
  }, [network])

  useEffect(() => {
    const container = containerRef.current
    if (container == null || network == null) {
      return
    }
    // The handlers below are not in the scope of the check above
    const chart: Network = network

    const locate = (e: PointerEvent | MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const dom = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      return { dom, canvas: chart.DOMtoCanvas(dom) }
    }
    const tolerance = () => HIT_TOLERANCE / chart.getScale()
    const withLive = (s: IShape) => live.current.get(s.Id) ?? s
    const shapeAt = (p: Point) => [...current.current.shapes].reverse().find(s => containsPoint(withLive(s), p, tolerance()))
    // The nodes and the links are in front of the shapes, and the hidden ones are not there
    const itemAt = (dom: Point): { node?: string } | undefined => {
      const node = chart.getNodeAt(dom) as string | undefined
      if (node != null && data.nodes.get(node)?.hidden !== true) {
        return { node }
      }
      const edge = chart.getEdgeAt(dom)
      return edge != null && data.edges.get(edge)?.hidden !== true ? {} : undefined
    }

    const redraw = () => { chart.redraw() }
    const stop = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', cancel)
      mode.current = undefined
      drawing.current = undefined
      live.current.clear()
      redraw()
    }

    function onMove (e: PointerEvent) {
      const m = mode.current
      if (m == null) {
        return
      }

      const { dom, canvas } = locate(e)
      if (m.kind === 'draw') {
        let dx = canvas.x - m.start.x
        let dy = canvas.y - m.start.y
        if (e.shiftKey) {
          // A square or a circle, and a line in steps of 45 degrees
          if (m.shape.Type === 'line') {
            const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
            const length = Math.hypot(dx, dy)
            dx = Math.cos(angle) * length
            dy = Math.sin(angle) * length
          } else {
            const side = Math.max(Math.abs(dx), Math.abs(dy))
            dx = Math.sign(dx || 1) * side
            dy = Math.sign(dy || 1) * side
          }
        }
        m.shape = { ...m.shape, Width: dx, Height: dy }
        drawing.current = m.shape
      } else if (m.kind === 'move') {
        if (!m.moved && Math.hypot(dom.x - m.startDom.x, dom.y - m.startDom.y) < MIN_DRAG) {
          return
        }
        m.moved = true
        const dx = canvas.x - m.start.x
        const dy = canvas.y - m.start.y
        m.origin.forEach((s, id) => { live.current.set(id, moveShape(s, dx, dy)) })
        m.nodes.forEach((p, id) => { chart.moveNode(id, p.x + dx, p.y + dy) })
      } else {
        live.current.set(m.origin.Id, resizeShape(m.origin, m.handle, canvas))
      }
      redraw()
    }

    function onUp () {
      const m = mode.current
      if (m == null) {
        return
      }

      if (m.kind === 'draw') {
        const tiny = Math.abs(m.shape.Width) < MIN_DRAG / chart.getScale() && Math.abs(m.shape.Height) < MIN_DRAG / chart.getScale()
        // A click puts a shape of the usual size on the chart
        const shape = tiny ? { ...create(m.shape.Type, m.start), Id: m.shape.Id } : normalise(m.shape)
        stop()
        finishShape(fitText(shape))
        return
      }

      if (m.kind === 'move') {
        const shapeUpdates = [...live.current.values()]
        const nodes = new Map(m.nodes)
        const positions = chart.getPositions([...nodes.keys()])
        const entityUpdates = [...nodes.keys()].flatMap(id => (useMainStore.getState().getEntityHistory(id) ?? [])
          .filter(entity => entity.PosX !== positions[id].x || entity.PosY !== positions[id].y)
          .map(entity => produce(entity, (draft: IEntity) => { draft.PosX = positions[id].x; draft.PosY = positions[id].y })))
        const collapse = !m.moved ? m.collapseTo : undefined
        stop()
        if (shapeUpdates.length > 0 || entityUpdates.length > 0) {
          internalUpdate(true, entityUpdates, [], shapeUpdates)
        }
        if (collapse != null) {
          setSelectedShapeIds([collapse])
        }
        return
      }

      const resized = live.current.get(m.origin.Id)
      stop()
      if (resized != null) {
        const shape = normalise(resized)
        updateShapes(fitText(shape))
      }
    }

    function cancel () {
      stop()
    }

    const listen = (m: Mode) => {
      mode.current = m
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', cancel)
    }

    // The click is taken before the chart gets it, when it is for a shape. In other cases the chart selects, and moves the nodes
    const onPointerDown = (e: PointerEvent) => {
      const state = current.current
      if (state.editingShapeId != null) {
        return
      }

      const { dom, canvas } = locate(e)
      const toggle = e.ctrlKey || e.metaKey
      // Cancelling the click also cancels the focus, and the shortcuts of the chart need it
      const take = () => {
        e.preventDefault()
        e.stopPropagation()
        container.querySelector<HTMLElement>('.vis-network')?.focus({ preventScroll: true })
      }

      if (e.button === 2) {
        // The context menu is for the shape that is under the mouse
        const hit = itemAt(dom) ? undefined : shapeAt(canvas)
        if (hit != null && !state.selectedShapeIds.includes(hit.Id)) {
          useMainStore.getState().setSelected([])
          setSelectedShapeIds([hit.Id])
        }
        return
      }
      if (e.button !== 0) {
        return
      }

      if (state.shapeTool != null) {
        take()
        listen({ kind: 'draw', shape: { Id: generateUUID(), Type: state.shapeTool, X: canvas.x, Y: canvas.y, Width: 0, Height: 0 }, start: canvas, startDom: dom })
        return
      }

      if (state.selectedShapeIds.length === 1) {
        const selected = state.shapes.find(s => s.Id === state.selectedShapeIds[0])
        const handle = selected == null ? undefined : hitHandle(selected, canvas, tolerance())
        if (selected != null && handle != null) {
          take()
          listen({ kind: 'resize', handle, origin: selected })
          return
        }
      }

      const item = itemAt(dom)
      pressed.current = item?.node != null ? { node: item.node, position: chart.getPosition(item.node) } : undefined
      if (item != null) {
        // A selected node is pressed to move the selection, with the shapes that are selected
        const moveSelection = item.node != null && (chart.getSelectedNodes() as string[]).includes(item.node)
        if (!toggle && !moveSelection && state.selectedShapeIds.length > 0) {
          setSelectedShapeIds([])
        }
        return
      }

      const hit = shapeAt(canvas)
      if (hit == null) {
        if (!toggle && state.selectedShapeIds.length > 0) {
          setSelectedShapeIds([])
        }
        return
      }

      take()
      let selection = state.selectedShapeIds
      if (toggle) {
        selection = selection.includes(hit.Id) ? selection.filter(id => id !== hit.Id) : [...selection, hit.Id]
        setSelectedShapeIds(selection)
        if (!selection.includes(hit.Id)) {
          return
        }
      } else if (!selection.includes(hit.Id)) {
        selection = [hit.Id]
        useMainStore.getState().setSelected([])
        setSelectedShapeIds(selection)
      }

      const nodeIds = chart.getSelectedNodes() as string[]
      listen({
        kind: 'move',
        start: canvas,
        startDom: dom,
        origin: new Map(state.shapes.filter(s => selection.includes(s.Id)).map(s => [s.Id, s])),
        nodes: new Map(nodeIds.map(id => [id, chart.getPositions([id])[id]])),
        moved: false,
        // A click on a shape of a selection of several selects that shape alone
        collapseTo: !toggle && selection.length > 1 ? hit.Id : undefined
      })
    }

    const onDoubleClick = (e: MouseEvent) => {
      const { dom, canvas } = locate(e)
      const hit = itemAt(dom) ? undefined : shapeAt(canvas)
      if (hit?.Type === 'text') {
        e.preventDefault()
        e.stopPropagation()
        setSelectedShapeIds([hit.Id])
        setEditingShapeId(hit.Id)
      }
    }

    // What the mouse is over decides how it looks
    const onHover = (e: PointerEvent) => {
      if (mode.current != null) {
        return
      }

      const state = current.current
      const { dom, canvas } = locate(e)
      let cursor = ''
      if (state.shapeTool != null) {
        cursor = 'crosshair'
      } else if (state.editingShapeId == null) {
        const single = state.selectedShapeIds.length === 1 ? state.shapes.find(s => s.Id === state.selectedShapeIds[0]) : undefined
        const handle = single == null ? undefined : hitHandle(single, canvas, tolerance())
        if (handle != null) {
          cursor = RESIZE_CURSORS[handle]
        } else if (!itemAt(dom)) {
          const hit = shapeAt(canvas)
          cursor = hit != null && state.selectedShapeIds.includes(hit.Id) ? 'move' : hit != null ? 'pointer' : ''
        }
      }
      container.style.cursor = cursor
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && current.current.editingShapeId == null) {
        if (mode.current != null) {
          stop()
        }
        if (current.current.shapeTool != null) {
          setShapeTool(undefined)
        }
      }
    }

    container.addEventListener('pointerdown', onPointerDown, true)
    container.addEventListener('dblclick', onDoubleClick, true)
    container.addEventListener('pointermove', onHover)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('pointerdown', onPointerDown, true)
      container.removeEventListener('dblclick', onDoubleClick, true)
      container.removeEventListener('pointermove', onHover)
      window.removeEventListener('keydown', onKeyDown)
      container.style.cursor = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', cancel)
    }
  }, [containerRef, network, data, create, finishShape, setSelectedShapeIds, setShapeTool, setEditingShapeId, updateShapes])

  return { finishNodeDrag, dropShape }
}
