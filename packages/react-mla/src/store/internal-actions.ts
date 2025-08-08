// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

/* eslint-disable @typescript-eslint/no-unused-vars */

import Graph from "graphology";
import forceLayout from "graphology-layout-force";
import { collectLayout } from "graphology-layout/utils";

import i18n from "i18next";
import { WritableDraft, produce } from "immer";
import Sigma from "sigma";
import type { IChartBase, IEntity, IHistory, ILink } from "../interfaces/data-models";
import type { IShape } from "../interfaces/data-models/shape";
import configService from "../services/configurationService";
import viewService from "../services/viewService";
import { fixDate } from "../utils/date";
import { getId, getInternalId, isLinked, mergeProps } from "../utils/utils";
import useMainStore from "./main-store";

function updateProps(draft: WritableDraft<IChartBase>) {
  draft.InternalId = getInternalId();
  draft.DateFrom = fixDate(draft.DateFrom);
  draft.DateTo = fixDate(draft.DateTo);
  draft.LabelShort = viewService.getShortName(draft);
  draft.LabelLong = viewService.getLongName(draft);
  draft.LabelChart = viewService.getChartName(draft);
}

function hasDifferentLabel(b1: IChartBase, b2: IChartBase) {
  return b1.LabelShort !== b2.LabelShort || b1.LabelLong !== b2.LabelLong || b1.LabelChart !== b2.LabelChart;
}

const getLocationCentrumForNewNodes = (sigma: Sigma) => {
  const viewport = sigma.getContainer().getBoundingClientRect();
  const graphBox = sigma.viewportToGraph(viewport);
  const centerX = graphBox.x / 2;
  const centerY = graphBox.y / 2;

  return { x: centerX, y: centerY };
};

