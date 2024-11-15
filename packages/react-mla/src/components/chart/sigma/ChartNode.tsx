// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useMainStore from '../../../store/main-store'
import viewService, { type IIcon } from '../../../services/viewService'
import { useEffect, useMemo, useRef, useState } from 'react'
import useAppStore from '../../../store/app-store'
import type { IEntity } from '../../../interfaces/data-models'
import { getId, isSelected } from '../../../utils/utils'
import Graph from 'graphology'

interface Props {
  entity: IEntity
  graph: Graph
}

function ChartNode (props: Props) {
  const entity = props.entity

  const selectedIds = useMainStore(state => state.selectedIds)
  const viewConfig = useAppStore(state => state.currentViewConfiguration)
  const [icon, setIcon] = useState(undefined as IIcon | undefined)

  const selected = useMemo(() => {
    return entity != null ? isSelected(entity, selectedIds) : false
  }, [entity, selectedIds])

  const iconId = useRef('')
  useEffect(() => {
    const asyncUpdateIcon = async () => {
      const newIcon = await viewService.getIconByRule(entity, viewConfig)
      if (newIcon != null && newIcon?.id !== iconId.current) {
        setIcon(newIcon)
        iconId.current = newIcon.id
      }
    }
    void asyncUpdateIcon()
  }, [entity, viewConfig])

  const created = useRef(null as null | string)
  useEffect(() => {
    console.debug('[adding]', getId(entity))
    created.current = props.graph.addNode(getId(entity), { 
      label: entity.LabelChart,
      x: entity.PosX,
      y: entity.PosY,
      fixed: true, 
      color: "white",
      size: 20 
    })

    return () => {
      if (created.current && props.graph.hasNode(created.current)) {
        console.debug('[removing]', getId(entity))
        props.graph.dropNode(created.current)
        created.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "x", entity.PosX)
    }
  }, [icon, props.graph, entity.PosX])

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "y", entity.PosY)
    }
  }, [icon, props.graph, entity.PosY])

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "label", entity.LabelChart)
    }
  }, [icon, props.graph, entity.LabelChart])

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "type", icon ? "image" : undefined)
      props.graph.setNodeAttribute(created.current, "image", icon?.name)
      props.graph.setNodeAttribute(created.current, "foreColor", icon?.foreColor)
      props.graph.setNodeAttribute(created.current, "backgroundColor", icon?.backgroundColor)
      //props.graph.setNodeAttribute(created.current, "selected", selected)
    }
  }, [icon, props.graph, selected])

  return null
}

export default ChartNode
