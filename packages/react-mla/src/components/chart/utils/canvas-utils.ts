// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import Sigma from "sigma";
import { IShape } from "../../../interfaces/data-models/shape";
import { convertToScreenCoordinates } from "./coordinate-utils";
import { drawLineResizeHandles, drawResizeHandles, drawSelectionHandles, drawShape, drawTextOutlineBox } from "./shape-drawing";

/**
 * Draw all shapes on the canvas
 */
export const drawCanvas = (ctx: CanvasRenderingContext2D | null, canvas: HTMLCanvasElement | null, shapes: IShape[], selectedShapeIds: string[], tempShape: IShape | null, renderer: Sigma | undefined) => {
  if (!canvas || !ctx || !renderer) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw shapes
  shapes
    .filter((x) => x.id != tempShape?.id)
    .forEach((shape) => {
      const { screenShape } = convertToScreenCoordinates(shape, renderer);
      drawShape(ctx, screenShape); // Draw selection and resize handles if shape is selected
      const isSelected = selectedShapeIds.includes(shape.id);

      if (isSelected) {
        if (screenShape.type === "line" && screenShape.linePoints) {
          // For lines, resize handles are the same as selection handles
          drawLineResizeHandles(ctx, screenShape.linePoints);
        } else {
          // For other shapes, show both selection outline and resize handles
          drawSelectionHandles(ctx, screenShape);
          drawResizeHandles(ctx, screenShape);
        }
      }
    });

  // Draw temporary shape if it exists
  if (tempShape) {
    let shapeToDraw = tempShape;

    if (tempShape.inGraphCoordinates) {
      // Convert temporary shape to screen coordinates if it's in graph space
      const { screenShape } = convertToScreenCoordinates(tempShape, renderer);
      shapeToDraw = { ...screenShape, inGraphCoordinates: false };
    }

    // Temp shape is already in screen coordinates during drawing
    drawShape(ctx, shapeToDraw);

    // Show outline box for text shapes during drawing (without resize handles)
    if (shapeToDraw.type === "text") {
      drawTextOutlineBox(ctx, shapeToDraw);
    }
  }
};
