// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { freeze } from "immer";

import { getCameraStateToFitViewportToNodes } from "@sigma/utils";
import Sigma from "sigma";

export type FitToNodesOptions = {
  animate: boolean;
  zoomRatio: number;
  timeout?: number;
};
export const DEFAULT_FIT_TO_NODES_OPTIONS: FitToNodesOptions = {
  animate: true,
  zoomRatio: 0.05, // Further reduced zoom ratio to 5% for minimal zoom out
  timeout: undefined,
};

class ChartService {
  public async fitNodesInView(sigma: Sigma, nodes: string[], opts: Partial<FitToNodesOptions> = {}): Promise<void> {
    // If no nodes provided, fit all nodes
    const nodesToFit = nodes.length === 0 ? sigma.getGraph().nodes() : nodes;

    if (nodesToFit.length === 0) {
      return;
    }

    const { animate, timeout, zoomRatio } = {
      ...DEFAULT_FIT_TO_NODES_OPTIONS,
      ...opts,
    };

    const fit = async () => {
      const camera = sigma.getCamera();
      const newCameraState = getCameraStateToFitViewportToNodes(sigma, nodesToFit, {
        padding: 0.05, // Reduced padding for tighter fit
      });

      // Apply minimal margin to ensure nodes are just visible
      // Use a smaller multiplier for more precise zooming
      if (nodesToFit.length > 1) {
        // Only apply zoom ratio adjustment when multiple nodes are present
        newCameraState.ratio = newCameraState.ratio * (1 + zoomRatio);
      }

      if (animate) {
        await camera.animate(newCameraState);
      } else {
        camera.setState(newCameraState);
      }
    };

    if (timeout) {
      window.setTimeout(() => {
        fit();
      }, timeout);
    } else {
      fit();
    }
  }
}

const chartService = freeze(new ChartService());

export default chartService;
