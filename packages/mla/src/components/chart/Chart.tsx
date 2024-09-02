// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import {  useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { Network, type Options } from 'vis-network'
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

  function select (startX: number, endX: number, startY: number, endY: number, ctxMenu: boolean) {
    if (network && data) {
      let selection = [] as string[]
      if (ctxMenu) {
        selection = selectedIds
      }

      const toSelect = data.nodes.get().reduce(
        (selected: any, { id }) => {
          const { x, y } = network.getPositions(id)[id]
          return (startX <= x && x <= endX && startY <= y && y <= endY)
            ? selected.concat(id)
            : selected
        }, []
      ) as string[]

      const isSubSet = isSubSetOf(toSelect, selection)
      if (selectedIds.length === 0 || !(ctxMenu && isSubSet)) {
        network.selectNodes(toSelect)
        const { nodes, edges } = network.getSelection() as { nodes: string[], edges: string[] }
        setSelectedIds([...nodes, ...edges])
      }
    }
  }

  useEffect(() => {
    if (network) {
      try {
        if (areArraysEqualSets(selectedIds, [...network.getSelectedNodes(), ...network.getSelectedEdges()])) {
          return
        }

        network.setSelection({
          nodes: data.nodes.get().reduce(
            (selected: any, { id }) => {
              return (selectedIds.includes(id as string))
                ? selected.concat(id)
                : selected
            }, []
          ),
          edges: data.edges.get().reduce(
            (selected: any, { id }) => {
              return (selectedIds.includes(id as string))
                ? selected.concat(id)
                : selected
            }, []
          )
        })
      } catch (error) {
        console.error(error)
      }
    }
  }, [network, data, selectedIds])

  const edgelayout = useRef({} as any)
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
            if (e.id != null && edgelayout.current[e.id]) {
              data.edges.getDataSet().updateOnly({ id: e.id, smooth: edgelayout.current[e.id] })
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

    const n = new Network(networkNode.current, data, {})
    document.body.addEventListener('contextMenuClick', (e: any) => {
      if (networkNode.current) {
        const bounds = networkNode.current.getBoundingClientRect()
        const event = new CustomEvent('mouseup', {
          detail: {
            x: e.detail.x - bounds.x,
            y: e.detail.y - bounds.y,
            button: e.detail.button,
            type: 'customclick'
          }
        })
        networkNode.current.dispatchEvent(event)
      }
    })
    setNetwork(n)
  }, [data, networkNode, setNetwork])

  const dragging = useRef(false)
  useLayoutEffect(() => {
    if (network) {
      network.on('select', (event: { nodes: string[], edges: string[] }) => {
        const { nodes, edges } = event
        setSelectedIds([...nodes, ...edges])
      })
      network.on('dragStart', function (params: ClickEvent) {
        dragging.current = true
        for (let i = 0; i < params.nodes.length; i++) {
          const id = params.nodes[i]
          data.nodes.getDataSet().updateOnly(
            { id, fixed: false }
          )
        }
      })
      network.on('dragEnd', function (params: ClickEvent) {
        dragging.current = false
        const pos = network.getPositions(params.nodes)
        const positionUpdate = [] as IEntity[]
        for (let i = 0; i < params.nodes.length; i++) {
          const id = params.nodes[i]
          const { x, y } = pos[id]
          data.nodes.getDataSet().updateOnly(
            { id, fixed: true, x, y }
          )

          getHistory(id)?.filter(e => e.PosX !== x || e.PosY !== y).forEach(e => {
            positionUpdate.push(produce(e, draft => {
              draft.PosX = x
              draft.PosY = y
            }))
          })
        }
        update(...positionUpdate)
      })
    }
  }, [network, data, setSelectedIds, update, getHistory])

  const dropRef = useDrop(
    () => ({
      accept: ['entity', 'result'],
      drop: (item, monitor) => {
        const clientPosition = monitor.getClientOffset()
        if (clientPosition == null || networkNode.current == null) {
          return
        }
        const offset = networkNode.current.getBoundingClientRect()
        const dropPosition = network?.DOMtoCanvas({ x: clientPosition.x - offset.x, y: clientPosition.y - offset.y })
        return dropPosition
      }
    }),
    [network]
  )

  useMultiselect(networkNode.current, network, select)

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
      <div className="m-h-full m-w-full m-absolute m-pointer-events-none m-z-10">
        {props.children}
      </div>
      <div className="m-h-full m-w-full" ref={dropRef[1]} >
        <div className="m-h-full m-w-full m-outline-none" id="m-chart" ref={networkNode}>
          <ContentRenderer />
        </div>
      </div>
    </div>
  )
}

export default Chart
