// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { RefObject, useCallback, useEffect } from "react";
import Sigma from "sigma";
import configService from "../../../services/configurationService";
import useMainStore from "../../../store/main-store";
import { createEntity } from "../../../utils/entity-utils";

function useEntityDrop(sigma: Sigma | undefined, container: RefObject<HTMLDivElement | null>) {
  // Get addEntity function from store to directly create entities on drop
  const addEntity = useMainStore((state) => state.addEntity);

  // Create a ref callback function compatible with React refs
  const dropRef = useCallback(
    (element: HTMLElement | null) => {
      if (element && container.current === null) {
        container.current = element as HTMLDivElement;
      }
    },
    [container]
  );

  useEffect(() => {
    if (!container.current || !sigma) return;

    const handleDragOver = (e: DragEvent) => {
      // Prevent default to allow drop
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();

      if (!e.dataTransfer || !container.current || !sigma) return;

      try {
        // Parse the entity data from the drop
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;

        const entityData = JSON.parse(data);
        if (!entityData || !entityData.entityTypeId) return;

        // Get drop position relative to the container
        const offset = container.current.getBoundingClientRect();
        const click = {
          x: e.clientX - offset.x,
          y: e.clientY - offset.y,
        };

        // Convert viewport coordinates to graph coordinates
        const pos = sigma.viewportToGraph(click);

        // Try to find a fallback handler if needed
        const config = configService.getEntityConfiguration(entityData.entityTypeId);
        if (config) {
          // This is a generic fallback for dropped entities
          const newEntity = createEntity(config);
          newEntity.PosX = pos.x;
          newEntity.PosY = pos.y;

          addEntity(newEntity);
        }
      } catch (err) {
        console.error("Error handling entity drop:", err);
      }
    };

    container.current.addEventListener("dragover", handleDragOver);
    container.current.addEventListener("drop", handleDrop);

    return () => {
      if (container.current) {
        container.current.removeEventListener("dragover", handleDragOver);
        container.current.removeEventListener("drop", handleDrop);
      }
    };
  }, [container, sigma, addEntity]);

  // Return just the ref callback function, not an array
  return dropRef;
}

export default useEntityDrop;
