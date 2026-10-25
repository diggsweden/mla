// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type DragEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { dropEntity, isEntityDrag } from '../../utils/entity-drag'
import { type Edge, Network, type Options } from 'vis-network'
import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'
import useKeyDown from '../../effects/keydown'
import { areArraysEqualSets, isSubSetOf } from '../../utils/utils'
import useMultiselect from '../../utils/vis-multiselect-hook'

import type { IEntity } from '../../interfaces/data-models'
import { produce } from 'immer'
import ContentRenderer from './elements/ContentRenderer'

interface ClickEvent {
  nodes: string[]
  edges: string[]
  event: PointerEvent
  pointer: {
    DOM: { x: number, y: number }
    canvas: { x: number, y: number }
  }
}

interface Props {
  className?: string
  children?: React.ReactNode
}

function Chart (props: Props) {
  const selectedIds = useMainStore((state) => state.selectedIds)
  const setSelectedIds = useMainStore((state) => state.setSelected)

  const data = useMainStore((state) => state.data)

  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)

  const network = useMainStore((state) => state.network)
  const setNetwork = useMainStore((state) => state.setNetwork)
  const getHistory = useMainStore((state) => state.getEntityHistory)
  const update = useMainStore((state) => state.updateEntity)
  const storePositions = useMainStore((state) => state.storePositions)

  const setLayout = useAppStore((state) => state.setLayout)
  const mapMode = useAppStore((state) => state.showMap)

  const layout = useAppStore((state) => state.layout)
  const layoutId = useAppStore((state) => state.layoutId)
  const interaction = useAppStore((state) => state.interaction)

  const options = useMemo(() => {
    const opts = {
      interaction,
      layout,
      edges: {
        arrowStrikethrough: true,
        physics: true,
        length: 100,
        font: {
          multi: 'html',
          background: 'white',
          strokeWidth: 0
        }
      },
      nodes: {
        font: {
          multi: 'html',
          background: 'white',
          strokeWidth: 0,
          vadjust: -10
        }
      },
      physics: {
        timestep: 0.6,
        stabilization: {
          enabled: true,
          iterations: 200
        },
        solver: 'barnesHut',
        barnesHut: {
          gravitationalConstant: -7000,
          springConstant: 0.02,
          springLength: 150,
          avoidOverlap: 1
        },
        forceAtlas2Based: {
          gravitationalConstant: -200,
          avoidOverlap: 1
        }
      }
    } satisfies Options
    return opts
  }, [layout, interaction])

  const select = useCallback((startX: number, endX: number, startY: number, endY: number, ctxMenu: boolean) => {
    if (network && data) {
      let selection = [] as string[]
      if (ctxMenu) {
        selection = selectedIds
      }

      const toSelect = data.nodes.get().reduce<string[]>(
        (selected, { id }) => {
          const { x, y } = network.getPositions(id)[id]
          return (startX <= x && x <= endX && startY <= y && y <= endY)
            ? selected.concat(id as string)
            : selected
        }, []
      )

      const isSubSet = isSubSetOf(toSelect, selection)
      if (selectedIds.length === 0 || !(ctxMenu && isSubSet)) {
        network.selectNodes(toSelect)
        const { nodes, edges } = network.getSelection() as { nodes: string[], edges: string[] }
        setSelectedIds([...nodes, ...edges])
      }
    }
  }, [network, data, selectedIds, setSelectedIds])

  useEffect(() => {
    if (network) {
      try {
        if (areArraysEqualSets(selectedIds, [...network.getSelectedNodes(), ...network.getSelectedEdges()])) {
          return
        }

        network.setSelection({
          nodes: data.nodes.get().reduce<string[]>(
            (selected, { id }) => {
              return (selectedIds.includes(id as string))
                ? selected.concat(id as string)
                : selected
            }, []
          ),
          edges: data.edges.get().reduce<string[]>(
            (selected, { id }) => {
              return (selectedIds.includes(id as string))
                ? selected.concat(id as string)
                : selected
            }, []
          )
        })
      } catch (error) {
        console.error(error)
      }
    }
  }, [network, data, selectedIds])

  const edgelayout = useRef<Record<string, Edge['smooth'] | null>>({})
  useEffect(() => {
    if (network) {
      try {
        if (options.layout.hierarchical !== false) {
          data.edges.forEach(e => {
            if (e.id != null) {
              edgelayout.current[e.id] = e.smooth
              data.edges.getDataSet().updateOnly({ id: e.id, smooth: false })
            }
          })
        } else {
          data.edges.forEach(e => {
            const saved = e.id != null ? edgelayout.current[e.id] : undefined
            if (e.id != null && saved) {
              data.edges.getDataSet().updateOnly({ id: e.id, smooth: saved })
              edgelayout.current[e.id] = null
            }
          })
        }

        network.setOptions(options)
      } catch (error) {
        console.error('Failed to set options', error)
      }
    }
  }, [options, data, network, setLayout])

  const stabilizing = useRef(false)
  useEffect(() => {
    if (network) {
      const dataset = data.nodes.getDataSet()
      if (layoutId === 'Dynamic') {
        data.nodes.forEach(n => {
          dataset.updateOnly({ id: n.id!, fixed: false })
        })
        stabilizing.current = true
      } else if (stabilizing.current) {
        storePositions()
        data.nodes.forEach(n => {
          dataset.updateOnly({ id: n.id!, fixed: true })
        })
      }

      if (layoutId !== 'reset') {
        network.once('stabilized', () => {
          storePositions()
          data.nodes.forEach(n => {
            dataset.updateOnly({ id: n.id!, fixed: true })
          })
          setLayout('reset')
        })
      }
    }
  }, [options, data, network, storePositions, setLayout, layoutId])

  const networkNode = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (networkNode.current == null) {
      return
    }

    const container = networkNode.current
    const n = new Network(container, data, {})
    // The context menu sends its clicks as events on the page, they are passed on to the chart
    const onContextMenuClick = (e: Event) => {
      const { detail } = e as CustomEvent<{ x: number, y: number, button: number }>
      const bounds = container.getBoundingClientRect()
      container.dispatchEvent(new CustomEvent('mouseup', {
        detail: {
          x: detail.x - bounds.x,
          y: detail.y - bounds.y,
          button: detail.button,
          type: 'customclick'
        }
      }))
    }
    document.body.addEventListener('contextMenuClick', onContextMenuClick)
    setNetwork(n)

    return () => {
      document.body.removeEventListener('contextMenuClick', onContextMenuClick)
      setNetwork(undefined)
      n.destroy()
    }
  }, [data, networkNode, setNetwork])

  useLayoutEffect(() => {
    if (network) {
      const onSelect = (event: { nodes: string[], edges: string[] }) => {
        const { nodes, edges } = event
        setSelectedIds([...nodes, ...edges])
      }
      const onDragStart = (params: ClickEvent) => {
        for (const id of params.nodes) {
          data.nodes.getDataSet().updateOnly({ id, fixed: false })
        }
      }
      const onDragEnd = (params: ClickEvent) => {
        const pos = network.getPositions(params.nodes)
        const positionUpdate = [] as IEntity[]
        for (const id of params.nodes) {
          const { x, y } = pos[id]
          data.nodes.getDataSet().updateOnly({ id, fixed: true, x, y })

          getHistory(id)?.filter(e => e.PosX !== x || e.PosY !== y).forEach(e => {
            positionUpdate.push(produce(e, draft => {
              draft.PosX = x
              draft.PosY = y
            }))
          })
        }
        update(...positionUpdate)
      }

      network.on('select', onSelect)
      network.on('dragStart', onDragStart)
      network.on('dragEnd', onDragEnd)
      return () => {
        network.off('select', onSelect)
        network.off('dragStart', onDragStart)
        network.off('dragEnd', onDragEnd)
      }
    }
  }, [network, data, setSelectedIds, update, getHistory])

  const onDragOver = useCallback((event: DragEvent) => {
    if (isEntityDrag(event)) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    }
  }, [])

  const onDrop = useCallback((event: DragEvent) => {
    if (!isEntityDrag(event)) {
      return
    }
    event.preventDefault()
    if (networkNode.current == null) {
      dropEntity(null)
      return
    }
    const offset = networkNode.current.getBoundingClientRect()
    dropEntity(network?.DOMtoCanvas({ x: event.clientX - offset.x, y: event.clientY - offset.y }) ?? null)
  }, [network])

  useMultiselect(networkNode, network, select)

  useLayoutEffect(() => {
    if (network) {
      network.redraw()
    }
  }, [network, mapMode])

  useKeyDown(() => {
    setSelectedIds([...Object.keys(entities), ...Object.keys(links)])
  }, networkNode, ['KeyA'], true)

  return (
    <div className={props.className}>
      <div className="m:h-full m:w-full m:absolute m:pointer-events-none m:z-10">
        {props.children}
      </div>
      <div className="m:h-full m:w-full" onDragOver={onDragOver} onDrop={onDrop}>
        <div className="m:h-full m:w-full m:outline-hidden" id="m-chart" ref={networkNode}>
          <ContentRenderer />
        </div>
      </div>
    </div>
  )
}

export default Chart
