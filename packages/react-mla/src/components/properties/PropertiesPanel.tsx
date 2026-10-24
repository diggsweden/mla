// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import useMainStore from '../../store/main-store'
import { getId } from '../../utils/utils'
import configService from '../../services/configurationService'
import EntityProperties from './EntityProperties'
import LinkProperties from './LinkProperties'
import HistoryProperties from './HistoryProperties'
import EventListProperties from './EventListProperties'

interface Props {
  className?: string
}

function PropertiesPanel (props: Props) {
  const [display, setDisplay] = useState('')

  const config = configService.getConfiguration()

  const selectedIds = useMainStore((state) => state.selectedIds)

  const entity = useMainStore((state) => state.getCurrentEntity(display))
  const link = useMainStore((state) => state.getCurrentLink(display))
  const computedLink = useMainStore((state) => state.computedLinks.find(l => getId(l) === display))

  // Keep showing the same item while it is still selected, otherwise show the first selected one
  const selectedDisplay = selectedIds.length > 0 ? (selectedIds.find(f => f === display) ?? selectedIds[0]) : ''
  if (selectedDisplay !== display) {
    setDisplay(selectedDisplay)
  }

  let title = 'Properties'
  let source = ''
  if (entity) {
    title = configService.getEntityConfiguration(entity.TypeId)?.Name ?? ''
    source = entity.SourceSystemId
  }

  if (link) {
    title = configService.getLinkConfiguration(link.TypeId)?.Name ?? ''
    source = link.SourceSystemId
  }

  if (computedLink) {
    title = configService.getEventConfiguration(computedLink.EventTypeId)?.Name ?? ''
    source = ''
  }

  function next () {
    const idx = selectedIds.findIndex(f => f === display)
    const set = selectedIds[(idx + 1) % selectedIds.length]
    setDisplay(set)
  }

  function previous () {
    const idx = selectedIds.findIndex(f => f === display)
    let setIdx: number
    if (idx === 0) {
      setIdx = selectedIds.length - 1
    } else {
      setIdx = idx - 1
    }

    const set = selectedIds[setIdx]
    setDisplay(set)
  }

  return (
    <aside className={'m-flex m-flex-col m-ease-in-out m-duration-300 m-bg-gray-100 m-overflow-none ' + (display !== '' ? 'm-translate-x-0 ' : 'm-translate-x-full ') + props.className}>
      <div className="m-flex m-justify-items-stretch m-w-full m-bg-secondary m-text-white m-h-7 m-select-none">
        <div className={'m-px-3 m-text-xl m-cursor-pointer hover:m-font-extrabold' + (selectedIds.length > 1 ? '' : ' m-hidden')} onClick={previous}>&lt;</div>
        <div className="m-mt-1 m-grow m-text-center" title={entity?.Id ?? link?.Id ?? ''}>{title}</div>
        <div className={'m-px-3 m-text-xl m-cursor-pointer hover:m-font-extrabold' + (selectedIds.length > 1 ? '' : ' m-hidden')} onClick={next}>&gt;</div>
      </div>
      <div className="m-grow m-overflow-y-auto">
        {computedLink && <EventListProperties eventLink={computedLink} />}
        {entity && <EntityProperties key={entity.InternalId} entity={entity} />}
        {link && <LinkProperties key={link.InternalId} link={link} />}
        {(entity ?? link) && config.TimeAnalysis &&
          <HistoryProperties
            className="m-w-full"
            entityId={entity ? getId(entity) : undefined}
            linkId={link ? getId(link) : undefined} />
        }
      </div>
      <div className="m-my-1 m-mx-3 m-text-sm m-self-end">
        <span>{source}</span>
      </div>
    </aside>
  )
}

export default PropertiesPanel
