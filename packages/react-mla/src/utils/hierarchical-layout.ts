// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import Graph from "graphology";
import { PlainObject } from "sigma/types";

/**
 * Options for the hierarchical layout algorithm
 */
export interface HierarchicalLayoutOptions {
  /**
   * Root node for the hierarchy
   */
  root?: string;

  /**
   * Distance between levels in the hierarchy
   */
  levelDistance?: number;

  /**
   * Distance between nodes at the same level
   */
  nodeDistance?: number;

  /**
   * Scaling factor for the layout
   */
  scale?: number;

  /**
   * Direction of the hierarchy
   * 'TB' (top to bottom), 'BT' (bottom to top), 'LR' (left to right), 'RL' (right to left)
   */
  direction?: "TB" | "BT" | "LR" | "RL";

  /**
   * Layout mode
   */
  mode?: "tree" | "org";

  /**
   * Whether to apply easing to node positions to make the layout more balanced
   */
  easing?: boolean;
}

const DEFAULT_OPTIONS: HierarchicalLayoutOptions = {
  root: undefined,
  levelDistance: 100,
  nodeDistance: 100,
  scale: 100,
  direction: "TB",
  mode: "tree",
  easing: true,
};

/**
 * Build a hierarchical tree representation starting from the root node
 * Uses BFS (Breadth-First Search) to assign levels to nodes
 */
function buildHierarchyTree(
  graph: Graph,
  rootNode: string
): {
  hierarchyNodes: Map<string, { level: number; index: number }>;
  levelWidths: Record<number, number>;
} {
  const hierarchyNodes = new Map<string, { level: number; index: number }>();
  const levelWidths: Record<number, number> = { 0: 1 };

  // Queue for BFS traversal
  const queue: { node: string; level: number }[] = [{ node: rootNode, level: 0 }];
  hierarchyNodes.set(rootNode, { level: 0, index: 0 });

  // Keep track of visited nodes to avoid cycles
  const visited = new Set<string>([rootNode]);

  // Process the queue until empty
  while (queue.length > 0) {
    const { node, level } = queue.shift()!;

    // Process all neighbors that haven't been visited
    const neighbors = graph.neighbors(node).filter((n) => !visited.has(n));

    // Initialize next level if not already done
    if (levelWidths[level + 1] === undefined) {
      levelWidths[level + 1] = 0;
    }

    // Assign positions to neighbors at the next level
    for (const neighbor of neighbors) {
      visited.add(neighbor);
      const index = levelWidths[level + 1]++;
      hierarchyNodes.set(neighbor, { level: level + 1, index });
      queue.push({ node: neighbor, level: level + 1 });
    }
  }

  return { hierarchyNodes, levelWidths };
}

/**
 * Organize nodes hierarchically with the specified root at the top
 */
export function hierarchy(graph: Graph, options: HierarchicalLayoutOptions = {}): PlainObject<PlainObject<number>> {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Initialize result object for node positions
  const positions: PlainObject<PlainObject<number>> = {};

  // If no nodes exist, return empty positions
  if (graph.order === 0) {
    return positions;
  }

  // If no root node specified, find the best one
  const rootNode = opts.root || findBestRootNode(graph);

  // Check if root node exists in graph
  if (!graph.hasNode(rootNode)) {
    throw new Error(`Root node "${rootNode}" does not exist in graph`);
  }

  // Store existing positions for nodes that are not part of the new hierarchy
  const existingNodesMap = new Map<string, { x: number; y: number }>();

  // Build the hierarchical tree representation
  const { hierarchyNodes, levelWidths } = buildHierarchyTree(graph, rootNode);

  // Identify nodes that are NOT part of the hierarchy
  graph.forEachNode((node) => {
    if (!hierarchyNodes.has(node)) {
      existingNodesMap.set(node, {
        x: graph.getNodeAttribute(node, "x"),
        y: graph.getNodeAttribute(node, "y"),
      });
    }
  });

  // Calculate actual positions based on hierarchy
  const { levelDistance, nodeDistance, scale, direction } = opts;

  // Process all nodes in the graph
  graph.forEachNode((node) => {
    // If node is part of the hierarchy
    if (hierarchyNodes.has(node)) {
      const { level, index } = hierarchyNodes.get(node)!;
      const levelWidth = levelWidths[level];
      const totalWidth = (levelWidth - 1) * nodeDistance!;
      const startX = -totalWidth / 2;

      let x: number, y: number;

      switch (direction) {
        case "TB": // Top to Bottom (root at top)
          x = startX + index * nodeDistance!;
          y = -level * levelDistance!;
          break;
        case "BT": // Bottom to Top (root at bottom)
          x = startX + index * nodeDistance!;
          y = level * levelDistance!;
          break;
        case "LR": // Left to Right (root at left)
          x = level * levelDistance!;
          y = startX + index * nodeDistance!;
          break;
        case "RL": // Right to Left (root at right)
          x = -level * levelDistance!;
          y = startX + index * nodeDistance!;
          break;
        default:
          x = startX + index * nodeDistance!;
          y = level * levelDistance!;
      }

      // Apply scaling
      x = x * (scale! / 100);
      y = y * (scale! / 100);

      // Store calculated position
      positions[node] = { x, y };
    }
    // For nodes not in the hierarchy, leave them at their current position
    else {
      positions[node] = {
        x: graph.getNodeAttribute(node, "x"),
        y: graph.getNodeAttribute(node, "y"),
      };
    }
  });

  // Apply easing to make the layout more balanced
  if (opts.easing) {
    balancePositions(graph, positions, hierarchyNodes);
  }

  // If using a specified root node (not auto-detected), check for overlaps
  if (opts.root && existingNodesMap.size > 0) {
    // Convert existing nodes to format for bounding box calculation
    const existingNodes: Record<string, { x: number; y: number }> = {};
    existingNodesMap.forEach((pos, node) => {
      existingNodes[node] = pos;
    });

    // Convert hierarchy nodes to format for bounding box calculation
    const hierarchyNodesObj: Record<string, { x: number; y: number }> = {};
    hierarchyNodes.forEach((_, node) => {
      if (positions[node]) {
        hierarchyNodesObj[node] = {
          x: positions[node].x,
          y: positions[node].y,
        };
      }
    });

    // Check if there are overlaps and find offset
    const minDistance = Math.max(levelDistance!, nodeDistance!) * 1.2;
    const offset = calculateOffsetForOverlaps(hierarchyNodesObj, existingNodes, minDistance);

    // Apply offset to all nodes in the hierarchy
    if (offset.x !== 0 || offset.y !== 0) {
      Object.keys(positions).forEach((node) => {
        if (hierarchyNodes.has(node)) {
          positions[node].x += offset.x;
          positions[node].y += offset.y;
        }
      });
    }
  }

  return positions;
}

