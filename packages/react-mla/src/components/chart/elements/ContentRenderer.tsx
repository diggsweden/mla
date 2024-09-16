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
  const computedLinks = useMainStore((state) => state.computedLinks)
  const data = useMainStore((state) => state.data)

  const getEntity = useMainStore(state => state.getCurrentEntity)
  const getLink = useMainStore(state => state.getCurrentLink)

  return (<>
    {Object.keys(entities).map(s =>
      <ChartEntity key={s} entity={getEntity(s, date.DateFrom)!} data={data.nodes}></ChartEntity>
    )}
    {Object.keys(links).map(s =>
      <ChartEdge key={s} link={getLink(s, date.DateFrom)!} data={data.edges}></ChartEdge>
    )}
    {computedLinks.map(s =>
      <ChartEdge key={s.Id} link={s} data={data.edges}></ChartEdge>
    )}
  </>
  )
}

export default ContentRenderer
