// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { produce } from "immer";
import useMainStore from "../../../store/main-store";
import viewService from "../../../services/viewService";
import RibbonMenuSection from "../RibbonMenuSection";
import RibbonMenuDivider from "../RibbonMenuDivider";
import RibbonMenuButtonGroup from "../RibbonMenuButtonGroup";
import RibbonMenuIconButton from "../RibbonMenuIconButton";
import { type LinkDashStyle } from "../../../interfaces/data-models";
import { useTranslation } from "react-i18next";
import RibbonMenuColorPickerButton from "../RibbonMenuColorPickerButton";

function StyleTabPanel() {
  const { t } = useTranslation();
  const config = viewService.getTheme();
  const selection = useMainStore((state) => state.selectedNodeAndLinkIds);
  const selectedEntities = useMainStore((state) => state.selectedEntities);
  const selectedLinks = useMainStore((state) => state.selectedLinks);

  const updateEntity = useMainStore((state) => state.updateEntity);
  const updateLink = useMainStore((state) => state.updateLink);

  function setColor(color: string | undefined) {
    updateEntity(
      ...selectedEntities.map((e) =>
        produce(e, (draft) => {
          draft.Color = color;
        })
      )
    );
    updateLink(
      ...selectedLinks.map((e) =>
        produce(e, (draft) => {
          draft.Color = color;
        })
      )
    );
  }

  function setBorderColor(color: string | undefined) {
    updateEntity(
      ...selectedEntities.map((e) =>
        produce(e, (draft) => {
          draft.BorderColor = color;
        })
      )
    );
  }

  function setBackgroundColor(color: string | undefined) {
    updateEntity(
      ...selectedEntities.map((e) =>
        produce(e, (draft) => {
          draft.BackgroundColor = color;
        })
      )
    );
  }

  function setLinkStyle(style: LinkDashStyle | undefined) {
    updateLink(
      ...selectedLinks.map((e) =>
        produce(e, (draft) => {
          draft.Style = style;
        })
      )
    );
  }

  return (
    <div className="m-flex m-text-center m-h-full m-p-1">
      <RibbonMenuSection title={t("look feel")}>
        <RibbonMenuButtonGroup>
          <RibbonMenuColorPickerButton
            disabled={selection.length === 0}
            label={t("color")}
            colors={config.CustomIconColorPicklist}
            onColorSelected={(color) => {
              setColor(color);
            }}
            icon="outlined_border_color"
          ></RibbonMenuColorPickerButton>
          <RibbonMenuColorPickerButton
            disabled={selectedEntities.length === 0}
            label={t("outline")}
            colors={config.CustomContourColorPicklist}
            onColorSelected={(color) => {
              setBorderColor(color);
            }}
            icon="outlined_radio_button_unchecked"
          ></RibbonMenuColorPickerButton>
          <RibbonMenuColorPickerButton
            disabled={selectedEntities.length === 0}
            label={t("fill color")}
            colors={config.CustomContourColorPicklist}
            onColorSelected={(color) => {
              setBackgroundColor(color);
            }}
            icon="format_color_fill"
          ></RibbonMenuColorPickerButton>
        </RibbonMenuButtonGroup>
        <RibbonMenuButtonGroup>
          <RibbonMenuIconButton
            disabled={selectedLinks.length === 0}
            onClick={() => {
              setLinkStyle("LINE");
            }}
            label={t("line link")}
            icon="line_style"
          />
          <RibbonMenuIconButton
            disabled={selectedLinks.length === 0}
            onClick={() => {
              setLinkStyle("DASHED");
            }}
            label={t("dashed link")}
            icon="line_style"
          />
          <RibbonMenuIconButton
            disabled={selectedLinks.length === 0}
            onClick={() => {
              setLinkStyle("DOTTED");
            }}
            label={t("dotted link")}
            icon="line_style"
          />
        </RibbonMenuButtonGroup>
      </RibbonMenuSection>
      <RibbonMenuDivider />
    </div>
  );
}

export default StyleTabPanel;
