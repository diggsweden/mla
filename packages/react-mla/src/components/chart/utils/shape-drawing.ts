// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { IShape } from "../../../interfaces/data-models/shape";

/**
 * Utility functions for drawing shapes on a canvas
 */

/**
 * Draw a rectangle on the canvas
 */
export const drawRectangle = (ctx: CanvasRenderingContext2D, shape: Omit<IShape, "inGraphCoordinates">) => {
  ctx.beginPath();
  ctx.rect(shape.x, shape.y, shape.width, shape.height);
  ctx.fill();
  ctx.stroke();
};

/**
 * Draw an ellipse on the canvas
 */
export const drawEllipse = (ctx: CanvasRenderingContext2D, shape: Omit<IShape, "inGraphCoordinates">) => {
  ctx.beginPath();
  ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, Math.abs(shape.width / 2), Math.abs(shape.height / 2), 0, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
};

/**
 * Draw text on the canvas
 */
export const drawText = (ctx: CanvasRenderingContext2D, shape: Omit<IShape, "inGraphCoordinates">) => {
  ctx.font = `${shape.fontSize || 16}px Arial`;
  ctx.fillStyle = shape.fontColor || "#000000";
  ctx.textBaseline = "top";

  // First, clean the text by removing potential spaces before newlines
  const cleanText = shape.text || "";

  // Split text by newlines first, then process each line separately for word wrapping
  const lines = cleanText.split("\n");
  const lineHeight = (shape.fontSize || 16) * 1.2;
  let y = shape.y;

  for (const textLine of lines) {
    // Skip to next line if empty, but don't render anything
    if (textLine.trim() === "") {
      y += lineHeight;
      continue;
    }

    const words = textLine.split(" ");
    let line = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + (i < words.length - 1 ? " " : "");
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > shape.width && i > 0) {
        let text = line.trim();
        if (text == "") {
          text = " ";
        }

        ctx.fillText(text, shape.x, y);
        line = words[i] + " ";
        y += lineHeight;

        if (y + lineHeight > shape.y + shape.height) {
          break; // Stop rendering if text exceeds the box height
        }
      } else {
        line = testLine;
      }
    }

    if (line.trim() !== "" && y + lineHeight <= shape.y + shape.height) {
      ctx.fillText(line.trim(), shape.x, y);
    }

    y += lineHeight; // Move to next line after processing each original line
  }
};

/**
 * Draw a line on the canvas
 */
export const drawLine = (ctx: CanvasRenderingContext2D, shape: Omit<IShape, "inGraphCoordinates">) => {
  if (!shape.linePoints) return;

  ctx.beginPath();
  ctx.moveTo(shape.linePoints.x1, shape.linePoints.y1);
  ctx.lineTo(shape.linePoints.x2, shape.linePoints.y2);
  ctx.stroke();
};

/**
 * Draw a single shape based on its type
 */
export const drawShape = (ctx: CanvasRenderingContext2D, shape: Omit<IShape, "inGraphCoordinates">) => {
  ctx.strokeStyle = shape.strokeColor;
  ctx.fillStyle = shape.fillColor;
  ctx.lineWidth = 2;

  switch (shape.type) {
    case "rectangle":
      drawRectangle(ctx, shape);
      break;

    case "ellipse":
      drawEllipse(ctx, shape);
      break;

    case "text":
      drawText(ctx, shape);
      break;

    case "line":
      drawLine(ctx, shape);
      break;
  }
};

/**
 * Draw selection handles for a shape
 */
