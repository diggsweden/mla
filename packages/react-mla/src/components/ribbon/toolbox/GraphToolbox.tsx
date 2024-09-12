// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useState } from 'react'
import useMainStore from '../../../store/main-store'
import { Dijkstra } from '../../../utils/djikstra'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuSection from '../RibbonMenuSection'
import Modal from '../../common/Modal'
import Spinner from '../../common/Spinner'
import configService from '../../../services/configurationService'
import { findId } from '../../../utils/utils'
import type { IEntity, ILink } from '../../../interfaces/data-models'
import { produce } from 'immer'
import { internalAdd, internalRemove } from '../../../store/internal-actions'

interface Props {
  show?: boolean
}

interface JoinResult {
  entity?: IEntity
  link?: ILink
  updateEntity?: IEntity
  updateLink?: ILink
  show: boolean
}

export default function GraphTools (props: Props) {
  const selection = useMainStore((state) => state.selectedIds)
  const selectedEntities = useMainStore((state) => state.selectedEntities())
  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)
  const events = useMainStore((state) => state.events)
  const setSelected = useMainStore((state) => state.setSelected)
  const updateEvents = useMainStore((state) => state.setEvent)
  const data = useMainStore((state) => state.data)

  const [showJoin, setShowJoin] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinResult, setJoinResult] = useState([] as JoinResult[])

  function djikstra () {
    const result = Dijkstra(data.nodes, data.edges, selection[0], selection[1])
    for (let i = 0; i < result.length; i++) {
      data.edges.forEach(e => {
        if ((e.from === result[i] && e.to === result[i + 1]) || (e.to === result[i] && e.from === result[i + 1])) {
          if (e.id) {
            result.push(e.id.toString())
          }
        }
      })
    }

    setSelected(result)
  }

  function join () {
    setJoinLoading(true)

    internalRemove(true, joinResult.map(r => r.entity).filter(e => e != null) as IEntity[], joinResult.map(e => e.link).filter(e => e != null) as ILink[])
    internalAdd(true, joinResult.map(r => r.updateEntity).filter(e => e != null) as IEntity[], joinResult.map(e => e.updateLink).filter(e => e != null) as ILink[], true)

    const eventUpdate = Object.values(events).map(e => {
      return produce(e, draft => {
        joinResult.forEach(j => {
          Object.values(draft.LinkFrom).forEach(fr => {
            if (fr.Id === j.entity?.Id && fr.TypeId === j.entity.TypeId) {
              fr.Id = j.updateEntity!.Id
            }
          })

          Object.values(draft.LinkTo).forEach(fr => {
            if (fr.Id === j.entity?.Id && fr.TypeId === j.entity.TypeId) {
              fr.Id = j.updateEntity!.Id
            }
          })
        })
      })
    })
    updateEvents(...eventUpdate)

    setJoinLoading(false)
    setShowJoin(false)
  }

  useEffect(() => {
    if (showJoin && !joinLoading) {
      setJoinLoading(true)
      const idMap = new Map<string, string>()
      const idRMap = new Map<string, string>()
      const res = [] as JoinResult[]

      Object.values(entities).flat().forEach(e => {
        if (idRMap.has(e.Id)) {
          return
        }

        const matchRules = configService.getEntityConfiguration(e.TypeId)?.MatchRules
        if (matchRules != null) {
          const existingId = findId(e, matchRules, Object.values(entities).flat().filter(x => x.InternalId !== e.InternalId))
          if (existingId != null) {
            idMap.set(e.Id, existingId)
            idRMap.set(existingId, e.Id)
            res.push({
              entity: e,
              show: true,
              updateEntity: produce(e, draft => {
                draft.Id = existingId
              })
            })
          }
        }
      })

      Object.values(links).flat().forEach(l => {
        let changed = 0
        const updateLink = produce(l, draft => {
          if (idMap.has(l.FromEntityId)) {
            draft.FromEntityId = idMap.get(l.FromEntityId)!
            changed = 1
          }

          if (idMap.has(l.ToEntityId)) {
            draft.ToEntityId = idMap.get(l.ToEntityId)!
            changed = 1
          }

          if (idRMap.has(l.Id)) {
            return
          }

          const matchRules = configService.getLinkConfiguration(l.TypeId)?.MatchRules
          if (matchRules != null) {
            const existingId = findId(l, matchRules, Object.values(links).flat().filter(x => x.InternalId !== l.InternalId))
            if (existingId != null) {
              idMap.set(l.Id, existingId)
              idRMap.set(existingId, l.Id)
              draft.Id = existingId
              changed = 2
            }
          }
        })

        if (changed > 0) {
          res.push({
            link: l,
            show: changed === 2,
            updateLink
          })
        }
      })

      setJoinResult(res)
      setJoinLoading(false)
    } else {
      setJoinResult([])
    }
  }, [entities, joinLoading, links, showJoin])

  if (props.show === false) {
    return null
  }

  return (<>
    <RibbonMenuSection title='Verktyg'>
      <RibbonMenuButton label='Hitta länk' title='Hittar den kortaste vägen mellan 2 entiteter' disabled={selectedEntities.length !== 2} onClick={() => { djikstra() }} iconName="route" />
      <RibbonMenuButton label='Slå samman' title='Slår samman entiteter som är samma enligt matchningsregler' disabled={(data.nodes.length + data.edges.length) === 0} onClick={() => { setShowJoin(true) }} iconName="join_left" />
    </RibbonMenuSection>
    <RibbonMenuDivider />

    { showJoin &&
      <Modal mode={joinResult.length > 0 ? 'accept' : 'ok'} show={showJoin} title={'Slå samman'} onNegative={() => { setShowJoin(false) }} onPositive={() => { join() }}>
        { joinLoading && <Spinner />}
        { !joinLoading && joinResult.length > 0 && <div className="m-text-left m-px-3 m-py-2">
          <p>Följande slås samman:</p>
          <ul className="m-list-inside m-list-disc">
            {joinResult.filter(r => r.show).map(r => (<>
              {r.entity &&
                <li key={r.entity.InternalId}>{configService.getEntityConfiguration(r.entity.TypeId)?.Name}: {r.entity.LabelShort} </li>
              }
              {r.link &&
                <li key={r.link.InternalId}>{configService.getLinkConfiguration(r.link.TypeId)?.Name}: {r.link.LabelShort} </li>
              }
            </>
            ))}
          </ul>
        </div>}
        { !joinLoading && joinResult.length === 0 && <>
          <p className="m-py-3">Hittade ingen data som kunde slås samman.</p>
        </>}
      </Modal>
    }
  </>)
}
