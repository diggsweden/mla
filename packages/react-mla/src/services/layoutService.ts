// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import ForceSupervisor from "graphology-layout-force/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import NoverlapLayout from "graphology-layout-noverlap/worker";
import circlepack from "graphology-layout/circlepack";
import Sigma from "sigma";
import { PlainObject } from "sigma/types";
import { animateNodes } from "sigma/utils";
import useMainStore from "../store/main-store";
import { hierarchy } from "../utils/hierarchical-layout";
import chartService from "./chartService";

// Type for the callback function when animations are canceled
export type CancelAnimationCallback = () => void;

/**
 * Layout Service for handling graph layouts in MLA
 */
class LayoutService {
  private activeLayouts: Map<string, CancelAnimationCallback> = new Map();

  /**
   * Stops any active layout animation for the given key
   * @param key Identifier for the layout animation
   */
  stopAnimation(key: string): void {
    const cancelCallback = this.activeLayouts.get(key);
    if (cancelCallback) {
      cancelCallback();
      this.activeLayouts.delete(key);
    }
  }

  /**
   * Sets a random layout for the graph
   */
  applyRandomLayout(graph: Graph, sigma: Sigma | undefined): CancelAnimationCallback | null {
    if (!graph || !sigma) return null;

    // Calculate the extents of the current graph to maintain roughly the same area
    const xExtents = { min: 0, max: 0 };
    const yExtents = { min: 0, max: 0 };
    graph.forEachNode((_node, attributes) => {
      xExtents.min = Math.min(attributes.x, xExtents.min);
      xExtents.max = Math.max(attributes.x, xExtents.max);
      yExtents.min = Math.min(attributes.y, yExtents.min);
      yExtents.max = Math.max(attributes.y, yExtents.max);
    });

    // Create random positions for each node within the extents
    const randomPositions: PlainObject<PlainObject<number>> = {};
    graph.forEachNode((node) => {
      randomPositions[node] = {
        x: Math.random() * (xExtents.max - xExtents.min),
        y: Math.random() * (yExtents.max - yExtents.min),
      };
    });

    // Animate to new positions and store the cancel callback
    const cancelAnimation = animateNodes(graph, randomPositions, { duration: 2000 }, () => {
      this.storePositions();
      this.fitToView(sigma, graph);
    });

    return cancelAnimation;
  }

  /**
   * Sets a circle layout for the graph using community detection
   */
  applyCircleLayout(graph: Graph, sigma: Sigma | undefined): CancelAnimationCallback | null {
    if (!graph || !sigma) return null;

    // To directly assign communities as a node attribute
    louvain.assign(graph);

    const scale = graph.nodes().length * 1;
    const positions = circlepack(graph, {
      scale: scale,
      hierarchyAttributes: ["community"],
    });

    const cancelAnimation = animateNodes(graph, positions, { duration: 2000 }, () => {
      this.storePositions();
      this.fitToView(sigma, graph);
    });

    return cancelAnimation;
  }

  /**
   * Toggles no-overlap layout on or off
   */
  toggleNoOverlap(graph: Graph, sigma: Sigma | undefined, isActive: boolean): CancelAnimationCallback | null {
    if (!graph || !sigma) return null;

    if (isActive) {
      // Turn off no-overlap layout
      graph.forEachNode((n) => {
        graph.updateNodeAttribute(n, "fixed", () => true);
      });
      this.storePositions();
      this.fitToView(sigma, graph);
      return null;
    } else {
      // Turn on no-overlap layout
      const margin = graph.nodes().length * 20;
      const noOverlapLayout = new NoverlapLayout(graph, {
        settings: {
          gridSize: 80,
          margin: margin,
          speed: 1,
        },
      });

      graph.forEachNode((n) => {
        graph.removeNodeAttribute(n, "fixed");
      });

      const cancelCallback = () => {
        noOverlapLayout.kill();
      };

      noOverlapLayout.start();
      return cancelCallback;
    }
  }

