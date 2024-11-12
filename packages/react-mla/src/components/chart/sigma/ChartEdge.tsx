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

  const from = useMemo(() => link != null ? getEntity(link?.FromEntityId + link?.FromEntityTypeId, date.DateFrom) : null, [getEntity, link, date])
  const to = useMemo(() => link != null ? getEntity(link?.ToEntityId + link?.ToEntityTypeId, date.DateFrom) : null, [getEntity, link, date])

  const view = useMemo(() => {
    return { ...viewService.getDefaultView(link.TypeId, link.GlobalType), ...selectedView }
  }, [link, selectedView])

  const selected = useMemo(() => {
    if (link != null && from != null && to != null) {
      return isSelected(link, selectedIds) || ((view.Show ?? true) && isSelected(from, selectedIds)) || ((view.Show ?? true) && isSelected(to, selectedIds))
    }

    return false
  }, [from, link, selectedIds, to, view.Show])

  // const count = useMemo(() => {
  //   if (link == null) {
  //     return 0
  //   }

  //   const count = getLinkCount(link, allLinks)
  //   return count
  // }, [allLinks, link])

  const edge = useMemo(() => {
    return {
      size: 2,
      highlighted: selected,
      drawLabel: true
    }
  }, [selected])

  const created = useRef(false)
  useEffect(() => {
    if (edge == null) {
      return
    }

    if (created.current) {
      console.debug('[updating]', getId(link))
      props.graph.updateEdgeWithKey(getId(link), link.FromEntityId + link.FromEntityTypeId, link.ToEntityId + link.ToEntityTypeId, () => edge);

    } else {
      console.debug('[adding]', getId(link))
      try {
        const from = link.FromEntityId + link.FromEntityTypeId;
        const to = link.ToEntityId + link.ToEntityTypeId
        if (props.graph.hasNode(from) && props.graph.hasNode(to)) {
          props.graph.addEdgeWithKey(getId(link), link.FromEntityId + link.FromEntityTypeId, link.ToEntityId + link.ToEntityTypeId, edge);
          created.current = true
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [edge, link, props.graph])

  useEffect(() => {
    return () => {
      if (created.current) {
        console.debug('[removing]', getId(link))
        props.graph.dropEdge(getId(link))
        created.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <></>
}

export default ChartEdge
