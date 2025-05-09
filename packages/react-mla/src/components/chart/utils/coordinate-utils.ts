// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { IShape } from "../../../interfaces/data-models/shape";
import Sigma from "sigma";
import { ShapeConversionResult } from "./shared-types";

/**
 * Utilities for converting between screen and graph coordinates
 */

/**
 * Convert shape from screen to graph coordinates
 */
export const convertToGraphCoordinates = (shape: IShape, renderer: Sigma): IShape => {
  // Skip if already in graph coordinates
  if (shape.inGraphCoordinates) {
    return shape;
  }

  // Convert screen coordinates to graph coordinates
  const graphPos = renderer.viewportToGraph({ x: shape.x, y: shape.y });

  // Calculate width and height in graph space
  // We need to convert a second point and calculate the difference
  const bottomRight = renderer.viewportToGraph({
    x: shape.x + shape.width,
    y: shape.y + shape.height,
  });

  const graphWidth = bottomRight.x - graphPos.x;
  const graphHeight = bottomRight.y - graphPos.y;

  let linePoints = shape.linePoints;
  if (linePoints) {
    const start = renderer.viewportToGraph({ x: linePoints.x1, y: linePoints.y1 });
    const end = renderer.viewportToGraph({ x: linePoints.x2, y: linePoints.y2 });
    linePoints = { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  }

  return {
    ...shape,
    x: graphPos.x,
    y: graphPos.y,
    width: graphWidth,
    height: graphHeight,
    linePoints,
    inGraphCoordinates: true,
  };
};

/**
 * Convert shape from graph to screen coordinates
 */
export const convertToScreenCoordinates = (shape: IShape, renderer: Sigma): ShapeConversionResult => {
  // If shape is already in screen coordinates, return as is
  if (!shape.inGraphCoordinates) {
    return {
      screenShape: { ...shape },
      originalShape: { ...shape, inGraphCoordinates: true },
    };
  }

  // Convert from graph to screen coordinates
  const screenPos = renderer.graphToViewport({ x: shape.x, y: shape.y });

  // Calculate width and height in screen space
  const bottomRight = renderer.graphToViewport({
    x: shape.x + shape.width,
    y: shape.y + shape.height,
  });

  const screenWidth = bottomRight.x - screenPos.x;
  const screenHeight = bottomRight.y - screenPos.y;

  let linePoints = shape.linePoints;
  if (linePoints) {
    const start = renderer.graphToViewport({ x: linePoints.x1, y: linePoints.y1 });
    const end = renderer.graphToViewport({ x: linePoints.x2, y: linePoints.y2 });
    linePoints = { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  }

  const screenShape = {
    ...shape,
    x: screenPos.x,
    y: screenPos.y,
    width: screenWidth,
    height: screenHeight,
    linePoints,
  };

  return { screenShape, originalShape: shape };
};

/**
 * Calculate new dimensions for a shape being resized
 */
export const calculateResizedDimensions = (screenX: number, screenY: number, screenShape: Omit<IShape, "inGraphCoordinates">, handle: string) => {
  // Store original corner positions that we need to keep fixed
  let fixedCornerX = 0;
  let fixedCornerY = 0;

  // Determine which corner should remain fixed
  switch (handle) {
    case "tl": // Top-left - bottom-right corner is fixed
      fixedCornerX = screenShape.x + screenShape.width;
      fixedCornerY = screenShape.y + screenShape.height;
      break;
    case "tr": // Top-right - bottom-left corner is fixed
      fixedCornerX = screenShape.x;
      fixedCornerY = screenShape.y + screenShape.height;
      break;
    case "bl": // Bottom-left - top-right corner is fixed
      fixedCornerX = screenShape.x + screenShape.width;
      fixedCornerY = screenShape.y;
      break;
    case "br": // Bottom-right - top-left corner is fixed
      fixedCornerX = screenShape.x;
      fixedCornerY = screenShape.y;
      break;
  }

  // Calculate new dimensions based on mouse position while keeping the opposite corner fixed
  let newScreenX = 0;
  let newScreenY = 0;
  let newScreenWidth = 0;
  let newScreenHeight = 0;

  switch (handle) {
    case "tl": // Top-left
      newScreenX = screenX;
      newScreenY = screenY;
      newScreenWidth = fixedCornerX - screenX;
      newScreenHeight = fixedCornerY - screenY;
      break;
    case "tr": // Top-right
      newScreenX = fixedCornerX;
      newScreenY = screenY;
      newScreenWidth = screenX - fixedCornerX;
      newScreenHeight = fixedCornerY - screenY;
      break;
    case "bl": // Bottom-left
      newScreenX = screenX;
      newScreenY = fixedCornerY;
      newScreenWidth = fixedCornerX - screenX;
      newScreenHeight = screenY - fixedCornerY;
      break;
    case "br": // Bottom-right
      newScreenX = fixedCornerX;
      newScreenY = fixedCornerY;
      newScreenWidth = screenX - fixedCornerX;
      newScreenHeight = screenY - fixedCornerY;
      break;
  }

  // Ensure minimum dimensions in screen space
  if (Math.abs(newScreenWidth) < 10) newScreenWidth = 10 * Math.sign(newScreenWidth);
  if (Math.abs(newScreenHeight) < 10) newScreenHeight = 10 * Math.sign(newScreenHeight);

  // Handle negative dimensions (when mouse crosses over the fixed point)
  if (newScreenWidth < 0) {
    newScreenX += newScreenWidth;
    newScreenWidth = Math.abs(newScreenWidth);
  }

  if (newScreenHeight < 0) {
    newScreenY += newScreenHeight;
    newScreenHeight = Math.abs(newScreenHeight);
  }

  return { newScreenX, newScreenY, newScreenWidth, newScreenHeight };
};
