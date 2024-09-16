// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type DataInterfaceNodes } from 'vis-network'
import useMainStore from '../../../store/main-store'
import viewService, { type IIcon } from '../../../services/viewService'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isActive, isSelected, mapToNode } from '../../../utils/vis-data-utils'
import useAppStore from '../../../store/app-store'
import type { IEntity } from '../../../interfaces/data-models'

interface Props {
  entity: IEntity
  data: DataInterfaceNodes
}

function ChartNode (props: Props) {
  const entity = props.entity

  const date = useMainStore(state => state.currentDate)
  const selectedIds = useMainStore(state => state.selectedIds)
  const historyMode = useAppStore(state => state.historyMode)
  const viewConfig = useAppStore(state => state.currentViewConfiguration)
  const selectedView = useAppStore(state => state.thingViewConfiguration[entity.TypeId])
  const [icon, setIcon] = useState(undefined as IIcon | undefined)

  const selected = useMemo(() => {
    return entity != null ? isSelected(entity, selectedIds) : false
  }, [entity, selectedIds])

  const active = useMemo(() => {
    return entity != null ? selected || isActive(entity, date) : false
  }, [entity, date, selected])

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

  const view = useMemo(() => {
    return { ...viewService.getDefaultView(entity.TypeId, entity.GlobalType), ...selectedView }
  }, [entity.TypeId, selectedView])

  const node = useMemo(() => {
    if (entity == null) {
      return null
    }

    return mapToNode(entity, icon, selected, active, historyMode, viewConfig, view)
  }, [entity, historyMode, icon, selected, active, viewConfig, view])

  const created = useRef(false)
  useEffect(() => {
    if (node == null || entity == null) {
      return
    }

    const dataset = props.data.getDataSet()
    if (created.current) {
      console.debug('[updating]', node.id)
      dataset.updateOnly(node as any)
    } else {
      console.debug('[adding]', node.id)
      dataset.update(node)
      created.current = true
    }
  }, [entity, icon, node, props.data])

  useEffect(() => {
    return () => {
      if (node != null) {
        console.debug('[removing]', node.id)
        props.data.getDataSet().remove(node.id!)
        created.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <></>
}

export default ChartNode
