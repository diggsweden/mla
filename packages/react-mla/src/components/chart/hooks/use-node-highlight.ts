// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useState } from "react";
import Sigma from "sigma";
import { SigmaEdgeEventPayload, SigmaNodeEventPayload } from "sigma/types";
import useAppStore from "../../../store/app-store";
import useMainStore from "../../../store/main-store";

function useNodeHighlight(renderer: Sigma | undefined) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const disableHoverEffect = useAppStore((state) => !state.hoverEffect);
  const graph = useMainStore((state) => state.graph);
  const selectedShapeIds = useMainStore((state) => state.selectedShapeIds);

  useEffect(() => {
    if (renderer == null) return;

    const enterNode = (e: SigmaNodeEventPayload) => {
      if (selectedShapeIds.length > 0) return;

      graph.setNodeAttribute(e.node, "highlighted", true);
      setHoveredNode(e.node);
    };

    const exitNode = (e: SigmaNodeEventPayload) => {
      if (selectedShapeIds.length > 0) return;

      graph.setNodeAttribute(e.node, "highlighted", false);
      setHoveredNode(null);
    };

    const enterEdge = (e: SigmaEdgeEventPayload) => {
      if (selectedShapeIds.length > 0) return;

      // Only attempt to modify the edge if it still exists in the graph
      if (graph.hasEdge(e.edge)) {
        graph.setEdgeAttribute(e.edge, "highlighted", true);
        setHoveredEdge(e.edge);
      }
    };

    const exitEdge = (e: SigmaEdgeEventPayload) => {
      if (selectedShapeIds.length > 0) return;

      // Only attempt to modify the edge if it still exists in the graph
      if (graph.hasEdge(e.edge)) {
        graph.setEdgeAttribute(e.edge, "highlighted", false);
      }
      setHoveredEdge(null);
    };

    renderer.on("enterNode", enterNode);
    renderer.on("leaveNode", exitNode);
    renderer.on("enterEdge", enterEdge);
    renderer.on("leaveEdge", exitEdge);

    return () => {
      renderer.off("enterNode", enterNode);
      renderer.off("leaveNode", exitNode);
      renderer.off("enterEdge", enterEdge);
      renderer.off("leaveEdge", exitEdge);
    };
  }, [selectedShapeIds, graph, renderer]);

  useEffect(() => {
    if (renderer == null) return;

    renderer.setSetting("nodeReducer", (node, data) => {
      const graph = renderer.getGraph();
      const newData = { ...data, highlighted: data.highlighted || false };

      if (!disableHoverEffect && hoveredNode) {
        if (node === hoveredNode || graph.neighbors(hoveredNode).includes(node)) {
          newData.highlighted = true;
        } else {
          newData.highlighted = false;
        }
      }
      return newData;
    });

    renderer.setSetting("edgeReducer", (edge, data) => {
      const graph = renderer.getGraph();

      // Safety check: if the edge no longer exists, return the data as is without modification
      if (!graph.hasEdge(edge)) {
        return data;
      }

      const newData = { ...data, hidden: false };

      if (!disableHoverEffect && hoveredNode && !graph.extremities(edge).includes(hoveredNode)) {
        newData.hidden = true;
      }

      if (edge === hoveredEdge) {
        const res = { ...data };
        res.color = "#000000";
        return res;
      }

      return newData;
    });

    return () => {
      renderer.setSetting("nodeReducer", null);
      renderer.setSetting("edgeReducer", null);
    };
  }, [hoveredNode, hoveredEdge, disableHoverEffect, renderer]);
}

export default useNodeHighlight;
