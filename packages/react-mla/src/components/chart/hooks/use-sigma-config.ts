// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useCallback } from "react";
import { EdgeArrowProgram, EdgeRectangleProgram, createNodeCompoundProgram } from "sigma/rendering";
import { Settings } from "sigma/settings";
import EdgeCurveProgram, { EdgeCurvedArrowProgram } from "@sigma/edge-curve";
import { createNodeBorderProgram } from "@sigma/node-border";
import configService from "../../../services/configurationService";
import { drawDiscCustomNodeHover, drawDiscCustomNodeLabel } from "../rendering/node-renderer";
import { createNodeSvgProgram } from "../rendering/svg-node-renderer";
import { TextureManager } from "../rendering/svg-node-renderer/texture";

export const useSigmaConfig = () => {
  const preloadImages = useCallback((manager: TextureManager) => {
    configService.getConfiguration().Display.forEach((c) => {
      c.Show.forEach((s) => {
        if (s.Icon) {
          manager.registerImage(s.Icon);
        }
      });
    });
  }, []);

  const createNodePrograms = useCallback(() => {
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

    return createNodeCompoundProgram([NodeBorderCustomProgram, NodePictogramCustomProgram]);
  }, [preloadImages]);

  const getSigmaSettings = useCallback(
    (NodeProgram: any): Partial<Settings> => ({
      zoomToSizeRatioFunction: (x) => x,
      allowInvalidContainer: true,
      autoRescale: false, // Prevent automatic rescaling when adding the first node
      autoCenter: false,
      itemSizesReference: "positions",
      defaultNodeType: "pictogram",
      defaultEdgeType: "straight",
      stagePadding: 75,
      minCameraRatio: 0.2,
      //maxCameraRatio: 5,
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
    }),
    []
  );

  return { createNodePrograms, getSigmaSettings };
};
