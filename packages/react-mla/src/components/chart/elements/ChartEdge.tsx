// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type DataInterfaceEdges } from 'vis-network'
import useMainStore from '../../../store/main-store'
import { useEffect, useMemo, useRef } from 'react'
import { getLinkCount, isActive, isSelected, mapToEdge } from '../../../utils/vis-data-utils'
import useAppStore from '../../../store/app-store'
import type { ILink } from '../../../interfaces/data-models'
import viewService from '../../../services/viewService'

interface Props {
  link: ILink
  data: DataInterfaceEdges
}

function ChartEdge (props: Props) {
  const link = props.link

  const getEntity = useMainStore(state => state.getCurrentEntity)
  const links = useMainStore(state => state.links)
  const computedLinks = useMainStore(state => state.computedLinks)
  const date = useMainStore(state => state.currentDate)
  const selectedIds = useMainStore(state => state.selectedIds)
  const historyMode = useAppStore(state => state.historyMode)
  const selectedView = useAppStore(state => state.thingViewConfiguration[link.TypeId])

  const from = useMemo(() => link != null ? getEntity(link?.FromEntityId + link?.FromEntityTypeId, date.DateFrom) : null, [getEntity, link, date])
  const to = useMemo(() => link != null ? getEntity(link?.ToEntityId + link?.ToEntityTypeId, date.DateFrom) : null, [getEntity, link, date])

  const view = useMemo(() => {
    return { ...viewService.getDefaultView(link.TypeId, link.GlobalType), ...selectedView }
  }, [link.TypeId, selectedView])

  const selected = useMemo(() => {
    if (link != null && from != null && to != null) {
      return isSelected(link, selectedIds) || ((view.Show ?? true) && isSelected(from, selectedIds)) || ((view.Show ?? true) && isSelected(to, selectedIds))
    }

    return false
  }, [from, link, selectedIds, to, view.Show])

  const allLinks = useMemo(() => {
    return [...Object.values(links).map(l => l[0]), ...computedLinks]
  }, [links, computedLinks])

  const active = useMemo(() => {
    if (link != null && from != null && to != null) {
      return selected || (isActive(link, date) && isActive(from, date) && isActive(to, date))
    }

    return false
  }, [link, date, selected, from, to])

  const count = useMemo(() => {
    if (link == null) {
      return 0
    }

    const count = getLinkCount(link, allLinks)
    return count
  }, [allLinks, link])

  const edge = useMemo(() => {
    return (link) ? mapToEdge(link, selected, active, historyMode, count, view) : null
  }, [link, selected, active, historyMode, count, view])

  const created = useRef(false)
  useEffect(() => {
    if (edge == null) {
      return
    }

    const dataset = props.data.getDataSet()
    if (created.current) {
      console.debug('[updating]', edge.id)
      dataset.updateOnly(edge as any)
    } else {
      console.debug('[adding]', edge.id)
      dataset.update(edge)
      created.current = true
    }
  }, [edge, props.data])

  useEffect(() => {
    return () => {
      if (edge != null) {
        console.debug('[removing]', edge.id)
        props.data.getDataSet().remove(edge.id!)
        created.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <></>
}

export default ChartEdge
