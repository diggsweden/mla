// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from "react-i18next";

import { ShapeType } from "../../../interfaces/data-models/shape";
import viewService from "../../../services/viewService";
import useMainStore from "../../../store/main-store";
import RibbonMenuButton from "../RibbonMenuButton";
import RibbonMenuButtonGroup from "../RibbonMenuButtonGroup";
import RibbonMenuColorPickerButton from "../RibbonMenuColorPickerButton";
import RibbonMenuDivider from "../RibbonMenuDivider";
import RibbonMenuSection from "../RibbonMenuSection";

function DrawTabPanel() {
  const { t } = useTranslation();
  const config = viewService.getTheme();
  const drawingTool = useMainStore((state) => state.drawingTool);

  // Handle shape selection
  function selectShape(type: ShapeType) {
    if (drawingTool) {
      const sameType = drawingTool.currentShapeType === type;

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
    if (drawingTool && drawingTool.selectedShape) {
      // Only modify text properties if color is provided
      if (color) {
        drawingTool.setTextProperties("", 16, color);
      }
    }
  }

  function setForeColor(color?: string) {
    if (drawingTool && drawingTool.selectedShape) {
      // Keep existing fill color, just update stroke
      drawingTool.setShapeColor(color || "black", "");
    }
  }

  function setFillColor(color?: string) {
    if (drawingTool && drawingTool.selectedShape) {
      // Keep existing stroke color, just update fill
      drawingTool.setShapeColor("", color || "transparent");
    }
  }

  function deleteSelected() {
    if (drawingTool && drawingTool.selectedShape) {
      drawingTool.deleteSelectedShape();
    }
  }

  return (
    <div className="m-flex m-text-center m-h-full m-p-1">
      <RibbonMenuSection title={t("text")}>
        <RibbonMenuButton label={t("textbox")} active={drawingTool?.currentShapeType === "text"} onClick={() => selectShape("text")} iconName="format_shapes" />
      </RibbonMenuSection>
      <RibbonMenuDivider />
      <RibbonMenuSection title={t("shapes")}>
        <RibbonMenuButton label={t("rectangle")} active={drawingTool?.currentShapeType === "rectangle"} onClick={() => selectShape("rectangle")} iconName="rectangle" />
        <RibbonMenuButton label={t("ellipse")} active={drawingTool?.currentShapeType === "ellipse"} onClick={() => selectShape("ellipse")} iconName="circle" />
        <RibbonMenuButton label={t("line")} active={drawingTool?.currentShapeType === "line"} onClick={() => selectShape("line")} iconName="horizontal_rule" />
      </RibbonMenuSection>
      <RibbonMenuDivider />
      <RibbonMenuSection title={t("color")}>
        <RibbonMenuButtonGroup>
          <RibbonMenuColorPickerButton disabled={!drawingTool?.selectedShape} label={t("font color")} colors={config.CustomIconColorPicklist} onColorSelected={setFontColor} icon="format_color_text" />
          <RibbonMenuColorPickerButton disabled={!drawingTool?.selectedShape} label={t("line color")} colors={config.CustomIconColorPicklist} onColorSelected={setForeColor} icon="border_color" />
          <RibbonMenuColorPickerButton disabled={!drawingTool?.selectedShape} label={t("fill color")} colors={config.CustomContourColorPicklist} onColorSelected={setFillColor} icon="format_color_fill" />
        </RibbonMenuButtonGroup>
      </RibbonMenuSection>
      <RibbonMenuDivider />
      <RibbonMenuSection title={t("edit")}>
        <RibbonMenuButton label={t("delete")} disabled={!drawingTool?.selectedShape} onClick={deleteSelected} iconName="delete" />
      </RibbonMenuSection>
    </div>
  );
}

export default DrawTabPanel;