/**
 * Calculate an offset to prevent overlaps between hierarchies, moving in the closest direction
 */
function calculateOffsetForOverlaps(hierarchyNodes: Record<string, { x: number; y: number }>, existingNodes: Record<string, { x: number; y: number }>, minDistance: number): { x: number; y: number } {
  // If either set is empty, no offset needed
  if (Object.keys(hierarchyNodes).length === 0 || Object.keys(existingNodes).length === 0) {
    return { x: 0, y: 0 };
  }

  // Calculate bounding boxes
  const hierarchyBounds = getBoundingBox(hierarchyNodes);
  const existingBounds = getBoundingBox(existingNodes);

  // Check if there's overlap between the bounding boxes
  const overlapX = hierarchyBounds.maxX >= existingBounds.minX && hierarchyBounds.minX <= existingBounds.maxX;
  const overlapY = hierarchyBounds.maxY >= existingBounds.minY && hierarchyBounds.minY <= existingBounds.maxY;

  // If no overlap in both dimensions, no adjustment needed
  if (!overlapX || !overlapY) {
    return { x: 0, y: 0 };
  }

  // Calculate distances to move in each direction to resolve overlap
  const moveRight = existingBounds.maxX - hierarchyBounds.minX + minDistance;
  const moveLeft = existingBounds.minX - hierarchyBounds.maxX - minDistance;

  // Determine which horizontal direction requires less movement (using absolute values)
  const xOffset = Math.abs(moveRight) < Math.abs(moveLeft) ? moveRight : moveLeft;

  // Center vertically (optional - can be removed if not desired)
  const yOffset = (existingBounds.maxY + existingBounds.minY) / 2 - (hierarchyBounds.maxY + hierarchyBounds.minY) / 2;

  return { x: xOffset, y: yOffset };
}

/**
 * Calculate the bounding box of a set of nodes
 */
function getBoundingBox(positions: Record<string, { x: number; y: number }>): { minX: number; maxX: number; minY: number; maxY: number } {
  const nodes = Object.keys(positions);
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const pos = positions[node];
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
  });

  return { minX, maxX, minY, maxY };
}

/**
 * Find the best candidate for root node
 * (node with highest connection count or first node if tie)
 */
function findBestRootNode(graph: Graph): string {
  let bestNode = graph.nodes()[0];
  let maxConnections = 0;

  graph.forEachNode((node) => {
    const connections = graph.neighbors(node).length;
    if (connections > maxConnections) {
      maxConnections = connections;
      bestNode = node;
    }
  });

  return bestNode;
}

/**
 * Balance node positions to reduce overlaps and create a more visually appealing layout
 */
function balancePositions(graph: Graph, positions: PlainObject<PlainObject<number>>, hierarchyNodes: Map<string, { level: number; index: number }>): void {
  // Create a map of nodes that have the same y-coordinate (same level)
  const levelMap: Record<number, string[]> = {};

  // Group nodes by their y-coordinate (level)
  hierarchyNodes.forEach((data, node) => {
    const level = data.level;
    if (!levelMap[level]) {
      levelMap[level] = [];
    }
    levelMap[level].push(node);
  });

  // For each level, adjust x positions to avoid overlapping
  Object.keys(levelMap).forEach((levelStr) => {
    const level = parseInt(levelStr);
    const nodesInLevel = levelMap[level];

    if (nodesInLevel.length <= 1) return;

    // Sort nodes by current x position
    nodesInLevel.sort((a, b) => positions[a].x - positions[b].x);

    // Compute ideal spacing between nodes
    const spacing = 100;
    const totalWidth = (nodesInLevel.length - 1) * spacing;
    const startX = -totalWidth / 2;

    // Assign new x positions to maintain even spacing
    nodesInLevel.forEach((node, i) => {
      positions[node].x = startX + i * spacing;
    });
  });
}
