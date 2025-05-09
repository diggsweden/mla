// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

// Shape types for our custom drawer
export type ShapeType = "rectangle" | "ellipse" | "text" | "line";

// Shape data structure - stored in graph coordinates
interface IShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  text?: string;
  fontSize?: number;
  fontColor?: string;
  linePoints?: { x1: number; y1: number; x2: number; y2: number };
  inGraphCoordinates: boolean; // Flag to indicate if coordinates are in graph space
}

export type { IShape };
