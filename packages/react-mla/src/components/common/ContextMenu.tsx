// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import configService from "../../services/configurationService";
import layoutService from "../../services/layoutService";
import useAppStore from "../../store/app-store";
import useMainStore from "../../store/main-store";
import useSearchStore from "../../store/search-state";
import { filterEntityIntegrations, getId } from "../../utils/utils";
import Icon from "./Icon";
import Popover from "./Popover";

interface Props {
  show?: boolean;
  delete?: () => void;
  copy?: () => void;
  paste?: () => void;
}

export default function ContextMenu(props: Props) {
  const { t } = useTranslation();
  const contextmenuPosition = useAppStore((state) => state.contextmenuPosition);
  const hideContextMenu = useAppStore((state) => state.hideContextMenu);

  const geoFeature = useAppStore((state) => state.selectedGeoFeature);

  const selectedEntities = useMainStore((state) => state.selectedEntities);
  const selectedLinks = useMainStore((state) => state.selectedLinks);
  const entities = useMainStore((state) => state.entities);
  const setSelected = useMainStore((state) => state.setSelected);
  const setExploreTool = useSearchStore((state) => state.setExploreTool);
  const performExplore = useSearchStore((state) => state.explore);
  const graph = useMainStore((state) => state.graph);
  const sigma = useMainStore((state) => state.sigma);

  const tools = useMemo(() => {
    return configService.getSearchServices().filter((t) => t.Parameters.EntityTypes != null || t.Parameters.GeoData != null) ?? [];
  }, []);

  const availableTools = useMemo(() => {
    if (geoFeature == null) {
      const selectedTypes = selectedEntities.map((e) => e.TypeId);
      return filterEntityIntegrations(tools, selectedTypes);
    } else {
      return tools.filter((t) => t.Parameters.GeoData != null && geoFeature);
    }
  }, [geoFeature, selectedEntities, tools]);

  function explore(toolId: string) {
    setExploreTool(toolId);
    void performExplore();
  }

  function selectGeoFeature() {
    const result = [] as string[];

    if (geoFeature?.Bounds != null) {
      Object.values(entities).forEach((e) => {
        const entity = e[0];
        if (entity.Coordinates != null) {
          if (geoFeature.Bounds!.contains(entity.Coordinates)) {
            result.push(getId(entity));
          }
        }
      });
    }
    setSelected(result);
  }

  // Organize nodes in a hierarchical layout with the selected node as root
  function organizeHierarchy() {
    if (!sigma || selectedEntities.length === 0 || !graph) return;

    // Get the selected node that will be used as the root
    const rootId = getId(selectedEntities[0]);

    // Set the active layout state
    useMainStore.getState().setActiveLayout("tree-selected");

    // Delegate actual layout implementation to the layout service
    layoutService.applyTreeLayoutWithRoot(graph, sigma, rootId);

    hideContextMenu();
  }

  if (contextmenuPosition === undefined) {
    return null;
  }

  function hide(e: React.MouseEvent) {
    hideContextMenu();

    const event = new CustomEvent("contextMenuClick", {
      detail: {
        x: e.clientX,
        y: e.clientY,
        button: e.button,
      },
    });

    document.body.dispatchEvent(event);
  }

  return (
    <Popover menuClass="w-60" show={contextmenuPosition != null} x={contextmenuPosition.x} y={contextmenuPosition.y} hide={hide}>
      <>
        {geoFeature?.Point != null && (
          <>
            <span>
              {geoFeature.Point.lat}, {geoFeature.Point.lng}
            </span>
            <hr className="m-my-3 m-border-gray-300" />
          </>
        )}
        {availableTools.length > 0 && (
          <>
            <div className="m-flex m-py-1 m-px-2 m-rounded m-cursor-default">
              <div className="m-font-semibold">{t("fetch")}</div>
            </div>
            {availableTools.map((e) => (
              <button
                key={e.Id}
                className="m-flex m-items-center m-flex-nowrap enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 m-py-1 m-px-2 m-rounded m-cursor-pointer"
                onClick={() => {
                  explore(e.Id);
                  hideContextMenu();
                }}
              >
                <div className="m-flex m-justify-center m-items-center">
                  <span className="m-h-4 m-w-4 m-max-h-4 m-max-w-4 m-leading-4">
                    <Icon name={e.Icon} className="m-text-primary m-flex m-justify-center m-items-center m-h-4 m-w-4 m-" />
                  </span>
                </div>
                <div className="m-ml-1 m-whitespace-nowrap">{e.Name}</div>
              </button>
            ))}
            <hr className="m-my-3 m-border-gray-300" />
          </>
        )}
        {geoFeature?.Bounds && (
          <>
            <button
              className="m-flex hover:m-bg-gray-100 m-py-1 m-px-2 m-rounded m-cursor-pointer"
              onClick={() => {
                selectGeoFeature();
                hideContextMenu();
              }}
            >
              <span className="m-w-3 m-mr-2">
                <Icon name="select_all" />
              </span>
              <div>{t("select")}</div>
            </button>
            <hr className="m-my-3 m-border-gray-300" />
          </>
        )}
        <div className="m-flex m-py-1 m-px-2 m-rounded m-cursor-default">
          <div className="m-font-semibold">{t("edit")}</div>
        </div>
        <button
          className="m-flex m-items-center m-flex-nowrap enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 m-py-1 m-px-2 m-rounded m-cursor-pointer disabled:m-opacity-50 disabled:m-cursor-default"
          disabled={selectedEntities.length === 0 && selectedLinks.length === 0}
          onClick={() => {
            if (props.copy != null) {
              props.copy();
              hideContextMenu();
            }
          }}
        >
          <div className="m-flex m-justify-center m-items-center">
            <span className="m-h-4 m-w-4 m-max-h-4 m-max-w-4 m-leading-4">
              <Icon name="content_copy" className="m-text-primary m-flex m-justify-center m-items-center m-h-4 m-w-4 m-" />
            </span>
          </div>
          <div className="m-ml-1 m-whitespace-nowrap">{t("copy")}</div>
        </button>
        <button
          className="m-flex m-items-center m-flex-nowrap enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 m-py-1 m-px-2 m-rounded m-cursor-pointer disabled:m-opacity-50 disabled:m-cursor-default"
          onClick={() => {
            if (props.paste != null) {
              props.paste();
              hideContextMenu();
            }
          }}
        >
          <div className="m-flex m-justify-center m-items-center">
            <span className="m-h-4 m-w-4 m-max-h-4 m-max-w-4 m-leading-4">
              <Icon name="content_paste" className="m-text-primary m-flex m-justify-center m-items-center m-h-4 m-w-4 m-" />
            </span>
          </div>
          <div className="m-ml-1 m-whitespace-nowrap">{t("paste")}</div>
        </button>
        <button
          className="m-flex m-items-center m-flex-nowrap enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 m-py-1 m-px-2 m-rounded m-cursor-pointer disabled:m-opacity-50 disabled:m-cursor-default"
          disabled={selectedEntities.length === 0 && selectedLinks.length === 0}
          onClick={() => {
            if (props.delete != null) {
              props.delete();
              hideContextMenu();
            }
          }}
        >
          <div className="m-flex m-justify-center m-items-center">
            <span className="m-h-4 m-w-4 m-max-h-4 m-max-w-4 m-leading-4">
              <Icon name="delete_forever" className="m-text-primary m-flex m-justify-center m-items-center m-h-4 m-w-4 m-" />
            </span>
          </div>
          <div className="m-ml-1 m-whitespace-nowrap">{t("delete")}</div>
        </button>
        <hr className="m-my-3 m-border-gray-300" />

        <button
          className="m-flex m-items-center m-flex-nowrap enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 m-py-1 m-px-2 m-rounded m-cursor-pointer disabled:m-opacity-50 disabled:m-cursor-default"
          disabled={selectedEntities.length === 0}
          onClick={() => {
            organizeHierarchy();
            hideContextMenu();
          }}
        >
          <div className="m-flex m-justify-center m-items-center">
            <span className="m-h-4 m-w-4 m-max-h-4 m-max-w-4 m-leading-4">
              <Icon name="lan" className="m-text-primary m-flex m-justify-center m-items-center m-h-4 m-w-4 m-" />
            </span>
          </div>
          <div className="m-ml-1 m-whitespace-nowrap">{t("organizeHierarchy")}</div>
        </button>
      </>
    </Popover>
  );
}
