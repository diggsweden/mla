// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useMainStore from '../../../store/main-store'
import viewService from '../../../services/viewService'
import { useEffect, useMemo, useRef } from 'react'
import useAppStore from '../../../store/app-store'
import type { IEntity } from '../../../interfaces/data-models'
import { getId, isSelected } from '../../../utils/utils'
import Graph from 'graphology'

interface Props {
  entity: IEntity
  graph: Graph,
  size: number
}

function ChartNode (props: Props) {
  const entity = props.entity

  const selectedIds = useMainStore(state => state.selectedIds)
  const viewConfig = useAppStore(state => state.currentViewConfiguration)

  const selectedView = useAppStore(state => state.thingViewConfiguration[entity.TypeId])

  const view = useMemo(() => {
    return { ...viewService.getDefaultView(entity.TypeId, entity.GlobalType), ...selectedView }
  }, [entity, selectedView])

  const selected = useMemo(() => {
    return entity != null ? isSelected(entity, selectedIds) : false
  }, [entity, selectedIds])

  const icon = useMemo(() => {
    return viewService.getIconByRule(entity, viewConfig);
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
      size: props.size
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
      props.graph.setNodeAttribute(created.current, "y", entity.PosY)

      console.log("pos", entity.PosX, entity.PosY)
    }
  }, [icon, props.graph, entity.PosY, entity.PosX])

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "label", entity.LabelChart)
    }
  }, [icon, props.graph, entity.LabelChart])

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "image", icon?.name)
      props.graph.setNodeAttribute(created.current, "pictoColor", icon?.foreColor)
      props.graph.setNodeAttribute(created.current, "borderColor", selected ? "#60a5fa" : icon?.foreColor)
    }
  }, [icon, props.graph, selected])

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "color", selected ? "#dbeafe" : icon?.backgroundColor)
    }
  }, [icon?.backgroundColor, props.graph, selected])

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "hidden", !(view.Show ?? true))
    }
  }, [props.graph, view.Show])

  return null
}

export default ChartNode