function calculatePositions(sigma: Sigma, graph: Graph, entities: IEntity[], links: ILink[]): { [key: string]: { x: number; y: number } } {
  // Compute graph-space viewport bounds and center correctly
  const container = sigma.getContainer();
  const rect = container.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);

  const topLeft = sigma.viewportToGraph({ x: 0, y: 0 });
  const bottomRight = sigma.viewportToGraph({ x: width, y: height });

  const minX = Math.min(topLeft.x, bottomRight.x);
  const maxX = Math.max(topLeft.x, bottomRight.x);
  const minY = Math.min(topLeft.y, bottomRight.y);
  const maxY = Math.max(topLeft.y, bottomRight.y);

  const center = sigma.viewportToGraph({ x: width / 2, y: height / 2 });

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const padding = Math.max(maxX - minX, maxY - minY) * 0.05; // 5% padding

  // Pixel to graph unit conversion (approximate, near center)
  const g00 = sigma.viewportToGraph({ x: 0, y: 0 });
  const g10 = sigma.viewportToGraph({ x: 1, y: 0 });
  const g01 = sigma.viewportToGraph({ x: 0, y: 1 });
  const scaleX = Math.abs(g10.x - g00.x) || 1; // graph units per px
  const scaleY = Math.abs(g01.y - g00.y) || 1;
  const pxToGraph = (px: number) => px * Math.min(scaleX, scaleY);

  // Create a copy of the graph and lock existing nodes
  const graphCopy = graph.copy();
  graphCopy.forEachNode((node) => graphCopy.setNodeAttribute(node, "fixed", true));

  // Determine which entities are new and need positions
  const newEntities = entities.filter((e) => !graphCopy.hasNode(getId(e)));
  if (newEntities.length === 0) return {};

  // Determine node visual size in pixels and derive a minimum separation distance
  const sizes: number[] = [];
  graphCopy.forEachNode((n, attrs: any) => {
    if (attrs && typeof attrs.size === "number" && !Number.isNaN(attrs.size)) sizes.push(attrs.size);
  });
  const avgSizePx = sizes.length ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 8; // assume radius in px
  const nodeDiameterPx = Math.max(10, avgSizePx * 2); // diameter estimate in px
  const minCenterDistPx = nodeDiameterPx * 2; // at least the width of two nodes between centers
  const minCenterDistGraph = pxToGraph(minCenterDistPx);
  const minCenterDistGraphSq = minCenterDistGraph * minCenterDistGraph;

  // Gather existing nodes' positions once
  const existingPositions: Array<{ x: number; y: number }> = [];
  graphCopy.forEachNode((n, attrs: any) => {
    if (attrs && typeof attrs.x === "number" && typeof attrs.y === "number") {
      existingPositions.push({ x: attrs.x, y: attrs.y });
    }
  });

  const placedPositions: Array<{ id: string; x: number; y: number }> = [];
  const isFarEnough = (x: number, y: number): boolean => {
    for (const p of existingPositions) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (dx * dx + dy * dy < minCenterDistGraphSq) return false;
    }
    for (const p of placedPositions) {
      const dx = p.x - x;
      const dy = p.y - y;
      if (dx * dx + dy * dy < minCenterDistGraphSq) return false;
    }
    return true;
  };

  // Seed initial non-overlapping positions using a Fermat spiral around the center
  const graphWidth = Math.abs(maxX - minX);
  const graphHeight = Math.abs(maxY - minY);
  const baseSpacing = Math.max(minCenterDistGraph, Math.min(0.15 * Math.min(graphWidth, graphHeight), pxToGraph(150)));
  const baseRadius = Math.min(graphWidth, graphHeight) * 0.05;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  newEntities.forEach((e, idx) => {
    const id = getId(e);
    const baseAngle = idx * goldenAngle;
    const constRadius = baseRadius + baseSpacing * Math.sqrt(idx);

    // Try to find a collision-free spot around the spiral
    let chosenX = center.x + constRadius * Math.cos(baseAngle);
    let chosenY = center.y + constRadius * Math.sin(baseAngle);

    const maxTries = 50;
    let placed = false;
    for (let t = 0; t <= maxTries; t++) {
      const angle = baseAngle + t * (goldenAngle * 0.33);
      const r = constRadius + t * (minCenterDistGraph * 0.75);
      let x = center.x + r * Math.cos(angle);
      let y = center.y + r * Math.sin(angle);

      // Keep within current viewport bounds
      x = clamp(x, minX + padding, maxX - padding);
      y = clamp(y, minY + padding, maxY - padding);

      if (isFarEnough(x, y)) {
        chosenX = x;
        chosenY = y;
        placed = true;
        break;
      }
    }

    // If not found, gently jitter outward until we have something reasonable
    if (!placed) {
      let t = 1;
      while (!isFarEnough(chosenX, chosenY) && t < 20) {
        const angle = baseAngle + t * (Math.PI / 4);
        const r = constRadius + t * minCenterDistGraph;
        let x = center.x + r * Math.cos(angle);
        let y = center.y + r * Math.sin(angle);
        x = clamp(x, minX + padding, maxX - padding);
        y = clamp(y, minY + padding, maxY - padding);
        chosenX = x;
        chosenY = y;
        t++;
      }
    }

    graphCopy.addNode(id, { x: chosenX, y: chosenY, fixed: false });
    placedPositions.push({ id, x: chosenX, y: chosenY });
  });

  // Add links to the copy (best effort)
  for (const l of links) {
    try {
      graphCopy.updateEdgeWithKey(l.Id, l.FromEntityId + l.FromEntityTypeId, l.ToEntityId + l.ToEntityTypeId);
    } catch {
      // Ignore linking errors in the temporary layout graph
    }
  }

  // Run a controlled force layout once to avoid large drifts
  forceLayout.assign(graphCopy, {
    maxIterations: Math.min(200, 30 + newEntities.length * 10),
    settings: {
      attraction: 0.0005,
      repulsion: 10,
      gravity: 0.0001,
      inertia: 0.6,
      maxMove: 50, // limit movement to keep nodes within view
    },
    isNodeFixed: (_: string, attr: any) => attr.fixed,
  });

  // Post-layout: enforce minimum separation between new nodes and all other nodes
  const newIds = newEntities.map(getId);
  const enforceSeparationIterations = 5;
  for (let iter = 0; iter < enforceSeparationIterations; iter++) {
    // Rebuild placed positions from graphCopy to reflect layout moves
    const current: Record<string, { x: number; y: number }> = {};
    for (const id of newIds) {
      const attrs: any = graphCopy.getNodeAttributes(id);
      current[id] = { x: attrs.x, y: attrs.y };
    }

    // Pairwise separation among new nodes
    for (let i = 0; i < newIds.length; i++) {
      for (let j = i + 1; j < newIds.length; j++) {
        const a = current[newIds[i]];
        const b = current[newIds[j]];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 === 0) {
          // Random tiny nudge to avoid zero division
          dx = (Math.random() - 0.5) * 1e-6;
          dy = (Math.random() - 0.5) * 1e-6;
          d2 = dx * dx + dy * dy;
        }
        if (d2 < minCenterDistGraphSq) {
          const d = Math.sqrt(d2);
          const needed = (minCenterDistGraph - d) / 2; // move each half the needed distance
          const ux = dx / d;
          const uy = dy / d;
          let ax = a.x - ux * needed;
          let ay = a.y - uy * needed;
          let bx = b.x + ux * needed;
          let by = b.y + uy * needed;
          ax = clamp(ax, minX + padding, maxX - padding);
          ay = clamp(ay, minY + padding, maxY - padding);
          bx = clamp(bx, minX + padding, maxX - padding);
          by = clamp(by, minY + padding, maxY - padding);
          graphCopy.setNodeAttribute(newIds[i], "x", ax);
          graphCopy.setNodeAttribute(newIds[i], "y", ay);
          graphCopy.setNodeAttribute(newIds[j], "x", bx);
          graphCopy.setNodeAttribute(newIds[j], "y", by);
          current[newIds[i]] = { x: ax, y: ay };
          current[newIds[j]] = { x: bx, y: by };
        }
      }
    }

    // Push new nodes away from existing nodes if too close
    for (const id of newIds) {
      const a = current[id];
      let moved = false;
      for (const p of existingPositions) {
        const dx = a.x - p.x;
        const dy = a.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < minCenterDistGraphSq) {
          const d = Math.sqrt(d2) || 1e-6;
          const needed = (minCenterDistGraph - d);
          const ux = dx / d;
          const uy = dy / d;
          let nx = a.x + ux * needed;
          let ny = a.y + uy * needed;
          nx = clamp(nx, minX + padding, maxX - padding);
          ny = clamp(ny, minY + padding, maxY - padding);
          graphCopy.setNodeAttribute(id, "x", nx);
          graphCopy.setNodeAttribute(id, "y", ny);
          current[id] = { x: nx, y: ny };
          moved = true;
        }
      }
      if (moved) {
        // Optionally break to re-evaluate distances in next iteration
      }
    }
  }

  // Clamp new nodes again after layout & separation
  newEntities.forEach((e) => {
    const key = getId(e);
    if (graphCopy.hasNode(key)) {
      const attrs: any = graphCopy.getNodeAttributes(key);
      const x = clamp(attrs.x, minX + padding, maxX - padding);
      const y = clamp(attrs.y, minY + padding, maxY - padding);
      graphCopy.setNodeAttribute(key, "x", x);
      graphCopy.setNodeAttribute(key, "y", y);
    }
  });

  // Return positions for the new nodes only
  const allPositions = collectLayout(graphCopy);
  const result: { [key: string]: { x: number; y: number } } = {};
  for (const e of newEntities) {
    const k = getId(e);
    if (allPositions[k]) result[k] = allPositions[k];
  }
  return result;
}

