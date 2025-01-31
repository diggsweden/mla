// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'

import { useTranslation } from 'react-i18next'
import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuSection from '../RibbonMenuSection'

import betweennessCentrality from 'graphology-metrics/centrality/betweenness'
import closenessCentrality from 'graphology-metrics/centrality/closeness'
import { degreeCentrality, inDegreeCentrality, outDegreeCentrality } from 'graphology-metrics/centrality/degree'
import edgeBetweennessCentrality from 'graphology-metrics/centrality/edge-betweenness'
import eigenvectorCentrality from 'graphology-metrics/centrality/eigenvector'
import pagerank from 'graphology-metrics/centrality/pagerank'

import { DEFAULT_EDGE_SIZE } from '../../chart/sigma/ChartEdge'
import { DEFAULT_NODE_SIZE } from '../../chart/sigma/ChartNode'
import Modal from '../../common/Modal'

interface Props {
  show?: boolean
}

interface CentralityType {
  id: string,
  name: string,
  description: string
}

export default function SnaTools(props: Props) {
  const { t } = useTranslation();

  const graph = useMainStore((state) => state.graph)
  const sigma = useMainStore((state) => state.sigma)

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [centrality, setCentrality] = useState<CentralityType | null>(null)

  const centralityTypes: CentralityType[] = [
    { id: 'closeness', name: t('centrality closeness'), description: t('centrality closeness desc') },
    { id: 'betweenness', name: t('centrality betweenness'), description: t('centrality betweenness desc') },
    { id: 'pagerank', name: t('centrality pagerank'), description: t('centrality pagerank desc') },
    { id: 'degree', name: t('centrality degree'), description: t('centrality degree desc') },
    { id: 'indegree', name: t('centrality indegree'), description: t('centrality indegree desc') },
    { id: 'outdegree', name: t('centrality outdegree'), description: t('centrality outdegree desc') },
    { id: 'eigen', name: t('centrality eigen'), description: t('centrality eigen desc') },
    { id: 'edge betweenness', name: t('centrality edge betweenness'), description: t('centrality edge betweenness desc') }
  ]

  function resetCentrality() {
    graph.forEachNode((node, atts) => {
      atts.size = DEFAULT_NODE_SIZE;
    });

    sigma?.scheduleRefresh();
  }

  function setClosenessCentrality() {
    setCentrality(centralityTypes[1])
    applyCentrality();
  }

  function applyCentrality() {
    setShowAdvancedSettings(false)
    setCentrality(null)

    if (graph.size == 0) return;

    switch (centrality?.id) {
      case 'closeness':
        resizeNodes(closenessCentrality(graph));
        break;
      case 'pagerank':
        resizeNodes(pagerank(graph));
        break;
      case 'degree':
        resizeNodes(degreeCentrality(graph));
        break;
      case 'indegree':
        resizeNodes(inDegreeCentrality(graph));
        break;
      case 'outdegree':
        resizeNodes(outDegreeCentrality(graph));
        break;
      case 'eigen':
        resizeNodes(eigenvectorCentrality(graph));
        break;
      case 'betweenness':
        resizeNodes(betweennessCentrality(graph));
        break;
      case 'edge betweenness':
        setEdgeBetweennessCentrality();
        break;
      default:
        break;
    }
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

  function resizeNodes(scores: { [node: string]: number }): void {
    const keys = Object.keys(scores);
    const min = Math.min.apply(null, keys.map(function (x) { return scores[x] }));
    const max = Math.max.apply(null, keys.map(function (x) { return scores[x] }));

    graph.forEachNode((node, atts) => {
      atts.size = calculateNewSize(DEFAULT_NODE_SIZE, min, max, scores[node]);
    });

    sigma?.scheduleRefresh();
  }

  function calculateNewSize(baseValue: number, min: number, max: number, value: number): number {
    return (baseValue * ((value - min) / (max - min))) + (baseValue / 2);
  }

  if (props.show != true) {
    return null
  }

  return (<>
    <RibbonMenuSection title={(t('centrality measures'))}>
      <RibbonMenuButton label={t('centrality reset')} title={t('centrality reset')} onClick={() => { resetCentrality() }} iconName="route" />
      <RibbonMenuButton label={t('centrality closeness')} title={t('centrality closeness desc')} onClick={() => { setClosenessCentrality() }} iconName="nearby" />
      <RibbonMenuButton label={t('centrality advanced')} title={t('centrality advanced desc')} onClick={() => { setShowAdvancedSettings(true) }} iconName="rule_settings" />
    </RibbonMenuSection>
    <RibbonMenuDivider />

    {showAdvancedSettings &&
      <Modal mode='ok' className='m-h-96' show={showAdvancedSettings} title={t('centrality measures')} onNegative={() => { applyCentrality() }} onPositive={() => { }} sidebar={
        <div className="m-text-left m-mx-5">
          <div className='m-font-medium m-text-lg'>
            {t('centrality')}
          </div>
          <ul className="m-w-36 m-mt-2">
            {centralityTypes.map(ct =>
              <li key={ct.id} className="m-mt-1">
                <div className="m-flex m-items-center">
                  <input id={ct.id} type="radio" value={ct.id} name="list-radio" className="m-h-4 m-text-blue-600 m-bg-white m-border-gray-300" onChange={() => setCentrality(ct)} />
                  <label htmlFor={ct.id} className="m-pl-2">{ct.name}</label>
                </div>
              </li>
            )}
          </ul>
        </div>
      }>
        <div className="m-text-left m-h-full m-py-5 m-px-5">
          <div className='m-font-medium m-text-lg'>{centrality?.name}</div>
          <div className='m-pt-2'>{centrality?.description ?? t('centrality select')}</div>
        </div>
      </Modal>
    }
  </>)
}
