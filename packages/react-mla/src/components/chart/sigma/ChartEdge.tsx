// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2
import useMainStore from '../../../store/main-store'
import { useEffect, useMemo, useRef } from 'react'
import useAppStore from '../../../store/app-store'
import type { ILink } from '../../../interfaces/data-models'
import viewService from '../../../services/viewService'
import { getId, isSelected } from '../../../utils/utils'
import Graph from 'graphology'

interface Props {
  link: ILink
  graph: Graph
}

function ChartEdge(props: Props) {
  const link = props.link

  const getEntity = useMainStore(state => state.getCurrentEntity)
  const date = useMainStore(state => state.currentDate)
  const selectedIds = useMainStore(state => state.selectedIds)
  const selectedView = useAppStore(state => state.thingViewConfiguration[link.TypeId])

  const from = useMemo(() => getEntity(link.FromEntityId + link.FromEntityTypeId, date.DateFrom)!, [getEntity, link, date])
  const to = useMemo(() => getEntity(link.ToEntityId + link.ToEntityTypeId, date.DateFrom)!, [getEntity, link, date])

  const view = useMemo(() => {
    return { ...viewService.getDefaultView(link.TypeId, link.GlobalType), ...selectedView }
  }, [link, selectedView])

  const selected = useMemo(() => {
    if (link != null && from != null && to != null) {
      return isSelected(link, selectedIds) || ((view.Show ?? true) && isSelected(from, selectedIds)) || ((view.Show ?? true) && isSelected(to, selectedIds))
    }

    return false
  }, [from, link, selectedIds, to, view.Show])

  
  const created = useRef(null as null | string)
  useEffect(() => {
    console.debug('[adding]', getId(link))
    created.current = props.graph.addEdgeWithKey(getId(link), getId(from), getId(to), {
      size: 2,
      label: link.LabelChart,
      drawLabel: true
    });

    return () => {
      if (created.current && props.graph.hasEdge(created.current)) {
        console.debug('[removing]', getId(link))
        props.graph.dropEdge(getId(link))
        created.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (created.current) {
      props.graph.setEdgeAttribute(created.current, "label", link.LabelChart)
    }
  }, [from, link, props.graph, to])

  useEffect(() => {
    if (created.current) {
      props.graph.setEdgeAttribute(created.current, "highlighted", selected)
    }
  }, [from, link, props.graph, selected, to])

  return null
}

export default ChartEdge