export const updateSelected = (selectedIds?: string[]) => {
  useMainStore.setState((state) => {
    const ids = selectedIds ?? state.selectedNodeAndLinkIds;

    return {
      selectedNodeAndLinkIds: ids,
      selectedEntities: ids.map((id) => state.getCurrentEntity(id)).filter((e) => e !== undefined) as IEntity[],
      selectedLinks: ids.map((id) => state.getCurrentLink(id)).filter((l) => l !== undefined) as ILink[],
    };
  });
};

export const internalAdd = (addHistory: boolean, entities: IEntity[], links: ILink[], setSelected = false) => {
  const updateEntities: IEntity[] = [];
  const updateLinks: ILink[] = [];
  useMainStore.setState((state) => {
    let min = state.minDate;
    let max = state.maxDate;

    const stateUpEntities = produce(state.entities, (stateDraft) => {
      const newEntities = entities.filter((e) => (e.PosX == null || e.PosY == null) && !state.graph.hasNode(getId(e)));
      let positions: { [key: string]: { x: number; y: number } } = {};

      if (state.sigma) {
        positions = calculatePositions(state.sigma, state.graph, newEntities, links);
      }

      for (let entity of entities) {
        const config = configService.getEntityConfiguration(entity.TypeId, entity.GlobalType);
        if (config == null) {
          console.error("Could not map, skipping", entity);
          continue;
        }

        if (config.Internal === true) {
          continue;
        }

        entity = produce(entity, (draft) => {
          updateProps(draft);

          // Assign positions
          if ((draft.PosX == null || draft.PosY == null) && positions[getId(draft)] != null) {
            const p = positions[getId(draft)];
            draft.PosX = p.x;
            draft.PosY = p.y;
          }

          // Show on map
          if (entity.Coordinates) {
            draft.ShowOnMap = true;
          }

          // Align global type
          draft.TypeId = config.TypeId;
        });

        if (entity.DateFrom != null && entity.DateFrom < min) {
          min = entity.DateFrom!.startOf("day");
        }

        if (entity.DateTo != null && entity.DateTo > max) {
          max = entity.DateTo!.endOf("day");
        }

        if (addHistory) {
          updateEntities.push(entity);
        }

        let update = [] as IEntity[];
        const existing = stateDraft[getId(entity)];

        if (existing == null) {
          update = [entity];
        } else {
          const found = existing.find((x) => x.InternalId === entity.InternalId || (x.DateFrom === entity.DateFrom && x.DateTo === entity.DateTo));
          if (found) {
            console.warn("There is already an entity with this id and date date, overwriting");
            const updateEntity = produce(entity, (draft) => {
              updateProps(draft);
              draft.InternalId = found.InternalId;
              draft.Properties = mergeProps(found.Properties, entity.Properties);
              draft.PosX = found.PosX;
              draft.PosY = found.PosY;
            });
            update = [updateEntity, ...existing.filter((x) => x.InternalId !== updateEntity.InternalId)];
          } else {
            update = [...existing, entity].sort((a, b) => sortByDate(a, b));
          }
        }

        stateDraft[getId(entity)] = update;
      }
    });

    const stateUpLinks = produce(state.links, (stateDraft) => {
      for (let link of links) {
        const config = configService.getLinkConfiguration(link.TypeId, link.GlobalType);
        if (config == null) {
          console.error("Could not map, skipping", link);
          continue;
        }

        if (config.Internal === true) {
          return;
        }

        link = produce(link, (draft) => {
          updateProps(draft);

          // Align global type
          draft.TypeId = config.TypeId;
        });

        if (link.DateFrom != null && link.DateFrom < min) {
          min = link.DateFrom!.startOf("day");
        }

        if (link.DateTo != null && link.DateTo > max) {
          max = link.DateTo!.endOf("day");
        }

        if (addHistory) {
          updateLinks.push(link);
        }

        let update = [] as ILink[];
        const existing = stateDraft[getId(link)];
        if (existing == null) {
          update = [link];
        } else {
          const found = existing.find((x) => x.InternalId === link.InternalId || (x.DateFrom === link.DateFrom && x.DateTo === link.DateTo));
          if (found !== undefined) {
            console.warn("There is already a link with this id and date date, overwriting");
            const updateLink = produce(link, (draft) => {
              updateProps(draft);
              draft.InternalId = found.InternalId;
              draft.Properties = mergeProps(found.Properties, link.Properties);
            });
            update = [updateLink, ...existing.filter((x) => updateLink.InternalId !== x.InternalId)];
          } else {
            update = [...existing, link].sort((a, b) => sortByDate(a, b));
          }
        }

        stateDraft[getId(link)] = update;
      }
    });

    return produce(state, (draft) => {
      if (addHistory) {
        draft.history.unshift({
          action: "ADD",
          from: {
            entities: [],
            links: [],
            shapes: [],
          },
          to: {
            entities: updateEntities,
            links: updateLinks,
            shapes: [],
          },
        });
        draft.historyPosition = 0;
        draft.canRedo = false;
        draft.canUndo = true;

        if (draft.history.length > 20) {
          draft.history.length = 20;
        }
      }

      draft.dirty = true;
      draft.entities = stateUpEntities;
      draft.links = stateUpLinks;
      draft.selectedNodeAndLinkIds = setSelected ? [...entities, ...links].map((x) => getId(x)) : draft.selectedNodeAndLinkIds;

      draft.minDate = min;
      draft.maxDate = max;
    });
  });

  updateSelected();

  if (addHistory) {
    console.debug("[history-add]", useMainStore.getState().history);
  }
};

