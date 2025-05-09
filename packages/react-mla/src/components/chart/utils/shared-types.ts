// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { IShape } from "../../../interfaces/data-models/shape";

export interface ShapeConversionResult {
  screenShape: Omit<IShape, "inGraphCoordinates">;
  originalShape: IShape;
}
