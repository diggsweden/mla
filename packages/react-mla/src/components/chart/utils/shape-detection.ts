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

  let screenShape: Omit<IShape, "inGraphCoordinates">;
  if (convertToScreenCoordinates) {
    const result = convertToScreenCoordinates(shape, renderer);
    screenShape = result.screenShape;
  } else {
    screenShape = shape;
  }

  return checkShapeForResizeHandle(screenX, screenY, screenShape);
};

/**
 * Check if the mouse is over a resize handle of any selected shape and return both the handle and shape
 */
export const checkForResizeHandleInSelectedShapes = (
  screenX: number,
  screenY: number,
  selectedShapeIds: string[],
  shapes: IShape[],
  renderer: Sigma | undefined,
  convertToScreenCoordinates?: (shape: IShape, renderer: Sigma) => ShapeConversionResult
): { handle: string; shape: IShape } | null => {
  if (!renderer || selectedShapeIds.length === 0) return null;

  // Check all selected shapes for resize handles
  for (const shapeId of selectedShapeIds) {
    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) continue;

    let screenShape: Omit<IShape, "inGraphCoordinates">;
    if (convertToScreenCoordinates) {
      const result = convertToScreenCoordinates(shape, renderer);
      screenShape = result.screenShape;
    } else {
      screenShape = shape;
    }

    const handle = checkShapeForResizeHandle(screenX, screenY, screenShape);
    if (handle) {
      return { handle, shape };
    }
  }

  return null;
};

/**
 * Check if the mouse is over a resize handle of a specific shape (helper function)
 */
const checkShapeForResizeHandle = (screenX: number, screenY: number, screenShape: Omit<IShape, "inGraphCoordinates">): string | null => {
  const handleSize = 8; // Standard handle size

  if (screenShape.type === "line" && screenShape.linePoints) {
    const { x1, y1, x2, y2 } = screenShape.linePoints;

    // Check for handle at the start point of the line
    if (screenX >= x1 - handleSize / 2 && screenX <= x1 + handleSize / 2 && screenY >= y1 - handleSize / 2 && screenY <= y1 + handleSize / 2) {
      return "line-start";
    }

    // Check for handle at the end point of the line
    if (screenX >= x2 - handleSize / 2 && screenX <= x2 + handleSize / 2 && screenY >= y2 - handleSize / 2 && screenY <= y2 + handleSize / 2) {
      return "line-end";
    }
  } else if (screenShape.type !== "line") {
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
 * Check if a rectangle intersects with a line segment
 */
const isRectIntersectingLine = (rectX: number, rectY: number, rectWidth: number, rectHeight: number, lineX1: number, lineY1: number, lineX2: number, lineY2: number): boolean => {
  // Check if either endpoint is inside the rectangle
  if ((lineX1 >= rectX && lineX1 <= rectX + rectWidth && lineY1 >= rectY && lineY1 <= rectY + rectHeight) || (lineX2 >= rectX && lineX2 <= rectX + rectWidth && lineY2 >= rectY && lineY2 <= rectY + rectHeight)) {
    return true;
  }

  // Check if the line intersects any of the rectangle's edges
  const lineIntersectsSegment = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean => {
    const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denominator === 0) {
      return false;
    }

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  };

  // Check intersection with each edge of the rectangle
  return (
    // Top edge
    lineIntersectsSegment(lineX1, lineY1, lineX2, lineY2, rectX, rectY, rectX + rectWidth, rectY) ||
    // Right edge
    lineIntersectsSegment(lineX1, lineY1, lineX2, lineY2, rectX + rectWidth, rectY, rectX + rectWidth, rectY + rectHeight) ||
    // Bottom edge
    lineIntersectsSegment(lineX1, lineY1, lineX2, lineY2, rectX, rectY + rectHeight, rectX + rectWidth, rectY + rectHeight) ||
    // Left edge
    lineIntersectsSegment(lineX1, lineY1, lineX2, lineY2, rectX, rectY, rectX, rectY + rectHeight)
  );
};

/**
 * Check if an ellipse intersects with a rectangle
 * This is a simplified check that doesn't handle all possible cases,
 * but works well enough for typical user selections
 */
const isEllipseIntersectingRect = (ellipseX: number, ellipseY: number, ellipseWidth: number, ellipseHeight: number, rectX: number, rectY: number, rectWidth: number, rectHeight: number): boolean => {
  // Get ellipse center coordinates
  const centerX = ellipseX + ellipseWidth / 2;
  const centerY = ellipseY + ellipseHeight / 2;
  const rx = Math.abs(ellipseWidth / 2);
  const ry = Math.abs(ellipseHeight / 2);

  // Find closest point on rectangle to ellipse center
  const closestX = Math.max(rectX, Math.min(centerX, rectX + rectWidth));
  const closestY = Math.max(rectY, Math.min(centerY, rectY + rectHeight));

  // Check if closest point is inside the ellipse
  const dx = closestX - centerX;
  const dy = closestY - centerY;

  // Normalized distance equation for ellipse
  if (rx > 0 && ry > 0) {
    const normalized = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    return normalized <= 1;
  }

  return false;
};

/**
 * Check if a shape intersects with a selection rectangle
 */
export const isShapeIntersectingRect = (shape: Omit<IShape, "inGraphCoordinates">, selectionX1: number, selectionY1: number, selectionX2: number, selectionY2: number): boolean => {
  // Normalize the selection rectangle coordinates (ensure x1,y1 is top-left and x2,y2 is bottom-right)
  const [rectX, rectWidth] = selectionX1 <= selectionX2 ? [selectionX1, selectionX2 - selectionX1] : [selectionX2, selectionX1 - selectionX2];

  const [rectY, rectHeight] = selectionY1 <= selectionY2 ? [selectionY1, selectionY2 - selectionY1] : [selectionY2, selectionY1 - selectionY2];

  if (shape.type === "line" && shape.linePoints) {
    // Check if line intersects with the selection rectangle
    return isRectIntersectingLine(rectX, rectY, rectWidth, rectHeight, shape.linePoints.x1, shape.linePoints.y1, shape.linePoints.x2, shape.linePoints.y2);
  } else if (shape.type === "ellipse") {
    // Check if ellipse intersects with the selection rectangle
    return isEllipseIntersectingRect(shape.x, shape.y, shape.width, shape.height, rectX, rectY, rectWidth, rectHeight);
  } else {
    // For rectangles and text, check for intersection between two rectangles
    // Two rectangles intersect if they overlap in both x and y axes
    const shapeRight = shape.x + shape.width;
    const shapeBottom = shape.y + shape.height;
    const rectRight = rectX + rectWidth;
    const rectBottom = rectY + rectHeight;

    return !(
      (
        shapeRight < rectX || // Shape is completely to the left
        shape.x > rectRight || // Shape is completely to the right
        shapeBottom < rectY || // Shape is completely above
        shape.y > rectBottom
      ) // Shape is completely below
    );
  }
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