export const internalUpdate = (addHistory: boolean, entities: IEntity[], links: ILink[]) => {
  useMainStore.setState((state) => {
    let min = state.minDate;
    let max = state.maxDate;

    const stateUpEntities = produce(state.entities, (stateDraft) => {
      for (const entity of entities) {
        const update = produce(entity, (draft) => {
          updateProps(draft);
          draft.SourceSystemId = i18n.t("modified");
        });
        const existing = stateDraft[getId(entity)];
        stateDraft[getId(entity)] = [update, ...existing.filter((x) => x.InternalId !== entity.InternalId)].sort((a, b) => sortByDate(a, b));

        if (update.DateFrom != null && update.DateFrom < min) {
          min = entity.DateFrom!.startOf("day");
        }

        if (update.DateTo != null && update.DateTo > max) {
          max = entity.DateTo!.endOf("day");
        }
      }
    });

    const stateUpLinks = produce(state.links, (stateDraft) => {
      for (const link of links) {
        const update = produce(link, (draft) => {
          updateProps(draft);
          draft.SourceSystemId = i18n.t("modified");
        });
        const existing = stateDraft[getId(link)];
        stateDraft[getId(link)] = [update, ...existing.filter((x) => x.InternalId !== link.InternalId)].sort((a, b) => sortByDate(a, b));

        if (update.DateFrom != null && update.DateFrom < min) {
          min = link.DateFrom!.startOf("day");
        }

        if (update.DateTo != null && update.DateTo > max) {
          max = link.DateTo!.endOf("day");
        }
      }
    });

    return produce(state, (draft) => {
      if (addHistory) {
        const restoreE = entities.map((e) => {
          return produce(
            draft.entities[getId(e)].find((x) => x.InternalId === e.InternalId),
            (draft) => undefined
          )!;
        });
        const restoreL = links.map((e) => {
          return produce(
            draft.links[getId(e)].find((x) => x.InternalId === e.InternalId),
            (draft) => undefined
          )!;
        });

        for (let s = 0; s < draft.historyPosition; s++) {
          draft.history.shift();
        }

        draft.history.unshift({
          action: "UPDATE",
          from: {
            entities: restoreE,
            links: restoreL,
            shapes: [],
          },
          to: {
            entities,
            links,
            shapes: [],
          },
        });
        draft.historyPosition = 0;
        draft.canRedo = false;
        draft.canUndo = true;

        if (draft.history.length > 20) {
          draft.history.length = 20;
        }
      }

      draft.dirty = true;
      draft.entities = stateUpEntities;
      draft.links = stateUpLinks;

      draft.minDate = min;
      draft.maxDate = max;
    });
  });

  updateSelected();

  if (addHistory) {
    console.debug("[history-update]", useMainStore.getState().history);
  }
};