  /**
   * Toggles force layout on or off
   */
  toggleForceLayout(graph: Graph, sigma: Sigma | undefined, isActive: boolean): CancelAnimationCallback | null {
    if (!graph || !sigma) return null;

    if (isActive) {
      // Turn off force layout
      graph.forEachNode((n) => {
        graph.updateNodeAttribute(n, "fixed", () => true);
      });
      this.storePositions();
      this.fitToView(sigma, graph);
      return null;
    } else {
      // Turn on force layout
      graph.forEachNode((n) => {
        graph.removeNodeAttribute(n, "fixed");
      });

      const forceLayoutSupervisor = new ForceSupervisor(graph, {
        settings: {
          attraction: 0.0005,
          repulsion: 10,
          gravity: 0.0001,
          inertia: 0.6,
          maxMove: 200,
        },
      });

      const cancelCallback = () => {
        forceLayoutSupervisor.kill();
      };

      forceLayoutSupervisor.start();
      return cancelCallback;
    }
  }

  /**
   * Toggles Force Atlas 2 layout on or off
   */
  toggleForceAtlas2Layout(graph: Graph, sigma: Sigma | undefined, isActive: boolean): CancelAnimationCallback | null {
    if (!graph || !sigma) return null;

    if (isActive) {
      // Turn off force atlas 2 layout
      graph.forEachNode((n) => {
        graph.updateNodeAttribute(n, "fixed", () => true);
      });
      this.storePositions();
      this.fitToView(sigma, graph);
      return null;
    } else {
      // Turn on force atlas 2 layout
      const sensibleSettings = forceAtlas2.inferSettings(graph);
      const fa2Layout = new FA2Layout(graph, {
        settings: {
          ...sensibleSettings,
          gravity: 0.025,
          scalingRatio: 400,
          adjustSizes: true,
        },
      });

      graph.forEachNode((n) => {
        graph.removeNodeAttribute(n, "fixed");
      });

      const cancelCallback = () => {
        fa2Layout.kill();
      };

      fa2Layout.start();
      return cancelCallback;
    }
  }

  /**
   * Sets a hierarchical tree layout for the graph
   */
  applyTreeLayout(graph: Graph, sigma: Sigma | undefined): CancelAnimationCallback | null {
    if (!graph || !sigma || graph.nodes().length === 0) return null;

    // Find a good root node - either pick the node with most connections or the first node
    let rootNode = graph.nodes()[0];
    let maxConnections = 0;

    graph.forEachNode((node) => {
      const connections = graph.neighbors(node).length;
      if (connections > maxConnections) {
        maxConnections = connections;
        rootNode = node;
      }
    });

    // Assign weight 1 to all edges to treat them equally
    graph.forEachEdge((edge) => {
      graph.setEdgeAttribute(edge, "weight", 1);
    });

    try {
      // Apply hierarchical layout with the selected root node
      const positions = hierarchy(graph, {
        root: rootNode,
        mode: "tree",
        easing: true,
        scale: graph.nodes().length * 10,
      });

      // Animate nodes to their new positions
      const cancelAnimation = animateNodes(graph, positions, { duration: 2000 }, () => {
        this.storePositions();
        this.fitToView(sigma, graph);
      });

      return cancelAnimation;
    } catch (error) {
      console.error("Failed to apply hierarchical layout:", error);
      return null;
    }
  }

  /**
   * Sets a hierarchical tree layout with a specific root node
   */
  applyTreeLayoutWithRoot(graph: Graph, sigma: Sigma | undefined, rootNode: string): CancelAnimationCallback | null {
    if (!graph || !sigma || !graph.hasNode(rootNode)) return null;

    // Assign weight 1 to all edges to treat them equally
    graph.forEachEdge((edge) => {
      graph.setEdgeAttribute(edge, "weight", 1);
    });

    try {
      // Apply hierarchical layout with the specified root node
      const positions = hierarchy(graph, {
        root: rootNode,
        mode: "tree",
        easing: true,
        scale: graph.nodes().length * 20,
        levelDistance: 150,
        nodeDistance: 100,
      });

      // Animate nodes to their new positions
      const cancelAnimation = animateNodes(graph, positions, { duration: 2000 }, () => {
        this.storePositions();
        this.fitToView(sigma, graph);
      });

      return cancelAnimation;
    } catch (error) {
      console.error("Failed to apply hierarchical layout with root:", error);
      return null;
    }
  }

  /**
   * Fits the graph to the viewport
   */
  fitToView(sigma: Sigma, graph: Graph): void {
    if (sigma && graph && graph.nodes().length) {
      chartService.fitNodesInView(sigma, graph.nodes());
    }
  }

  /**
   * Stores the current positions of nodes in the graph to the store
   */
  storePositions(): void {
    useMainStore.getState().storePositions();
  }
}

// Create and export a singleton instance
const layoutService = new LayoutService();
export default layoutService;
