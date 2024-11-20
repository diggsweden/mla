// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useState } from 'react'
import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuSection from '../RibbonMenuSection'
import Modal from '../../common/Modal'
import Spinner from '../../common/Spinner'
import configService from '../../../services/configurationService'
import { findId, getId } from '../../../utils/utils'
import type { IEntity, ILink } from '../../../interfaces/data-models'
import { produce } from 'immer'
import { internalAdd, internalRemove } from '../../../store/internal-actions'
import { useTranslation } from 'react-i18next'

import { bidirectional } from 'graphology-shortest-path/unweighted';
import { edgePathFromNodePath } from 'graphology-shortest-path/utils';
import eccentricity from 'graphology-metrics/node/eccentricity';
import betweennessCentrality from 'graphology-metrics/centrality/betweenness';
import closenessCentrality from 'graphology-metrics/centrality/closeness';
import edgeBetweennessCentrality from 'graphology-metrics/centrality/edge-betweenness';
import { degreeCentrality, inDegreeCentrality, outDegreeCentrality } from 'graphology-metrics/centrality/degree';
import eigenvectorCentrality from 'graphology-metrics/centrality/eigenvector';
import pagerank from 'graphology-metrics/centrality/pagerank';

import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import { DEFAULT_EDGE_SIZE, DEFAULT_NODE_SIZE } from '../../chart/sigma/ContentRenderer'

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

