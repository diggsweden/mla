// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useCallback } from "react";
import Sigma from "sigma";
import Graph from "graphology";

const TEMP_INIT_NODE_ID = "__temp_init_node__";

export const useSigmaInitialization = () => {
  const initializeEmptyChart = useCallback((sigma: Sigma, graph: Graph) => {
    const width = sigma.getContainer().clientWidth;
    const height = sigma.getContainer().clientHeight;

    if (graph.order === 0) {
      const pos = sigma.viewportToGraph({ x: width / 2, y: height / 2 });

      graph.addNode(TEMP_INIT_NODE_ID, {
        x: pos.x,
        y: pos.y,
        size: 1,
        color: "#ffffff",
      });

      const camera = sigma.getCamera();
      camera.setState({
        x: pos.x,
        y: pos.y,
        ratio: 1,
        angle: 0,
      });

      sigma.refresh();
      graph.dropNode(TEMP_INIT_NODE_ID);
    }
  }, []);

  const setupBoundingBox = useCallback((sigma: Sigma) => {
    const setBBox = () => {
      sigma.setCustomBBox({
        x: [0, sigma.getContainer().clientWidth],
        y: [0, sigma.getContainer().clientHeight],
      });
    };

    setBBox();
    sigma.on("resize", setBBox);

    return setBBox;
  }, []);

  const setupEventHandlers = useCallback((sigma: Sigma) => {
    sigma.on("doubleClickNode", (e) => e.preventSigmaDefault());
    sigma.on("doubleClickEdge", (e) => e.preventSigmaDefault());
    sigma.on("doubleClickStage", (e) => e.preventSigmaDefault());
  }, []);

  return { initializeEmptyChart, setupBoundingBox, setupEventHandlers };
};
