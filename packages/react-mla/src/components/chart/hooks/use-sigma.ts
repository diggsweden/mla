// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import EdgeCurveProgram, { EdgeCurvedArrowProgram } from "@sigma/edge-curve";
import { createNodeBorderProgram } from "@sigma/node-border";
import Graph from "graphology";
import { useCallback, useEffect, useRef } from "react";
import Sigma from "sigma";
import { EdgeArrowProgram, EdgeRectangleProgram, createNodeCompoundProgram } from "sigma/rendering";
import { Settings } from "sigma/settings";
import useKeyDown from "../../../effects/keydown";
import configService from "../../../services/configurationService";
import useMainStore from "../../../store/main-store";
import { drawDiscCustomNodeHover, drawDiscCustomNodeLabel } from "../rendering/node-renderer";
import { createNodeSvgProgram } from "../rendering/svg-node-renderer";
import { TextureManager } from "../rendering/svg-node-renderer/texture";
import useEntityDrop from "./use-entity-drop";
import useMultiselect from "./use-multiselect";
import useDragNodes from "./use-node-drag";
import useNodeHighlight from "./use-node-highlight";
import useRightMousePan from "./use-right-mouse-pan";

// Temporary node ID for initialization
const TEMP_INIT_NODE_ID = "__temp_init_node__";

const useSigma = (graph: Graph) => {
  const container = useRef<HTMLDivElement>(null);

  const setSelected = useMainStore((state) => state.setSelected);

  const sigma = useMainStore((state) => state.sigma);
  const setSigma = useMainStore((state) => state.setSigma);

  const entities = useMainStore((state) => state.entities);
  const links = useMainStore((state) => state.links);

  const preloadImages = (manager: TextureManager) => {
    configService.getConfiguration().Display.forEach((c) => {
      c.Show.forEach((s) => {
        if (s.Icon) {
          manager.registerImage(s.Icon);
        }
      });
    });
  };

  const createSigma = useCallback(
    (container: HTMLElement) => {
      const NodeBorderCustomProgram = createNodeBorderProgram({
        borders: [
          { size: { value: 0.1 }, color: { attribute: "borderColor" } },
          { size: { fill: true }, color: { attribute: "color" } },
        ],
      });

      const NodePictogramCustomProgram = createNodeSvgProgram({
        padding: 0.3,
        size: { mode: "force", value: 256 },
        drawingMode: "color",
        colorAttribute: "iconColor",
        createCallback: preloadImages,
      });

      const NodeProgram = createNodeCompoundProgram([NodeBorderCustomProgram, NodePictogramCustomProgram]);

      const settings = {
        zoomToSizeRatioFunction: (x) => x,
        allowInvalidContainer: true,
        autoRescale: true,
        autoCenter: false,
        itemSizesReference: "positions",
        defaultNodeType: "pictogram",
        defaultEdgeType: "straight",
        stagePadding: 75,
        minCameraRatio: 0.2,
        //maxCameraRatio: 5,
        defaultCameraRatio: 1,
        labelDensity: 0.07,
        labelGridCellSize: 60,
        labelRenderedSizeThreshold: 6,
        nodeProgramClasses: {
          pictogram: NodeProgram,
        },
        edgeProgramClasses: {
          straightWithArrow: EdgeArrowProgram,
          straight: EdgeRectangleProgram,
          curved: EdgeCurveProgram,
          curvedWithArrow: EdgeCurvedArrowProgram,
        },
        enableEdgeEvents: true,
        renderEdgeLabels: true,
        defaultDrawNodeLabel: drawDiscCustomNodeLabel,
        defaultDrawNodeHover: drawDiscCustomNodeHover,
      } as Partial<Settings>;

      const sigma = new Sigma(graph, container, settings);

      const setBBox = () => {
        sigma.setCustomBBox({
          x: [0, sigma.getContainer().clientWidth],
          y: [0, sigma.getContainer().clientHeight],
        });
      };

      // Initialize coordinates for empty chart by temporarily adding and removing a node
      const initializeEmptyChart = () => {
        // Get container dimensions
        const width = sigma.getContainer().clientWidth;
        const height = sigma.getContainer().clientHeight;

        // Only initialize if graph is empty
        if (graph.order === 0) {
          // Convert viewport coordinates to graph coordinates
          const pos = sigma.viewportToGraph({ x: width / 2, y: height / 2 });

          // Add a temporary node at the center to initialize coordinates
          graph.addNode(TEMP_INIT_NODE_ID, {
            x: pos.x,
            y: pos.y,
            size: 1,
            color: "#ffffff",
          });

          // Center the camera
          const camera = sigma.getCamera();
          camera.setState({
            x: pos.x,
            y: pos.y,
            ratio: 1,
            angle: 0,
          });

          // Refresh once to ensure coordinates are established
          sigma.refresh();

          // Remove the temporary node immediately
          graph.dropNode(TEMP_INIT_NODE_ID);
        }

        // Set custom bounding box
        setBBox();
      };

      // Initialize empty chart on startup
      initializeEmptyChart();

      // Handle resize events
      sigma.on("resize", setBBox);

      // Ignore all doubleClicks for now
      sigma.on("doubleClickNode", (e) => e.preventSigmaDefault());
      sigma.on("doubleClickEdge", (e) => e.preventSigmaDefault());
      sigma.on("doubleClickStage", (e) => e.preventSigmaDefault());

      return sigma;
    },
    [graph]
  );

  useEffect(() => {
    if (container.current == null) {
      return;
    }

    const sigma = createSigma(container.current!);
    setSigma(sigma);

    return () => {
      sigma.kill();
    };
  }, [container, createSigma, setSigma]);

  useRightMousePan(sigma);
  useMultiselect(sigma);
  useDragNodes(sigma);
  useNodeHighlight(sigma);

  useKeyDown(
    () => {
      setSelected([...Object.keys(entities), ...Object.keys(links)]);
    },
    container,
    ["KeyA"],
    true
  );

  const dropRef = useEntityDrop(sigma, container);

  return { sigma, container, dropRef };
};

export default useSigma;
