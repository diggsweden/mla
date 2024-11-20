import { Attributes } from 'graphology-types';
import { NodeDisplayData, PartialButFor } from 'sigma/types';
import { Settings } from "sigma/settings"; 

/**
 * Draw an hovered node.
 * - if there is no label => display a shadow on the node
 * - if the label box is bigger than node size => display a label box that contains the node with a shadow
 * - else node with shadow and the label box
 */
export function drawDiscNodeHover<
  N extends Attributes = Attributes,
  E extends Attributes = Attributes,
  G extends Attributes = Attributes,
>(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color">,
  settings: Settings<N, E, G>,
): void {
  const size = settings.labelSize,
    font = settings.labelFont,
    weight = settings.labelWeight;

  context.font = `${weight} ${size}px ${font}`;

  // Then we draw the label background
  context.fillStyle = "#FFF";
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 8;
  context.shadowColor = "#000";

  const PADDING = 2;

  if (typeof data.label === "string") {
    const textWidth = context.measureText(data.label).width,
      boxWidth = Math.round(textWidth + 5),
      boxHeight = Math.round(size + 2 * PADDING),
      radius = Math.max(data.size, size / 2) + PADDING;

    const yDeltaCoord = Math.sqrt(Math.abs(Math.pow(radius, 2) - Math.pow(boxHeight / 2, 2)));
    const angleRadian = Math.asin(yDeltaCoord / radius);
    const padding = boxHeight / 2;

    context.beginPath();
    context.moveTo(data.x + padding, data.y + yDeltaCoord);
    context.lineTo(data.x + boxWidth / 2 + padding, data.y + yDeltaCoord);
    context.lineTo(data.x + boxWidth / 2 + padding, data.y + boxHeight + padding + yDeltaCoord);
    context.lineTo(data.x - (boxWidth / 2 + padding), data.y + boxHeight + padding + yDeltaCoord);
    context.lineTo(data.x - (boxWidth / 2 + padding), data.y + yDeltaCoord);
    context.lineTo(data.x - padding, data.y + yDeltaCoord);
    context.arc(data.x, data.y, radius, Math.PI - angleRadian, (Math.PI * 2) + angleRadian);
    context.closePath();
    context.fill();
  } else {
    context.beginPath();
    context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }

  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;

  // And finally we draw the label
  drawDiscNodeLabel(context, data, settings);
}

export function drawDiscNodeLabel<
  N extends Attributes = Attributes,
  E extends Attributes = Attributes,
  G extends Attributes = Attributes,
>(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color">,
  settings: Settings<N, E, G>,
): void {
  if (!data.label) return;

  const textWidth = context.measureText(data.label).width,
    size = settings.labelSize,
    font = settings.labelFont,
    weight = settings.labelWeight,
    color = settings.labelColor.attribute
      ? data[settings.labelColor.attribute] || settings.labelColor.color || "#000"
      : settings.labelColor.color;

  context.fillStyle = color;
  context.font = `${weight} ${size}px ${font}`;

  context.fillText(data.label, data.x - (textWidth / 2), data.y + data.size + 20);
}