export default function GraphTools(props: Props) {
  const { t } = useTranslation();

  const selectedIds = useMainStore((state) => state.selectedIds)
  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)
  const events = useMainStore((state) => state.events)
  const setSelected = useMainStore((state) => state.setSelected)
  const updateEvents = useMainStore((state) => state.setEvent)

  const graph = useMainStore((state) => state.graph)
  const sigma = useMainStore((state) => state.sigma)

  const [showJoin, setShowJoin] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinResult, setJoinResult] = useState([] as JoinResult[])

  function calculateNewSize(baseValue: number, min: number, max: number, value: number): number {
    return (baseValue * ((value - min) / (max - min))) + (baseValue / 2);
  }

  function resizeNodes(scores: { [node: string]: number }): void {
    const keys = Object.keys(scores);
    const min = Math.min.apply(null, keys.map(function (x) { return scores[x] }));
    const max = Math.max.apply(null, keys.map(function (x) { return scores[x] }));

    graph.forEachNode((node, atts) => {
      atts.size = calculateNewSize(DEFAULT_NODE_SIZE, min, max, scores[node]);
    });

    sigma?.scheduleRefresh();
  }

  function resetCentrality() {
    graph.forEachNode((node, atts) => {
      atts.size = DEFAULT_NODE_SIZE;
    });

    sigma?.scheduleRefresh();
  }

  function setClosenessCentrality() {
    if (graph.nodes.length == 0) return;
    const scores = closenessCentrality(graph);
    resizeNodes(scores);
  }

  function setBetweennessCentrality() {
    const scores = betweennessCentrality(graph);
    resizeNodes(scores);
  }

  function setDegreeCentrality() {
    const scores = degreeCentrality(graph);
    resizeNodes(scores);
  }

  function setInDegreeCentrality() {
    const scores = inDegreeCentrality(graph);
    resizeNodes(scores);
  }

  function setOutDegreeCentrality() {
    const scores = outDegreeCentrality(graph);
    resizeNodes(scores);
  }

  function setEigenCentrality() {
    const scores = eigenvectorCentrality(graph);
    resizeNodes(scores);
  }

  function setPageRankCentrality() {
    const scores = pagerank(graph);
    resizeNodes(scores);
  }

  function setEdgeBetweennessCentrality() {
    const centralities = edgeBetweennessCentrality(graph);

    const keys = Object.keys(centralities);
    const min = Math.min.apply(null, keys.map(function (x) { return centralities[x] }));
    const max = Math.max.apply(null, keys.map(function (x) { return centralities[x] }));

    graph.forEachEdge((edge, atts) => {
      atts.size = calculateNewSize(DEFAULT_EDGE_SIZE, min, max, centralities[edge]);
    });

    sigma?.scheduleRefresh();
  }

  function shortestPath() {
    const nodePath = bidirectional(graph, getId(selectedEntities[0]), getId(selectedEntities[1]));
    if (nodePath) {
      const edgePath = edgePathFromNodePath(graph, nodePath);
      const result = [...nodePath, ...edgePath]
      setSelected(result)
    } else {
      window.alert("TODO: Det finns ingen väg mellan noderna")
    }
  }

  function stronglyConnected() {
    let nodes = selectedIds.filter(n => graph.hasNode(n))
    if (nodes.length == 0) {
      nodes = Object.keys(entities)
    }

    const scores = {} as Record<string, number>
    for (const node of nodes) {
      scores[node] = eccentricity(graph, node)
    }

    let maxScore = Number.MAX_VALUE;
    let max = ""
    for (const node of Object.keys(scores)) {
      const score = scores[node]
      if (score < maxScore) {
        maxScore = score
        max = node
      }
    }

    if (max) {
      graph.setNodeAttribute(max, "highlighted", true)
      setSelected([max])
    } else {
      window.alert("TODO: Hittade inget vettigt")
    }
  }

  function join() {
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
    <RibbonMenuSection title={(t('centrality measures'))}>
      <RibbonMenuButton label={t('centrality reset')} title={t('reset centrality desc')} onClick={() => { resetCentrality() }} iconName="route" />
      <RibbonMenuButtonGroup>
        <RibbonMenuIconButton label={t('centrality closeness')} title={t('centrality closeness desc')} onClick={() => { setClosenessCentrality() }} icon="share" />
        <RibbonMenuIconButton label={t('centrality betweenness')} title={t('centrality betweenness desc')} onClick={() => { setBetweennessCentrality() }} icon="linked_services" />
        <RibbonMenuIconButton label={t('centrality pagerank')} title={t('centrality pagerank desc')} onClick={() => { setPageRankCentrality() }} icon="workspace_premium" />
      </RibbonMenuButtonGroup>
      <RibbonMenuButtonGroup>
        <RibbonMenuIconButton label={t('centrality degree')} title={t('centrality degree desc')} onClick={() => { setDegreeCentrality() }} icon="recenter" />
        <RibbonMenuIconButton label={t('centrality indegree')} title={t('centrality indegree desc')} onClick={() => { setInDegreeCentrality() }} icon="step_into" />
        <RibbonMenuIconButton label={t('centrality outdegree')} title={t('centrality outdegree desc')} onClick={() => { setOutDegreeCentrality() }} icon="step_out" />
      </RibbonMenuButtonGroup>
      <RibbonMenuButtonGroup>
        <RibbonMenuIconButton label={t('centrality eigen')} title={t('centrality eigen desc')} onClick={() => { setEigenCentrality() }} icon="route" />
        <RibbonMenuIconButton label={t('centrality edge betweenness')} title={t('centrality edge betweenness desc')} onClick={() => { setEdgeBetweennessCentrality() }} icon="diagonal_line" />
        <RibbonMenuIconButton label={t('break network')} title={t('break network desc')} disabled={Object.keys(links).length === 0} onClick={() => { stronglyConnected() }} icon="hub" />
      </RibbonMenuButtonGroup>
    </RibbonMenuSection>
    <RibbonMenuDivider />
    <RibbonMenuSection title={(t('tools'))}>
      <RibbonMenuButton label={t('find link')} title={t('find link desc')} disabled={selectedEntities.length !== 2} onClick={() => { shortestPath() }} iconName="route" />
      <RibbonMenuButton label={t('merge')} title={t('merge desc')} disabled={(Object.keys(entities).length + Object.keys(links).length) === 0} onClick={() => { setShowJoin(true) }} iconName="join_left" />
    </RibbonMenuSection>
    <RibbonMenuDivider />

    {showJoin &&
      <Modal mode={joinResult.length > 0 ? 'accept' : 'ok'} show={showJoin} title={t('merge')} onNegative={() => { setShowJoin(false) }} onPositive={() => { join() }}>
        {joinLoading && <Spinner />}
        {!joinLoading && joinResult.length > 0 && <div className="m-text-left m-px-3 m-py-2">
          <p>{t('merge')}</p>
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
        {!joinLoading && joinResult.length === 0 && <>
          <p className="m-py-3">{t('nothing to merge')}</p>
        </>}
      </Modal>
    }
  </>)
}
