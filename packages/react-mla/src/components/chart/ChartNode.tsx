// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import Graph from "graphology";
import { useEffect, useMemo, useRef } from "react";
import type { IEntity } from "../../interfaces/data-models";
import configService from "../../services/configurationService";
import viewService from "../../services/viewService";
import useAppStore from "../../store/app-store";
import useMainStore from "../../store/main-store";
import { getId, isSelected } from "../../utils/utils";

interface Props {
  entity: IEntity;
  graph: Graph;
}

export const DEFAULT_NODE_SIZE = 25;

function ChartNode(props: Props) {
  const entity = props.entity;

  const selectedIds = useMainStore((state) => state.selectedNodeAndLinkIds);
  const viewConfig = useAppStore((state) => state.currentViewConfiguration);
  const selectedView = useAppStore((state) => state.thingViewConfiguration[entity.TypeId]);
  const showIconBorder = configService.getConfiguration().Theme?.IconBorder == true;

  const id = useMemo(() => {
    return getId(entity);
  }, [entity]);

  const view = useMemo(() => {
    return { ...viewService.getDefaultView(entity.TypeId, entity.GlobalType), ...selectedView };
  }, [entity, selectedView]);

  const selected = useMemo(() => {
    return entity != null ? isSelected(entity, selectedIds) : false;
  }, [entity, selectedIds]);

  const icon = useMemo(() => {
    return viewService.getIconByRule(entity, viewConfig);
  }, [entity, viewConfig]);

  const created = useRef(null as null | string);
  useEffect(() => {
    console.debug("[adding]", getId(entity));
    created.current = props.graph.addNode(id, {
      label: entity.LabelChart,
      x: entity.PosX,
      y: entity.PosY,
      fixed: true,
      size: entity.Size ?? DEFAULT_NODE_SIZE,
    });

    return () => {
      if (created.current && props.graph.hasNode(created.current)) {
        console.debug("[removing]", getId(entity));
        props.graph.dropNode(created.current);
        created.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, props.graph]);

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "x", entity.PosX);
      props.graph.setNodeAttribute(created.current, "y", entity.PosY);
    }
  }, [props.graph, entity.PosY, entity.PosX]);

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "label", entity.LabelChart);
    }
  }, [props.graph, entity.LabelChart]);

  useEffect(() => {
    if (created.current) {
      const borderColor = icon?.borderColor ? icon?.borderColor : selected ? "#60a5fa" : showIconBorder ? icon?.iconColor : "#FFFFFF";
      props.graph.setNodeAttribute(created.current, "image", icon?.name);
      props.graph.setNodeAttribute(created.current, "iconColor", icon?.iconColor);
      props.graph.setNodeAttribute(created.current, "borderColor", borderColor);
      props.graph.setNodeAttribute(created.current, "color", selected ? "#dbeafe" : icon?.backgroundColor);
    }
  }, [icon, props.graph, showIconBorder, selected]);

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "hidden", !(view.Show ?? true));
    }
  }, [props.graph, view.Show]);

  useEffect(() => {
    if (created.current) {
      props.graph.setNodeAttribute(created.current, "size", entity.Size ?? DEFAULT_NODE_SIZE);
    }
  }, [props.graph, entity.Size]);

  return null;
}

export default ChartNode;
