// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { IShape } from "../../../interfaces/data-models/shape";
import Sigma from "sigma";
import { ShapeConversionResult } from "./shared-types";

/**
 * Utility functions for detecting shapes and shape interactions
 */

/**
 * Check if a point is inside a shape
 */
export const isPointInShape = (screenX: number, screenY: number, shape: Omit<IShape, "inGraphCoordinates">): boolean => {
  if (shape.type === "line" && shape.linePoints) {
    return isPointNearLine(screenX, screenY, shape.linePoints);
  } else if (shape.type === "ellipse") {
    return isPointInEllipse(screenX, screenY, shape);
  } else {
    // For rectangles and text, check if within bounds
    return screenX >= shape.x && screenX <= shape.x + shape.width && screenY >= shape.y && screenY <= shape.y + shape.height;
  }
};

/**
 * Check if a point is near a line, with a tolerance
 */
export const isPointNearLine = (screenX: number, screenY: number, linePoints: { x1: number; y1: number; x2: number; y2: number }): boolean => {
  const dx = linePoints.x2 - linePoints.x1;
  const dy = linePoints.y2 - linePoints.y1;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Distance from click to line
  const crossProduct = (screenX - linePoints.x1) * dy - (screenY - linePoints.y1) * dx;
  const distance = Math.abs(crossProduct) / length;

  // Check if click is within bounding box of line
  const inBoundingBox = screenX >= Math.min(linePoints.x1, linePoints.x2) - 5 && screenX <= Math.max(linePoints.x1, linePoints.x2) + 5 && screenY >= Math.min(linePoints.y1, linePoints.y2) - 5 && screenY <= Math.max(linePoints.y1, linePoints.y2) + 5;

  // Using 10px tolerance
  return distance < 10 && inBoundingBox;
};

/**
 * Check if a point is inside an ellipse
 */
export const isPointInEllipse = (screenX: number, screenY: number, shape: Omit<IShape, "inGraphCoordinates">): boolean => {
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  const rx = Math.abs(shape.width / 2);
  const ry = Math.abs(shape.height / 2);

  if (rx > 0 && ry > 0) {
    const normalized = Math.pow(screenX - centerX, 2) / Math.pow(rx, 2) + Math.pow(screenY - centerY, 2) / Math.pow(ry, 2);
    return normalized <= 1;
  }
  return false;
};

/**
 * Get the first shape that contains the given point
 */
export const getShapeAtPoint = (screenX: number, screenY: number, shapes: IShape[], renderer: Sigma | undefined, convertToScreenCoordinates: (shape: IShape, renderer: Sigma) => ShapeConversionResult): IShape | null => {
  if (!renderer) return null;

  // Check each shape from top to bottom (reverse order in the array)
  for (let i = shapes.length - 1; i >= 0; i--) {
    const { screenShape, originalShape } = convertToScreenCoordinates(shapes[i], renderer);

    if (isPointInShape(screenX, screenY, screenShape)) {
      return originalShape; // Return the shape in graph coordinates
    }
  }

  return null; // No shape found at the given point
};

/**
 * Check if the mouse is over a resize handle of a shape
 */
export const checkForResizeHandle = (screenX: number, screenY: number, shapeId: string, shapes: IShape[], renderer: Sigma | undefined, convertToScreenCoordinates?: (shape: IShape, renderer: Sigma) => ShapeConversionResult): string | null => {
  if (!renderer) return null;

  const shape = shapes.find((s) => s.id === shapeId);
  if (!shape) return null;

  // If convertToScreenCoordinates is not provided, we assume the shape is already in screen coordinates
  let screenShape: Omit<IShape, "inGraphCoordinates">;
  if (convertToScreenCoordinates) {
    const result = convertToScreenCoordinates(shape, renderer);
    screenShape = result.screenShape;
  } else {
    screenShape = shape;
  }

  // Only lines don't have resize handles (text shapes should have them)
  if (screenShape.type !== "line") {
    const handleSize = 8;

    // Check each handle
    // Top-left
    if (screenX >= screenShape.x - handleSize / 2 && screenX <= screenShape.x + handleSize / 2 && screenY >= screenShape.y - handleSize / 2 && screenY <= screenShape.y + handleSize / 2) {
      return "tl";
    }

    // Top-right
    if (screenX >= screenShape.x + screenShape.width - handleSize / 2 && screenX <= screenShape.x + screenShape.width + handleSize / 2 && screenY >= screenShape.y - handleSize / 2 && screenY <= screenShape.y + handleSize / 2) {
      return "tr";
    }

    // Bottom-left
    if (screenX >= screenShape.x - handleSize / 2 && screenX <= screenShape.x + handleSize / 2 && screenY >= screenShape.y + screenShape.height - handleSize / 2 && screenY <= screenShape.y + screenShape.height + handleSize / 2) {
      return "bl";
    }

    // Bottom-right
    if (
      screenX >= screenShape.x + screenShape.width - handleSize / 2 &&
      screenX <= screenShape.x + screenShape.width + handleSize / 2 &&
      screenY >= screenShape.y + screenShape.height - handleSize / 2 &&
      screenY <= screenShape.y + screenShape.height + handleSize / 2
    ) {
      return "br";
    }
  }

  return null;
};

/**
 * Check if the mouse is over a Sigma node
 */
export const isMouseOverNode = (screenX: number, screenY: number, renderer: Sigma | undefined): boolean => {
  if (!renderer || !renderer.getGraph) {
    return false;
  }

  try {
    // Convert screen coordinates to sigma coordinates
    const sigmaCoords = renderer.viewportToGraph({ x: screenX, y: screenY });

    // Get nodes under the cursor
    const nodesUnderCursor = renderer
      .getGraph()
      .nodes()
      .filter((nodeId) => {
        const nodePosition = renderer.getNodeDisplayData(nodeId);
        if (!nodePosition) return false;

        // Check if mouse is within the node (considering node size)
        const nodeSize = nodePosition.size || 5;
        const dx = sigmaCoords.x - nodePosition.x;
        const dy = sigmaCoords.y - nodePosition.y;

        return dx * dx + dy * dy < nodeSize * nodeSize;
      });

    return nodesUnderCursor.length > 0;
  } catch (error) {
    console.error("Error checking if mouse is over node:", error);
    return false;
  }
};
