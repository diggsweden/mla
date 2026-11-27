// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type IQueryResponse } from '../../services/queryService'
import type { IEntity, IEvent, ILink } from '../../interfaces/data-models'
import ItemResult from './ItemResult'
import type { IEntityGroup } from './ItemResult'
import { useState } from 'react'
import { getId, isLinked } from '../../utils/utils'
import useAppStore from '../../store/app-store'
import { produce } from 'immer'
import useMainStore from '../../store/main-store'
import Icon from '../common/Icon'
import Modal from '../common/Modal'
import TableTool from '../tools/TableTool'
import { toDateString } from '../../utils/date'
import { internalAdd } from '../../store/internal-actions'
import { NoResults, ResultError, ResultNotice, secondaryButton, sectionLabel } from '../tools/ToolParts'
import { useTranslation } from 'react-i18next'
import { type EventGroup, buildEventGroups } from './event-groups'

interface ItemResultProps {
  result: IQueryResponse
  seeds?: IEntity[]
  className?: string
  // Asks the service again, when it failed
  onRetry?: () => void
}

const last = 'zzzzzzzzzzzz'

function sortByLinks (a: IEntity, b: IEntity, links: ILink[]): number {
  const linkCountA = links.filter(l => isLinked(a, l)).length
  const linkCountB = links.filter(l => isLinked(b, l)).length

  return linkCountB - linkCountA
}

function buildEntityGroups (result: ItemResultProps['result'], seeds: IEntity[] | undefined): { groups: Record<string, IEntityGroup[]>, count: number } {
  const res: Record<string, IEntityGroup[]> = {}
  let count = 0

  if (result && result.Entities.length > 0) {
    let counter = 0;
    let usedTotal: Record<string, boolean> = {}

    const addGroup = (groupname: string, entity: IEntity, parentEntity: IEntity | undefined, parentGroup: IEntityGroup | undefined, used: Record<string, boolean>) => {
      counter++;
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

    count = counter
  }

  return { groups: res, count }
}

function ItemResultList (props: ItemResultProps) {
  const { t } = useTranslation();
  const network = useMainStore(state => state.network)

  const setTool = useAppStore((state) => state.setTool)
  const setEvents = useMainStore((state) => state.setEvent)
  const { result, seeds } = props
  // The groups are built from the result and can then be removed by the user, start over when the result (or seeds) change
  const [entityState, setEntityState] = useState(() => ({ result, seeds, ...buildEntityGroups(result, seeds) }))
  if (entityState.result !== result || entityState.seeds !== seeds) {
    setEntityState({ result, seeds, ...buildEntityGroups(result, seeds) })
  }
  const mainEntities = entityState.groups
  const count = entityState.count
  function setMainEntities (groups: Record<string, IEntityGroup[]>) {
    setEntityState(state => ({ ...state, groups }))
  }

  const [eventState, setEventState] = useState(() => ({ result, groups: buildEventGroups(result) }))
  if (eventState.result !== result) {
    setEventState({ result, groups: buildEventGroups(result) })
  }
  const eventGroups = eventState.groups
  function setEventGroups (groups: EventGroup[]) {
    setEventState(state => ({ ...state, groups }))
  }
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

  const groupKeys = Object.keys(mainEntities)
  const empty = (groupKeys.length + eventGroups.length) === 0
  // What the service found, before any of it was added: a text with it is a message, and a text without it is an error
  const found = result.Entities.length > 0 || (result.Events?.length ?? 0) > 0
  const hasSeedGroups = groupKeys.some(k => k !== last)
  // The cards that are shown, also an entity that was fetched for and is in the result again
  const shown = Object.values(mainEntities).reduce((n, groups) => n + groups.length, 0) + eventGroups.length

  return <div className={props.className}>
    {/* A service may tell something with what it found, which is then a message and not an error */}
    {result.ErrorMessage && (found ? <ResultNotice message={result.ErrorMessage} /> : <ResultError message={result.ErrorMessage} onRetry={props.onRetry} />)}
    {!empty &&
      <div className="m:flex m:items-center m:justify-between m:px-3 m:pt-3 m:pb-1.5">
        <span className={sectionLabel}>{t('n hits', { count: shown })}</span>
        {count > 1 && <button type="button" onClick={addAll} className={secondaryButton}>{t('add all')}</button>}
      </div>
    }
    {groupKeys.length > 0 &&
      <div className="m:flex m:flex-col m:gap-3 m:px-2.5 m:pb-2">
        {groupKeys.map(k => <div key={k} className="m:flex m:flex-col m:gap-1.5">
          {k !== last && seeds &&
            <span className="m:text-[13px] m:font-bold m:px-1">{t('linked to', { name: seeds.find(s => getId(s) === k)?.LabelShort })}</span>
          }
          {k === last && hasSeedGroups &&
            <span className="m:text-[13px] m:font-bold m:px-1">{t('not linked to selected')}</span>
          }
          {mainEntities[k].map(e => (
            <ItemResult key={getId(e.primary)} item={e} onClick={() => { addGroup(e, k) }} />
          ))}
        </div>
        )}
      </div>
    }
    {eventGroups.length > 0 &&
      <div className="m:flex m:flex-col m:gap-1.5 m:px-2.5 m:pb-2">
        {eventGroups.map(e => (
          <div key={e.GroupId} className="m:flex m:items-center m:gap-2 m:rounded-md m:border m:border-gray-300 m:bg-white m:p-2">
            <span className="m:w-[26px] m:h-[26px] m:shrink-0 m:rounded-full m:bg-gray-100 m:flex m:items-center m:justify-center">
              <Icon name='calendar_view_day' className="m:h-3.5 m:w-3.5 m:text-primary" />
            </span>
            <span className="m:flex m:flex-col m:min-w-0 m:flex-1">
              <span className="m:text-[13px] m:font-semibold m:truncate">{e.Name} · {t('n events', { count: e.Events.length })}</span>
              <span className="m:text-[11px] m:text-gray-600">
                {toDateString(e.Events[e.Events.length - 1].Date)} – {toDateString(e.Events[0].Date)} · <button type="button" onClick={() => { setShowEvents(e.Events) }} className="m:text-blue-700 m:hover:underline m:cursor-pointer">{t('show as table')}</button>
              </span>
            </span>
            <button type="button" aria-label={t('add events', { name: e.Name })} title={t('add events', { name: e.Name })} onClick={() => { addEvents(e) }}
              className="m:w-[26px] m:h-[26px] m:shrink-0 m:rounded m:border m:border-blue-300 m:bg-blue-50 m:text-blue-700 m:text-[16px] m:font-semibold m:leading-none m:hover:bg-blue-100 m:cursor-pointer">+</button>
          </div>
        ))}
      </div>
    }
    {!empty && <p className="m:text-[11px] m:text-gray-600 m:text-center m:px-3 m:pb-3">{t('drag to chart help')}</p>}
    {empty && found && <p role="status" className="m:text-[13px] m:text-gray-600 m:text-center m:px-4 m:py-6">{t('all hits added')}</p>}
    {empty && !found && !result.ErrorMessage && <NoResults />}
    {showEvents.length > 0 &&
      <Modal mode='ok' wide={true} show={showEvents.length > 0} title={t('table data')} onNegative={() => { setShowEvents([]) }} onPositive={() => { setShowEvents([]) }}>
        <TableTool items={showEvents} showExport={false} />
      </Modal>
    }
  </div>
}

export default ItemResultList
