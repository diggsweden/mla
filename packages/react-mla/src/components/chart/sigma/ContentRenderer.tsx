// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import ChartEntity from './ChartNode'
import ChartEdge from './ChartEdge'
import useMainStore from '../../../store/main-store'
import { useMemo } from 'react'
import { getId } from '../../../utils/utils'

export const DEFAULT_NODE_SIZE = 15;
export const DEFAULT_EDGE_SIZE = 3;

function ContentRenderer () {
  const date = useMainStore(state => state.currentDate)

  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)
  const graph = useMainStore((state) => state.graph)
  const computedLinks = useMainStore((state) => state.computedLinks)

  const getEntity = useMainStore(state => state.getCurrentEntity)
  const getLink = useMainStore(state => state.getCurrentLink)

  const nodes = useMemo(() => Object.keys(entities).map(k => getEntity(k, date.DateFrom)!), [entities, date.DateFrom, getEntity])
  const edges = useMemo(() => Object.keys(links).map(k => getLink(k, date.DateFrom)!), [links, date.DateFrom, getLink])

  if (graph == undefined) {
    return;
  }

  return (<>
    {nodes.map(s =>
      <ChartEntity key={getId(s)} entity={s} graph={graph} size={DEFAULT_NODE_SIZE}></ChartEntity>
    )}
    {edges.map(s =>
      <ChartEdge key={getId(s)} link={s} graph={graph} size={DEFAULT_EDGE_SIZE}></ChartEdge>
    )}
    {computedLinks.map(s =>
      <ChartEdge key={s.Id} link={s} graph={graph} size={DEFAULT_EDGE_SIZE}></ChartEdge>
    )}
  </>
  )
}

export default ContentRenderer