export const internalRemove = (addHistory: boolean, entities: IEntity[], links: ILink[]) => {
  useMainStore.setState((state) => {
    return produce(state, (draft) => {
      if (addHistory) {
        draft.history.unshift({
          action: "REMOVE",
          from: {
            entities,
            links,
            shapes: [],
          },
          to: {
            entities: [],
            links: [],
            shapes: [],
          },
        });
        draft.historyPosition = 0;
        draft.canRedo = false;
        draft.canUndo = true;

        if (draft.history.length > 20) {
          draft.history.length = 20;
        }
      }

      for (const entity of entities) {
        let selected = draft.selectedNodeAndLinkIds;

        const existing = draft.entities[getId(entity)] ?? [];
        const update = existing.filter((x) => x.InternalId !== entity.InternalId);

        if (update.length === 0) {
          const copy = { ...draft.entities };
          delete copy[getId(entity)];
          selected = selected.filter((s) => s !== getId(entity));

          const copyLinks = { ...draft.links };

          for (const link of Object.values(draft.links).map((l) => l[0])) {
            if (isLinked(entity, link)) {
              copyLinks[getId(link)].forEach((remove) => {
                if (addHistory && !draft.history[0].from.links.some((l) => l.InternalId === remove.InternalId)) {
                  draft.history[0].from.links.push(remove);
                }
              });

              delete copyLinks[getId(link)];
              selected = selected.filter((s) => s !== getId(link));
            }
          }

          draft.selectedNodeAndLinkIds = selected;
          draft.dirty = true;
          draft.entities = copy;
          draft.links = copyLinks;
        } else {
          draft.dirty = true;
          draft.entities = { ...draft.entities, [getId(entity)]: update };
        }
      }

      for (const link of links) {
        const existing = draft.links[getId(link)] ?? [];
        const update = existing.filter((x) => x.InternalId !== link.InternalId);

        if (update.length === 0) {
          draft.selectedNodeAndLinkIds = draft.selectedNodeAndLinkIds.filter((s) => s !== getId(link));
          delete draft.links[getId(link)];
        } else {
          draft.links = { ...draft.links, [getId(link)]: update };
        }

        draft.dirty = true;
      }
    });
  });

  updateSelected();

  if (addHistory) {
    console.debug("[history-remove]", useMainStore.getState().history);
  }
};