export const drawSelectionHandles = (ctx: CanvasRenderingContext2D, shape: Omit<IShape, "inGraphCoordinates">) => {
  ctx.strokeStyle = "#4e92ed";
  ctx.fillStyle = "rgba(151, 194, 252, 0.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4);
  ctx.setLineDash([]);

  const handleSize = 8;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#4e92ed";
  ctx.lineWidth = 1;

  // Top-left
  ctx.fillRect(shape.x - handleSize / 2, shape.y - handleSize / 2, handleSize, handleSize);
  ctx.strokeRect(shape.x - handleSize / 2, shape.y - handleSize / 2, handleSize, handleSize);

  // Top-right
  ctx.fillRect(shape.x + shape.width - handleSize / 2, shape.y - handleSize / 2, handleSize, handleSize);
  ctx.strokeRect(shape.x + shape.width - handleSize / 2, shape.y - handleSize / 2, handleSize, handleSize);

  // Bottom-left
  ctx.fillRect(shape.x - handleSize / 2, shape.y + shape.height - handleSize / 2, handleSize, handleSize);
  ctx.strokeRect(shape.x - handleSize / 2, shape.y + shape.height - handleSize / 2, handleSize, handleSize);

  // Bottom-right
  ctx.fillRect(shape.x + shape.width - handleSize / 2, shape.y + shape.height - handleSize / 2, handleSize, handleSize);
  ctx.strokeRect(shape.x + shape.width - handleSize / 2, shape.y + shape.height - handleSize / 2, handleSize, handleSize);
};

/**
 * Draw resize handles at the corners of a shape
 */
export const drawResizeHandles = (ctx: CanvasRenderingContext2D, shape: Omit<IShape, "inGraphCoordinates">) => {
  const handleSize = 8;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#4e92ed";
  ctx.lineWidth = 1;

  // Top-left
  ctx.fillRect(shape.x - handleSize / 2, shape.y - handleSize / 2, handleSize, handleSize);
  ctx.strokeRect(shape.x - handleSize / 2, shape.y - handleSize / 2, handleSize, handleSize);

  // Top-right
  ctx.fillRect(shape.x + shape.width - handleSize / 2, shape.y - handleSize / 2, handleSize, handleSize);
  ctx.strokeRect(shape.x + shape.width - handleSize / 2, shape.y - handleSize / 2, handleSize, handleSize);

  // Bottom-left
  ctx.fillRect(shape.x - handleSize / 2, shape.y + shape.height - handleSize / 2, handleSize, handleSize);
  ctx.strokeRect(shape.x - handleSize / 2, shape.y + shape.height - handleSize / 2, handleSize, handleSize);

  // Bottom-right
  ctx.fillRect(shape.x + shape.width - handleSize / 2, shape.y + shape.height - handleSize / 2, handleSize, handleSize);
  ctx.strokeRect(shape.x + shape.width - handleSize / 2, shape.y + shape.height - handleSize / 2, handleSize, handleSize);
};

/**
 * Draw resize handles for a line
 */
export const drawLineResizeHandles = (ctx: CanvasRenderingContext2D, linePoints: { x1: number; y1: number; x2: number; y2: number }) => {
  const handleSize = 8;
  const halfHandleSize = handleSize / 2;

  ctx.fillStyle = "#ffffff"; // White fill
  ctx.strokeStyle = "#4e92ed"; // Blue border
  ctx.lineWidth = 1;

  // Handle at start point (x1, y1)
  ctx.fillRect(linePoints.x1 - halfHandleSize, linePoints.y1 - halfHandleSize, handleSize, handleSize);
  ctx.strokeRect(linePoints.x1 - halfHandleSize, linePoints.y1 - halfHandleSize, handleSize, handleSize);

  // Handle at end point (x2, y2)
  ctx.fillRect(linePoints.x2 - halfHandleSize, linePoints.y2 - halfHandleSize, handleSize, handleSize);
  ctx.strokeRect(linePoints.x2 - halfHandleSize, linePoints.y2 - halfHandleSize, handleSize, handleSize);
};

/**
 * Draw an outline box around text shape (without resize handles)
 */
export const drawTextOutlineBox = (ctx: CanvasRenderingContext2D, shape: Omit<IShape, "inGraphCoordinates">) => {
  ctx.strokeStyle = "#4e92ed";
  ctx.fillStyle = "rgba(151, 194, 252, 0.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  ctx.strokeRect(shape.x - 2, shape.y - 2, shape.width + 4, shape.height + 4);
  ctx.setLineDash([]);
};
