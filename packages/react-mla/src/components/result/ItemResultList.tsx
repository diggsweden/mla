// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type IQueryResponse } from '../../services/queryService'
import type { IEntity, IEvent, ILink } from '../../interfaces/data-models'
import ItemResult from './ItemResult'
import type { IEntityGroup } from './ItemResult'
import { useEffect, useState } from 'react'
import { generateUUID, getId, isLinked } from '../../utils/utils'
import useAppStore from '../../store/app-store'
import { produce } from 'immer'
import useMainStore from '../../store/main-store'
import configService from '../../services/configurationService'
import Icon from '../common/Icon'
import Modal from '../common/Modal'
import TableTool from '../tools/TableTool'
import { toDateString } from '../../utils/date'
import { internalAdd } from '../../store/internal-actions'
import Button from '../common/Button'

interface ItemResultProps {
  result: IQueryResponse
  seeds?: IEntity[]
  className?: string
}

interface EventGroup {
  GroupId: string
  TypeId: string
  Name: string
  Events: IEvent[]
}

const last = 'zzzzzzzzzzzz'

function ItemResultList (props: ItemResultProps) {
  const network = useMainStore(state => state.network)

  const setTool = useAppStore((state) => state.setTool)
  const setEvents = useMainStore((state) => state.setEvent)
  const { result, seeds } = props
  const [mainEntities, setMainEntities] = useState<Record<string, IEntityGroup[]>>({})
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([])
  const [showEvents, setShowEvents] = useState<IEvent[]>([])

  function add (entities: IEntity[], links: ILink[]) {
    internalAdd(true, entities, links, true)

    if (network != null) {
      window.setTimeout(() => {
        network.fit({ nodes: entities.map(e => getId(e)) })
      }, 150)
    }
  }

  function gatherGroup (groupToAdd: IEntityGroup, entities: IEntity[], links: ILink[]) {
    const add = (group: IEntityGroup) => {
      entities.push(group.primary)
      links.push(...group.links)
      group.entities.forEach(g => { add(g) })
    }

    add(groupToAdd)
  }

  function addAll () {
    if (Object.keys(mainEntities).length > 0) {
      const entities: IEntity[] = []
      const links: ILink[] = []

      Object.values(mainEntities).flat().forEach(g => {
        gatherGroup(g, entities, links)
      })

      add(entities, links)
    }

    if (eventGroups.length > 0) {
      setEvents(...Object.values(eventGroups).flatMap(e => e.Events))
    }

    setTool(undefined)
  }

  function addEvents (group: EventGroup) {
    setEvents(...group.Events)

    setEventGroups(eventGroups.filter(g => g.GroupId !== group.GroupId))

    autoCloseIfEmpty()
  }

  function addGroup (groupToAdd: IEntityGroup, key: string) {
    const entities: IEntity[] = []
    const links: ILink[] = []
    gatherGroup(groupToAdd, entities, links)

    const update = produce(mainEntities, draft => {
      const notAdded = mainEntities[key].filter(g => getId(g.primary) !== getId(groupToAdd.primary))
      if (notAdded.length === 0) {
        delete draft[key]
      } else {
        draft[key] = notAdded
      }
    })
    setMainEntities(update)

    add(entities, links)
    autoCloseIfEmpty()
  }

  function autoCloseIfEmpty () {
    if (Object.keys(mainEntities).length === 0 && eventGroups.length === 0) {
      setTool(undefined)
    }
  }

  function sortByLinks (a: IEntity, b: IEntity, links: ILink[]): number {
    const linkCountA = links.filter(l => isLinked(a, l)).length
    const linkCountB = links.filter(l => isLinked(b, l)).length

    return linkCountB - linkCountA
  }

  useEffect(() => {
    const res: Record<string, IEntityGroup[]> = {}

    if (result && result.Entities.length > 0) {
      let usedTotal: Record<string, boolean> = {}

      const addGroup = (groupname: string, entity: IEntity, parentEntity: IEntity | undefined, parentGroup: IEntityGroup | undefined, used: Record<string, boolean>) => {
        used[getId(entity)] = true
        if (res[groupname] === undefined) {
          res[groupname] = []
        }

        const group: IEntityGroup = { primary: entity, entities: [], links: [] }
        if (parentGroup) {
          parentGroup.entities.push(group)
        } else {
          res[groupname].push(group)
        }

        for (const link of result.Links.filter(l => isLinked(entity, l))) {
          if (parentEntity && used[getId(link)] == null && isLinked(parentEntity, link)) {
            used[getId(link)] = true
            group.links.push(link)
          }
          const linkedEntities = result.Entities.filter(e => isLinked(e, link) && getId(e) !== getId(entity))
          for (const linkedEntity of linkedEntities) {
            if (used[getId(linkedEntity)] == null) {
              used[getId(linkedEntity)] = true
              addGroup(groupname, linkedEntity, entity, group, used)
            }
          }
        }
      }

      if (seeds && seeds.length > 0) {
        for (const seed of seeds) {
          const usedSeeds: Record<string, boolean> = {}

          const same = result.Entities.find(e => getId(e) === getId(seed))
          if (same) {
            usedSeeds[getId(seed)] = true
            res[getId(seed)] = [{ primary: same, entities: [], links: [] }]
          }

          for (const link of result.Links.filter(l => isLinked(seed, l))) {
            const linkedEntities = result.Entities.filter(e => (isLinked(e, link)) && getId(e) !== getId(seed))
            for (const linkedEntity of linkedEntities) {
              addGroup(getId(seed), linkedEntity, seed, undefined, usedSeeds)
            }
          }

          usedTotal = { ...usedTotal, ...usedSeeds }
        }
      }

      for (const entity of result.Entities.sort((a, b) => sortByLinks(a, b, result.Links))) {
        if (usedTotal[getId(entity)]) {
          continue
        }

        addGroup(last, entity, undefined, undefined, usedTotal)
      }
    }

    setMainEntities(res)
  }, [result, seeds])

  useEffect(() => {
    const res = [] as EventGroup[]
    if (result.Events) {
      result.Events.sort((a, b) => a.Date.diff(b.Date).milliseconds)

      const grouped = result.Events.reduce<Record<string, IEvent[]>>(
        (result, currentValue) => {
          (result[currentValue.TypeId] = result[currentValue.TypeId] || []).push(currentValue)
          if (result[currentValue.TypeId].length >= 10000) {
            result[generateUUID()] = result[currentValue.TypeId]
            result[currentValue.TypeId] = []
          }
          return result
        }, {})

      Object.keys(grouped).forEach(t => {
        const typeId = grouped[t][0].TypeId
        const config = configService.getEventConfiguration(typeId)
        res.push({
          GroupId: t,
          TypeId: typeId,
          Name: config.Name,
          Events: grouped[t]
        })
      })
    }

    res.sort((a, b) => a.Events[0].Date.diff(b.Events[0].Date).milliseconds)
    setEventGroups(res)
  }, [result])

  return <div className={props.className}>
    {result.ErrorMessage && <div className="m-bg-red-100 m-border m-border-red-400 m-text-red-700 m-px-4 m-py-3 m-rounded m-relative m-mb-3" role="alert">
      <span className="m-block m-sm:inline">{result.ErrorMessage}</span>
    </div>
    }
    {(Object.keys(mainEntities).length + eventGroups.length) > 0 &&
      <div className="m-relative">
        <p className="m-leading-normal m-font-sm m-uppercase m-text-center m-mb-2">Resultat</p>
        <Button className="m-absolute m-right-0 m-top-0" onClick={addAll}>Lägg till allt</Button>
      </div>
    }
    {Object.keys(mainEntities).length > 0 &&
      <div>
        {Object.keys(mainEntities).map(k => <div key={k}>
          {k !== last && seeds &&
            <div className="m-text-lg m-border-t m-border-gray-400 m-pt-2 m-mb-1 m-font-semibold">
              <span className=''>{seeds.find(s => getId(s) === k)!.LabelShort}</span>
            </div>
          }
          {mainEntities[k].map(e => (
            <ItemResult key={getId(e.primary)} item={e} onClick={() => { addGroup(e, k) }} />
          ))}
        </div>
        )}
      </div>
    }
    {eventGroups.map(e => (<div key={e.GroupId} className="m-w-full m-rounded m-border-solid m-border m-bg-white m-mb-1 m-p-2 m-relative">
      <span className='m-absolute m-top-4 -m-right-4 -m-translate-y-1/2' onClick={() => { addEvents(e) }}>
        <button className="m-text-white m-bg-primary m-rounded-full m-text-lg m-px-2 m-m-2 m-h-5 m-w-5 m-leading-5 m-flex m-justify-center">+</button>
      </span>
      <div onClick={() => { setShowEvents(e.Events) }}>
        <div>
          <span className="m-h-5 m-w-5 m-inline-flex" >
            <Icon name='calendar_view_day' className="m-text-primary m-relative m-mt-1"></Icon>
          </span>
          <span className=''>
            {e.Name} - {e.Events.length} händelser
          </span>
        </div>
        <div>
          {toDateString(e.Events[e.Events.length - 1].Date)} - {toDateString(e.Events[0].Date)}
        </div>
      </div>
    </div>
    ))
    }
    {(Object.keys(mainEntities).length + eventGroups.length) === 0 &&
      <p className="m-italic">Inga träffar...</p>
    }
    {showEvents.length > 0 &&
      <Modal mode='ok' wide={true} show={showEvents.length > 0} title={'Tabelldata'} onNegative={() => { setShowEvents([]) }} onPositive={() => { setShowEvents([]) }}>
        <TableTool items={showEvents} showExport={false} />
      </Modal>
    }
  </div>
}

export default ItemResultList