export const internalUpdateLabels = () => {
  useMainStore.setState((state) => {
    const stateUpEntities = produce(state.entities, (stateDraft) => {
      for (const entity of Object.values(state.entities).flat()) {
        const update = produce(entity, (draft) => {
          updateProps(draft);
        });

        if (hasDifferentLabel(update, entity)) {
          const existing = stateDraft[getId(entity)];
          stateDraft[getId(entity)] = [update, ...existing.filter((x) => x.InternalId !== entity.InternalId)].sort((a, b) => sortByDate(a, b));
        }
      }
    });

    const stateUpLinks = produce(state.links, (stateDraft) => {
      for (const link of Object.values(state.links).flat()) {
        const update = produce(link, (draft) => {
          updateProps(draft);
        });

        if (hasDifferentLabel(update, link)) {
          const existing = stateDraft[getId(link)];
          stateDraft[getId(link)] = [update, ...existing.filter((x) => x.InternalId !== link.InternalId)].sort((a, b) => sortByDate(a, b));
        }
      }
    });

    const stateUpComputedLinks = state.computedLinks.map((l) => {
      return produce(l, (draft) => {
        updateProps(draft);
      });
    });

    return produce(state, (draft) => {
      draft.entities = stateUpEntities;
      draft.links = stateUpLinks;
      draft.computedLinks = stateUpComputedLinks;
    });
  });
};

// Shape operations for undo/redo functionality
export const internalAddShapes = (addHistory: boolean, shapes: IShape[]) => {
  useMainStore.setState((state) => {
    return produce(state, (draft) => {
      if (addHistory) {
        draft.history.unshift({
          action: "ADD",
          from: {
            entities: [],
            links: [],
            shapes: [],
          },
          to: {
            entities: [],
            links: [],
            shapes: shapes,
          },
        });
        draft.historyPosition = 0;
        draft.canRedo = false;
        draft.canUndo = true;

        if (draft.history.length > 20) {
          draft.history.length = 20;
        }
      }

      draft.dirty = true;
      draft.shapes = [...draft.shapes, ...shapes];
      draft.drawings = JSON.stringify(draft.shapes);
    });
  });

  if (addHistory) {
    console.debug("[history-add-shapes]", useMainStore.getState().history);
  }
};

export const internalUpdateShapes = (addHistory: boolean, shapes: IShape[]) => {
  useMainStore.setState((state) => {
    return produce(state, (draft) => {
      if (addHistory) {
        const restoreShapes = shapes.map((shape) => {
          return draft.shapes.find((s) => s.id === shape.id)!;
        });

        for (let s = 0; s < draft.historyPosition; s++) {
          draft.history.shift();
        }

        draft.history.unshift({
          action: "UPDATE",
          from: {
            entities: [],
            links: [],
            shapes: restoreShapes,
          },
          to: {
            entities: [],
            links: [],
            shapes: shapes,
          },
        });
        draft.historyPosition = 0;
        draft.canRedo = false;
        draft.canUndo = true;

        if (draft.history.length > 20) {
          draft.history.length = 20;
        }
      }

      draft.dirty = true;
      draft.shapes = draft.shapes.map((s) => {
        const updatedShape = shapes.find((us) => us.id === s.id);
        return updatedShape ? updatedShape : s;
      });
      draft.drawings = JSON.stringify(draft.shapes);
    });
  });

  if (addHistory) {
    console.debug("[history-update-shapes]", useMainStore.getState().history);
  }
};

export const internalRemoveShapes = (addHistory: boolean, shapes: IShape[]) => {
  useMainStore.setState((state) => {
    return produce(state, (draft) => {
      if (addHistory) {
        draft.history.unshift({
          action: "REMOVE",
          from: {
            entities: [],
            links: [],
            shapes: shapes,
          },
          to: {
            entities: [],
            links: [],
            shapes: [],
          },
        });
        draft.historyPosition = 0;
        draft.canRedo = false;
        draft.canUndo = true;

        if (draft.history.length > 20) {
          draft.history.length = 20;
        }
      }

      draft.dirty = true;
      const shapeIds = shapes.map((s) => s.id);
      draft.shapes = draft.shapes.filter((s) => !shapeIds.includes(s.id));
      draft.selectedShapeIds = draft.selectedShapeIds.filter((id) => !shapeIds.includes(id));
      draft.drawings = JSON.stringify(draft.shapes);
    });
  });

  if (addHistory) {
    console.debug("[history-remove-shapes]", useMainStore.getState().history);
  }
};

const sortByDate = (a: IHistory, b: IHistory) => (a.DateFrom != null && b.DateFrom != null ? a.DateFrom.diff(b.DateFrom).milliseconds : 0);
