// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import ChartEntity from './ChartNode'
import ChartEdge from './ChartEdge'
import useMainStore from '../../../store/main-store'

function ContentRenderer () {
  const date = useMainStore(state => state.currentDate)

  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)
  const graph = useMainStore((state) => state.graph)

  const getEntity = useMainStore(state => state.getCurrentEntity)
  const getLink = useMainStore(state => state.getCurrentLink)

  if (graph == undefined) {
    return;
  }

  return (<>
    {Object.keys(entities).map(s =>
      <ChartEntity key={s} entity={getEntity(s, date.DateFrom)!} graph={graph}></ChartEntity>
    )}
    {Object.keys(links).map(s =>
      <ChartEdge key={s} link={getLink(s, date.DateFrom)!} graph={graph}></ChartEdge>
    )}
  </>
  )
}

export default ContentRenderer
