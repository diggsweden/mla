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
    if (entity) {
      const asyncUpdateIcon = async () => {
        const newIcon = await viewService.getIconByRule(entity, viewConfig)
        if (newIcon != null && newIcon?.id !== iconId.current) {
          setIcon(newIcon)
          iconId.current = newIcon.id
        }
      }
      void asyncUpdateIcon()
    }
  }, [entity, viewConfig])

  const node = useMemo(() => {
    if (entity == null) {
      return null
    }

    return {
      label: entity.LabelChart,
      size: 20,
      x: entity.PosX,
      y: entity.PosY,
      image: icon?.unselected,
      highlighted: selected,
      fixed: true,
    }

  }, [entity, icon, selected])

  const created = useRef(false)
  useEffect(() => {
    if (node == null || entity == null) {
      return
    }

    if (created.current) {
      console.debug('[updating]', getId(entity))
      props.graph.updateNode(getId(entity), () => node)
    } else {
      console.debug('[adding]', getId(entity))
      props.graph.addNode(getId(entity), node)
      created.current = true;
    }
  }, [entity, icon, node, props.graph])

  useEffect(() => {
    return () => {
      if (created.current) {
        console.debug('[removing]', getId(entity))
        props.graph.dropNode(created.current)
        created.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <></>
}

export default ChartNode
