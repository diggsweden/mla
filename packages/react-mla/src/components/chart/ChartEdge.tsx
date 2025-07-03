// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import Graph from "graphology";
import { useEffect, useMemo, useRef } from "react";
import type { ILink } from "../../interfaces/data-models";
import viewService from "../../services/viewService";
import useAppStore from "../../store/app-store";
import useMainStore from "../../store/main-store";
import { getId, isSelected } from "../../utils/utils";

interface Props {
  link: ILink;
  graph: Graph;
}

export const DEFAULT_EDGE_SIZE = 5;

function ChartEdge(props: Props) {
  const link = props.link;

  const getEntity = useMainStore((state) => state.getCurrentEntity);
  const date = useMainStore((state) => state.currentDate);
  const selectedIds = useMainStore((state) => state.selectedNodeAndLinkIds);
  const selectedView = useAppStore((state) => state.thingViewConfiguration[link.TypeId]);

  const id = useMemo(() => {
    return getId(link);
  }, [link]);
  const fromId = useMemo(() => getId(getEntity(link.FromEntityId + link.FromEntityTypeId, date.DateFrom)!), [getEntity, link, date]);
  const toId = useMemo(() => getId(getEntity(link.ToEntityId + link.ToEntityTypeId, date.DateFrom)!), [getEntity, link, date]);

  const view = useMemo(() => {
    return { ...viewService.getDefaultView(link.TypeId, link.GlobalType), ...selectedView };
  }, [link, selectedView]);

  const selected = useMemo(() => {
    if (link != null && fromId != null && toId != null) {
      return isSelected(link, selectedIds);
      //return isSelected(link, selectedIds) || ((view.Show ?? true) && isSelected(from, selectedIds)) || ((view.Show ?? true) && isSelected(to, selectedIds))
    }

    return false;
  }, [fromId, link, selectedIds, toId]);

  const created = useRef(null as null | string);
  useEffect(() => {
    console.debug("[adding]", id);
    switch (link.Direction) {
      case "TO":
        created.current = props.graph.addDirectedEdgeWithKey(id, fromId, toId, {
          label: link.LabelChart,
          drawLabel: true,
          color: selected ? "#60a5fa" : link.Color,
          type: "straightWithArrow",
          size: link.Size ?? DEFAULT_EDGE_SIZE,
        });
        break;
      case "FROM":
        created.current = props.graph.addDirectedEdgeWithKey(id, toId, fromId, {
          label: link.LabelChart,
          drawLabel: true,
          color: selected ? "#60a5fa" : link.Color,
          type: "straightWithArrow",
          size: link.Size ?? DEFAULT_EDGE_SIZE,
        });
        break;
      default:
        created.current = props.graph.addUndirectedEdgeWithKey(id, fromId, toId, {
          label: link.LabelChart,
          drawLabel: true,
          color: selected ? "#60a5fa" : link.Color,
          type: "straight",
          size: link.Size ?? DEFAULT_EDGE_SIZE,
        });
        break;
    }

    return () => {
      if (created.current && props.graph.hasEdge(created.current)) {
        console.debug("[removing]", getId(link));
        props.graph.dropEdge(getId(link));
        created.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, link.Direction, fromId, props.graph, toId]);

  useEffect(() => {
    if (created.current) {
      props.graph.setEdgeAttribute(created.current, "hidden", !(view.Show ?? true));
    }
  }, [props.graph, view.Show]);

  useEffect(() => {
    if (created.current) {
      props.graph.setEdgeAttribute(created.current, "label", link.LabelChart);
    }
  }, [link.LabelChart, props.graph]);

  useEffect(() => {
    if (created.current) {
      props.graph.setEdgeAttribute(created.current, "color", selected ? "#60a5fa" : link.Color);
    }
  }, [link.Color, props.graph, selected]);

  useEffect(() => {
    if (created.current) {
      props.graph.setEdgeAttribute(created.current, "size", link.Size ?? DEFAULT_EDGE_SIZE);
    }
  }, [link.Size, props.graph]);

  return null;
}

export default ChartEdge;
