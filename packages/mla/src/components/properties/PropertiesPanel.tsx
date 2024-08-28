// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useLayoutEffect, useState } from 'react'
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

  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')

  useEffect(() => {
    let value = ''
    if (selectedIds.length > 0) {
      const set = selectedIds.find(f => f === display) ?? selectedIds[0]
      value = set
    }

    if (value !== display) {
      setDisplay(value)
    }
  }, [display, selectedIds])

  useLayoutEffect(() => {
    let name = 'Properties'
    if (entity) {
      name = configService.getEntityConfiguration(entity.TypeId).Name
      setSource(entity.SourceSystemId)
    }

    if (link) {
      name = configService.getLinkConfiguration(link.TypeId).Name
      setSource(link.SourceSystemId)
    }

    if (computedLink) {
      name = configService.getEventConfiguration(computedLink.EventTypeId).Name
      setSource('')
    }

    setTitle(name)
  }, [computedLink, display, entity, link])

  function next () {
    const idx = selectedIds.findIndex(f => f === display)
    const set = selectedIds[(idx + 1) % selectedIds.length]
    setDisplay(set)
  }

  function previous () {
    const idx = selectedIds.findIndex(f => f === display)
    let setIdx = 0
    if (idx === 0) {
      setIdx = selectedIds.length - 1
    } else {
      setIdx = idx - 1
    }

    const set = selectedIds[setIdx]
    setDisplay(set)
  }

  return (
    <aside className={'flex flex-col ease-in-out duration-300 bg-gray-100 overflow-none ' + (display !== '' ? 'translate-x-0 ' : 'translate-x-full ') + props.className}>
      <div className="flex justify-items-stretch w-full bg-secondary text-white h-7 select-none">
        <div className={'px-3 text-xl cursor-pointer hover:font-extrabold' + (selectedIds.length > 1 ? '' : ' hidden')} onClick={previous}>&lt;</div>
        <div className='mt-1 grow text-center'>{title}</div>
        <div className={'px-3 text-xl cursor-pointer hover:font-extrabold' + (selectedIds.length > 1 ? '' : ' hidden')} onClick={next}>&gt;</div>
      </div>
      <div className="grow overflow-y-auto">
        {computedLink && <EventListProperties eventLink={computedLink} />}
        {entity && <EntityProperties key={entity.InternalId} entity={entity} />}
        {link && <LinkProperties key={link.InternalId} link={link} />}
        {(entity ?? link) && config.TimeAnalysis &&
          <HistoryProperties
            className="w-full"
            entityId={entity ? getId(entity) : undefined}
            linkId={link ? getId(link) : undefined} />
        }
      </div>
      <div className="my-1 mx-3 text-sm self-end">
        <span>{source}</span>
      </div>
    </aside>
  )
}

export default PropertiesPanel
