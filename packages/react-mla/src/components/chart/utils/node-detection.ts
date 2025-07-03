// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

/**
 * Checks if a node (entity) intersects with a rectangular selection area
 * @param entity - The entity object containing position data
 * @param startX - The start X coordinate of the selection rectangle
 * @param startY - The start Y coordinate of the selection rectangle
 * @param endX - The end X coordinate of the selection rectangle
 * @param endY - The end Y coordinate of the selection rectangle
 * @returns true if the node intersects with the rectangle, false otherwise
 */
export function isNodeIntersectingRect(entity: { PosX?: number; PosY?: number }, startX: number, startY: number, endX: number, endY: number): boolean {
  const order = (a: number, b: number) => {
    return b < a ? [b, a] : [a, b];
  };
  const [sX, eX] = order(startX, endX);
  const [sY, eY] = order(startY, endY);

  const nodePosition = {
    x: entity.PosX ?? 0,
    y: entity.PosY ?? 0,
  };

  return sX <= nodePosition.x && nodePosition.x <= eX && sY <= nodePosition.y && nodePosition.y <= eY;
}
