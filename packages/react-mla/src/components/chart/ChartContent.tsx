// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useMemo } from 'react'
import useMainStore from '../../store/main-store'
import { getId } from '../../utils/utils'
import ChartEdge from './ChartEdge'
import ChartEntity from './ChartNode'

import { DEFAULT_EDGE_CURVATURE, indexParallelEdgesIndex } from "@sigma/edge-curve"

function ChartContent() {
  const date = useMainStore(state => state.currentDate)

  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)
  const graph = useMainStore((state) => state.graph)
  const computedLinks = useMainStore((state) => state.computedLinks)

  const getEntity = useMainStore(state => state.getCurrentEntity)
  const getLink = useMainStore(state => state.getCurrentLink)

  const nodes = useMemo(() => Object.keys(entities).map(k => getEntity(k, date.DateFrom)!), [entities, date.DateFrom, getEntity])
  const edges = useMemo(() => Object.keys(links).map(k => getLink(k, date.DateFrom)!), [links, date.DateFrom, getLink])

  const linkCount = useMemo(() => {
    return Object.keys(links).length + computedLinks.length
  }, [computedLinks.length, links])

  useEffect(() => {
    if (graph == undefined) {
      return;
    }

    console.debug('[updating edge count]')

    indexParallelEdgesIndex(graph, {
      edgeIndexAttribute: "parallelIndex",
      edgeMinIndexAttribute: "parallelMinIndex",
      edgeMaxIndexAttribute: "parallelMaxIndex",
    });

    graph.forEachEdge(
      (
        edge,
        {
          parallelIndex,
          parallelMinIndex,
          parallelMaxIndex,
        }:
          | { parallelIndex: number; parallelMinIndex?: number; parallelMaxIndex: number }
          | { parallelIndex?: null; parallelMinIndex?: null; parallelMaxIndex?: null },
      ) => {
        const showArrow = graph.isDirected(edge);
        if (typeof parallelMinIndex === "number") {
          graph.mergeEdgeAttributes(edge, {
            type: parallelIndex ? (showArrow ? "curvedWithArrow" : "curved") : (showArrow ? "straightWithArrow" : "straight"),
            curvature: getCurvature(parallelIndex, parallelMaxIndex),
          });
        } else if (typeof parallelIndex === "number") {
          graph.mergeEdgeAttributes(edge, {
            type: "curved",
            curvature: getCurvature(parallelIndex, parallelMaxIndex),
          });
        } else {
          graph.setEdgeAttribute(edge, "type", (showArrow ? "straightWithArrow" : "straight"));
        }
      },
    );
  }, [graph, linkCount])

  if (graph == undefined) {
    return;
  }

  return (<>
    {nodes.map(s =>
      <ChartEntity key={getId(s)} entity={s} graph={graph}></ChartEntity>
    )}
    {edges.map(s =>
      <ChartEdge key={getId(s)} link={s} graph={graph}></ChartEdge>
    )}
    {computedLinks.map(s =>
      <ChartEdge key={s.Id} link={s} graph={graph}></ChartEdge>
    )}
  </>
  )
}

function getCurvature(index: number, maxIndex: number): number {
  if (maxIndex <= 0) throw new Error("Invalid maxIndex");
  if (index < 0) return -getCurvature(-index, maxIndex);

  const amplitude = 3.5;
  const maxCurvature = amplitude * (1 - Math.exp(-maxIndex / amplitude)) * DEFAULT_EDGE_CURVATURE;
  return (maxCurvature * index) / maxIndex;
}

export default ChartContent
