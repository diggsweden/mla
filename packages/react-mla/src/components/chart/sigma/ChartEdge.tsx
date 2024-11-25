// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2
import useMainStore from '../../../store/main-store'
import { useEffect, useMemo, useRef } from 'react'
import type { ILink } from '../../../interfaces/data-models'
import { getId, isSelected } from '../../../utils/utils'
import Graph from 'graphology'
import { DEFAULT_EDGE_CURVATURE } from "@sigma/edge-curve";

interface Props {
  link: ILink
  graph: Graph,
  size: number
}

function getCurvature(index: number, maxIndex: number): number {
  if (maxIndex <= 0) throw new Error("Invalid maxIndex");
  if (index < 0) return -getCurvature(-index, maxIndex);
  const amplitude = 3.5;
  const maxCurvature = amplitude * (1 - Math.exp(-maxIndex / amplitude)) * DEFAULT_EDGE_CURVATURE;
  return (maxCurvature * index) / maxIndex;
}

function ChartEdge(props: Props) {
  const link = props.link

  const getEntity = useMainStore(state => state.getCurrentEntity)
  const date = useMainStore(state => state.currentDate)
  const selectedIds = useMainStore(state => state.selectedIds)
  // const selectedView = useAppStore(state => state.thingViewConfiguration[link.TypeId])

  const from = useMemo(() => getEntity(link.FromEntityId + link.FromEntityTypeId, date.DateFrom)!, [getEntity, link, date])
  const to = useMemo(() => getEntity(link.ToEntityId + link.ToEntityTypeId, date.DateFrom)!, [getEntity, link, date])

  // const view = useMemo(() => {
  //   return { ...viewService.getDefaultView(link.TypeId, link.GlobalType), ...selectedView }
  // }, [link, selectedView])

  const selected = useMemo(() => {
    if (link != null && from != null && to != null) {
      return isSelected(link, selectedIds)
      //return isSelected(link, selectedIds) || ((view.Show ?? true) && isSelected(from, selectedIds)) || ((view.Show ?? true) && isSelected(to, selectedIds))
    }

    return false
  }, [from, link, selectedIds, to])

  
  const created = useRef(null as null | string)
  useEffect(() => {
    console.debug('[adding]', getId(link))

    switch (link.Direction) {
      case "TO":
        created.current = props.graph.addDirectedEdgeWithKey(getId(link), getId(from), getId(to), {
          size: props.size,
          label: link.LabelChart,
          drawLabel: true,
          type: "arrow"
        });      
        break;
      case "FROM":
        created.current = props.graph.addDirectedEdgeWithKey(getId(link), getId(to), getId(from), {
          size: props.size,
          label: link.LabelChart,
          drawLabel: true,
          type: "arrow"
        });      
        break;
      case "NONE":
      case "BOTH":
        created.current = props.graph.addUndirectedEdgeWithKey(getId(link), getId(from), getId(to), {
          size: props.size,
          label: link.LabelChart,
          drawLabel: true
        });      
    
      break;
    }

    //created.current = props.graph.addEdgeWithKey(getId(link), getId(from), getId(to), {
    //  size: props.size,
    //  label: link.LabelChart,
    //  drawLabel: true
    //});

    return () => {
      if (created.current && props.graph.hasEdge(created.current)) {
        console.debug('[removing]', getId(link))
        props.graph.dropEdge(getId(link))
        created.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (created.current) {
      props.graph.setEdgeAttribute(created.current, "label", link.LabelChart)
    }
  }, [from, link, props.graph, to])

  useEffect(() => {
    if (created.current) {
      props.graph.setEdgeAttribute(created.current, "width", selected ? 8 : 4)
      props.graph.setEdgeAttribute(created.current, "color", selected ? "#60a5fa" : undefined)
    }
  }, [from, link, props.graph, selected, to])

  useEffect(() => {
    console.log('[update link]', getId(link))
    // TODO: Only update the edges that exists between the nodes

    // Adapt types and curvature of parallel edges for rendering:
    props.graph.forEachEdge(
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
        console.log('test', getId(link))
        const showArrow = props.graph.isDirected(edge);
        if (typeof parallelMinIndex === "number") {
          props.graph.mergeEdgeAttributes(edge, {
            type: parallelIndex ? (showArrow ? "curvedWithArrow" : "curved") : (showArrow ? "straightWithArrow" : "straight"),
            curvature: getCurvature(parallelIndex, parallelMaxIndex),
          });
        } else if (typeof parallelIndex === "number") {
          props.graph.mergeEdgeAttributes(edge, {
            type: "curved",
            curvature: getCurvature(parallelIndex, parallelMaxIndex),
          });
        } else {
          props.graph.setEdgeAttribute(edge, "type", (showArrow ? "straightWithArrow" : "straight"));
        }
      },
    );
  }, [link, props.graph])

  return null
}

export default ChartEdge
