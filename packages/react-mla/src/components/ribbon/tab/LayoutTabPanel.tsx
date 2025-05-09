// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type ChangeEvent, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import configService from "../../../services/configurationService";
import layoutService, { CancelAnimationCallback } from "../../../services/layoutService";
import useAppStore from "../../../store/app-store";
import useMainStore from "../../../store/main-store";
import RibbonMenuButton from "../RibbonMenuButton";
import RibbonMenuDivider from "../RibbonMenuDivider";
import RibbonMenuSection from "../RibbonMenuSection";

function LayoutTabPanel() {
  const { t } = useTranslation();

  const cancelAnimation = useRef<CancelAnimationCallback | null>(null);
  const config = configService.getConfiguration();
  const graph = useMainStore((state) => state.graph);
  const sigma = useMainStore((state) => state.sigma);
  const view = useAppStore((state) => state.view);
  const setView = useAppStore((state) => state.setView);
  const activeLayout = useMainStore((state) => state.activeLayout);
  const setActiveLayout = useMainStore((state) => state.setActiveLayout);

  // Cancel any active layout animation when unmounting the component
  useEffect(() => {
    return () => {
      if (cancelAnimation.current) {
        cancelAnimation.current();
        cancelAnimation.current = null;
      }
    };
  }, []);

  function changeView(event: ChangeEvent<HTMLSelectElement>) {
    const viewId = event.target.value;
    setView(viewId);
  }

  // Simple handler functions that just set the layout state and delegate to the service

  function setRandomLayout() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    setActiveLayout("random");
    cancelAnimation.current = layoutService.applyRandomLayout(graph, sigma);
  }

  function setCircleLayout() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    setActiveLayout("circle");
    cancelAnimation.current = layoutService.applyCircleLayout(graph, sigma);
  }

  function toggleNoOverlap() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    const isNoOverlapActive = activeLayout === "na";
    setActiveLayout(isNoOverlapActive ? "reset" : "na");
    cancelAnimation.current = layoutService.toggleNoOverlap(graph, sigma, isNoOverlapActive);
  }

  function toggleForceLayout() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    const isForceLayoutActive = activeLayout === "fl";
    setActiveLayout(isForceLayoutActive ? "reset" : "fl");
    cancelAnimation.current = layoutService.toggleForceLayout(graph, sigma, isForceLayoutActive);
  }

  function toggleForceAtlas2Layout() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    const isForceAtlas2Active = activeLayout === "fa2";
    setActiveLayout(isForceAtlas2Active ? "reset" : "fa2");
    cancelAnimation.current = layoutService.toggleForceAtlas2Layout(graph, sigma, isForceAtlas2Active);
  }

  function setTreeLayout() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    setActiveLayout("tree");
    cancelAnimation.current = layoutService.applyTreeLayout(graph, sigma);
  }

  // UI rendering remains unchanged
  return (
    <div className="m-flex m-text-center m-h-full m-p-1">
      <RibbonMenuSection title={t("placement")}>
        <RibbonMenuButton
          label={t("random")}
          onClick={() => {
            setRandomLayout();
          }}
          iconName="outlined_casino"
        />
        <RibbonMenuButton
          label={t("circle")}
          onClick={() => {
            setCircleLayout();
          }}
          iconName="workspaces"
        />
        <RibbonMenuButton
          label={activeLayout === "na" ? t("stop") : t("no overlap")}
          onClick={() => {
            toggleNoOverlap();
          }}
          iconName="join"
          iconClassName={activeLayout === "na" ? "m-animate-spin" : ""}
        />
        <RibbonMenuButton
          label={activeLayout === "fl" ? t("stop") : t("dynamic 1")}
          onClick={() => {
            toggleForceLayout();
          }}
          iconName="hub"
          iconClassName={activeLayout === "fl" ? "m-animate-spin" : ""}
        />
        <RibbonMenuButton
          label={activeLayout === "fa2" ? t("stop") : t("dynamic 2")}
          onClick={() => {
            toggleForceAtlas2Layout();
          }}
          iconName="hub"
          iconClassName={activeLayout === "fa2" ? "m-animate-spin" : ""}
        />
        <RibbonMenuButton
          label={t("tree")}
          onClick={() => {
            setTreeLayout();
          }}
          iconName="lan"
        />
      </RibbonMenuSection>
      <RibbonMenuDivider />
      <RibbonMenuSection title={t("views")}>
        <select onChange={changeView} value={view} className="m-bg-white m-border m-border-gray-300 m-text-gray-900 m-rounded-lg focus:m-ring-blue-500 focus:m-border-blue-500 m-block m-w-full m-p-1">
          {config.Display.map((e) => (
            <option key={e.Id} value={e.Id}>
              {e.Name}
            </option>
          ))}
        </select>
      </RibbonMenuSection>
      <RibbonMenuDivider />
    </div>
  );
}

export default LayoutTabPanel;
