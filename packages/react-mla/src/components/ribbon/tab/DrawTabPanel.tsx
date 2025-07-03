// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from "react-i18next";

import { ShapeType } from "../../../interfaces/data-models/shape";
import viewService from "../../../services/viewService";
import useMainStore from "../../../store/main-store";
import RibbonMenuButtonGroup from "../RibbonMenuButtonGroup";
import RibbonMenuColorPickerButton from "../RibbonMenuColorPickerButton";
import RibbonMenuDivider from "../RibbonMenuDivider";
import RibbonMenuSection from "../RibbonMenuSection";
import RibbonShapeButton from "../RibbonShapeButton";

function DrawTabPanel() {
  const { t } = useTranslation();
  const config = viewService.getTheme();
  const drawingTool = useMainStore((state) => state.drawingTool);

  // Handle shape selection
  function selectShape(type: ShapeType) {
    if (drawingTool) {
      const sameType = drawingTool.activeShapeType === type;

      // If clicking the same button, toggle off drawing mode
      if (sameType) {
        drawingTool.setCurrentShape(null);
      } else {
        // Set new shape type
        drawingTool.setCurrentShape(type);
      }
    }
  }

  function setFontColor(color?: string) {
    if (drawingTool && drawingTool.hasSelection) {
      // Only modify text properties if color is provided
      if (color) {
        drawingTool.setTextProperties("", 16, color);
      }
    }
  }

  function setForeColor(color?: string) {
    if (drawingTool && drawingTool.hasSelection) {
      // Keep existing fill color, just update stroke
      drawingTool.setShapeColor(color || "black", "");
    }
  }

  function setFillColor(color?: string) {
    if (drawingTool && drawingTool.hasSelection) {
      // Keep existing stroke color, just update fill
      drawingTool.setShapeColor("", color || "transparent");
    }
  }

  return (
    <div className="m-flex m-text-center m-h-full m-p-1">
      <RibbonMenuSection title={t("shapes")}>
        <RibbonShapeButton shapeType="text" iconName="format_shapes" label={t("textbox")} draggable active={drawingTool?.activeShapeType === "text"} onClick={() => selectShape("text")} />
        <RibbonShapeButton shapeType="rectangle" iconName="rectangle" label={t("rectangle")} draggable active={drawingTool?.activeShapeType === "rectangle"} onClick={() => selectShape("rectangle")} />
        <RibbonShapeButton shapeType="ellipse" iconName="circle" label={t("ellipse")} draggable active={drawingTool?.activeShapeType === "ellipse"} onClick={() => selectShape("ellipse")} />
        <RibbonShapeButton shapeType="line" iconName="horizontal_rule" label={t("line")} draggable active={drawingTool?.activeShapeType === "line"} onClick={() => selectShape("line")} />
      </RibbonMenuSection>
      <RibbonMenuDivider />
      <RibbonMenuSection title={t("color")}>
        <RibbonMenuButtonGroup>
          <RibbonMenuColorPickerButton disabled={!drawingTool?.hasSelection} label={t("font color")} colors={config.CustomIconColorPicklist} onColorSelected={setFontColor} icon="format_color_text" />
          <RibbonMenuColorPickerButton disabled={!drawingTool?.hasSelection} label={t("line color")} colors={config.CustomIconColorPicklist} onColorSelected={setForeColor} icon="border_color" />
          <RibbonMenuColorPickerButton disabled={!drawingTool?.hasSelection} label={t("fill color")} colors={config.CustomContourColorPicklist} onColorSelected={setFillColor} icon="format_color_fill" />
        </RibbonMenuButtonGroup>
      </RibbonMenuSection>
      <RibbonMenuDivider />
    </div>
  );
}

export default DrawTabPanel;
