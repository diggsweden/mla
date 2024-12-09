// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuSection from '../RibbonMenuSection'
import { useTranslation } from 'react-i18next'

import betweennessCentrality from 'graphology-metrics/centrality/betweenness';
import closenessCentrality from 'graphology-metrics/centrality/closeness';
import edgeBetweennessCentrality from 'graphology-metrics/centrality/edge-betweenness';
import { degreeCentrality, inDegreeCentrality, outDegreeCentrality } from 'graphology-metrics/centrality/degree';
import eigenvectorCentrality from 'graphology-metrics/centrality/eigenvector';
import pagerank from 'graphology-metrics/centrality/pagerank';

import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import { DEFAULT_NODE_SIZE } from '../../chart/sigma/ChartNode'
import { DEFAULT_EDGE_SIZE } from '../../chart/sigma/ChartEdge'

interface Props {
  show?: boolean
}

export default function SnaTools(props: Props) {
  const { t } = useTranslation();

  const graph = useMainStore((state) => state.graph)
  const sigma = useMainStore((state) => state.sigma)

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

  if (props.show != true) {
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
      </RibbonMenuButtonGroup>
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </>)
}
