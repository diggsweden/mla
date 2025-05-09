// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import Sigma from "sigma";
import { IShape } from "../../../interfaces/data-models/shape";
import { convertToScreenCoordinates } from "./coordinate-utils";
import { drawSelectionHandles, drawShape, drawTextOutlineBox } from "./shape-drawing";

/**
 * Utility functions for canvas operations
 */

/**
 * Draw all shapes on the canvas
 */
export const drawCanvas = (ctx: CanvasRenderingContext2D | null, canvas: HTMLCanvasElement | null, shapes: IShape[], selectedShapeId: string | null, tempShape: IShape | null, renderer: Sigma | undefined) => {
  if (!canvas || !ctx || !renderer) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw shapes
  shapes.forEach((shape) => {
    const { screenShape } = convertToScreenCoordinates(shape, renderer);
    drawShape(ctx, screenShape);

    // Draw selection indicators if shape is selected
    if (selectedShapeId === shape.id) {
      drawSelectionHandles(ctx, screenShape);
    }
  });

  // Draw temporary shape if it exists
  if (tempShape) {
    // Temp shape is already in screen coordinates during drawing
    drawShape(ctx, tempShape);

    // Show outline box for text shapes during drawing (without resize handles)
    if (tempShape.type === "text") {
      drawTextOutlineBox(ctx, tempShape);
    }
  }
};

/**
 * Redraw canvas with a shape updated at a specific index
 */
export const redrawCanvasWithUpdatedShapeAtIndex = (ctx: CanvasRenderingContext2D | null, canvas: HTMLCanvasElement | null, shapeIndex: number, updatedShape: IShape, shapes: IShape[], selectedShapeId: string | null, renderer: Sigma | undefined) => {
  if (!canvas || !ctx || !renderer) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw all shapes except the one being updated
  shapes.forEach((s, i) => {
    if (i !== shapeIndex) {
      const { screenShape } = convertToScreenCoordinates(s, renderer);
      drawShape(ctx, screenShape);

      if (selectedShapeId === s.id) {
        drawSelectionHandles(ctx, screenShape);
      }
    }
  });

  // Draw the updated shape
  const { screenShape } = convertToScreenCoordinates(updatedShape, renderer);
  drawShape(ctx, screenShape);

  if (selectedShapeId === updatedShape.id) {
    drawSelectionHandles(ctx, screenShape);
  }
};

/**
 * Redraw shape with new dimensions during resizing
 */
export const redrawShapeWithNewDimensions = (
  ctx: CanvasRenderingContext2D | null,
  canvas: HTMLCanvasElement | null,
  shapeIndex: number,
  newScreenX: number,
  newScreenY: number,
  newScreenWidth: number,
  newScreenHeight: number,
  shapes: IShape[],
  selectedShapeId: string | null,
  renderer: Sigma | undefined
) => {
  if (!canvas || !ctx || !renderer) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw all shapes except the one being resized
  shapes.forEach((s, i) => {
    if (i !== shapeIndex) {
      const { screenShape } = convertToScreenCoordinates(s, renderer);
      drawShape(ctx, screenShape);

      if (selectedShapeId === s.id) {
        drawSelectionHandles(ctx, screenShape);
      }
    }
  });

  // Draw the resized shape directly in screen coordinates
  const shape = shapes[shapeIndex];
  const { screenShape } = convertToScreenCoordinates(shape, renderer);

  const resizedScreenShape = {
    ...screenShape,
    x: newScreenX,
    y: newScreenY,
    width: newScreenWidth,
    height: newScreenHeight,
  };

  drawShape(ctx, resizedScreenShape);
  drawSelectionHandles(ctx, resizedScreenShape);
};

/**
 * Redraw canvas with an updated temporary shape
 */
export const redrawCanvasWithUpdatedShape = (ctx: CanvasRenderingContext2D | null, canvas: HTMLCanvasElement | null, updatedShape: Omit<IShape, "inGraphCoordinates">, shapes: IShape[], selectedShapeId: string | null, renderer: Sigma | undefined) => {
  if (!canvas || !ctx || !renderer) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw all other shapes first
  shapes.forEach((shape) => {
    const { screenShape } = convertToScreenCoordinates(shape, renderer);
    drawShape(ctx, screenShape);

    if (selectedShapeId === shape.id) {
      drawSelectionHandles(ctx, screenShape);
    }
  });

  // Draw the updated shape
  drawShape(ctx, updatedShape);

  // Show outline box for text shapes during drawing (without resize handles)
  if (updatedShape.type === "text" && updatedShape.id.startsWith("temp-")) {
    drawTextOutlineBox(ctx, updatedShape);
  }
};
