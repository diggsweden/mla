// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { RefObject, useCallback, useEffect } from "react";
import Sigma from "sigma";
import configService from "../../../services/configurationService";
import useMainStore from "../../../store/main-store";
import { createEntity } from "../../../utils/entity-utils";
import { generateUUID } from "../../../utils/utils";
import { IShape, ShapeType } from "../../../interfaces/data-models/shape";

/**
 * Unified hook for handling both shape and entity drops in a single container
 */
function useChartDrop(sigma: Sigma | undefined, containerRef: RefObject<HTMLDivElement | null>) {
  // Get required store functions
  const addEntity = useMainStore((state) => state.addEntity);
  const addShape = useMainStore((state) => state.addShape);
  const setSelectedShapeIds = useMainStore((state) => state.setSelectedShapeIds);

  // Create a ref callback function compatible with React refs
  const dropRef = useCallback(
    (element: HTMLElement | null) => {
      if (element && containerRef.current === null) {
        containerRef.current = element as HTMLDivElement;
      }
    },
    [containerRef]
  );

  useEffect(() => {
    if (!containerRef.current || !sigma) return;

    const container = containerRef.current;

    const handleDragOver = (e: DragEvent) => {
      // Prevent default to allow drop
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";

        // Add a subtle cursor highlight effect when dragging over the chart
        if (!container.classList.contains("m-chart-drag-over")) {
          container.classList.add("m-chart-drag-over");
          container.style.setProperty("--chart-highlight-color", "rgba(59, 130, 246, 0.08)");
          container.style.backgroundColor = "var(--chart-highlight-color)";
          container.style.transition = "background-color 0.2s ease";
        }
      }
    };

    // Add handler for drag leave to remove highlight
    const handleDragLeave = () => {
      if (container.classList.contains("m-chart-drag-over")) {
        container.classList.remove("m-chart-drag-over");
        container.style.backgroundColor = "";
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();

      if (!e.dataTransfer || !container || !sigma) return;

      // Clear the highlight effect when dropping
      if (container.classList.contains("m-chart-drag-over")) {
        container.classList.remove("m-chart-drag-over");
        container.style.backgroundColor = "";
      }

      try {
        // Parse the dropped data
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;

        // Parse the data and determine if it's a shape or entity
        const dropData = JSON.parse(data);

        // Get drop position relative to the container
        const offset = container.getBoundingClientRect();
        const click = {
          x: e.clientX - offset.x,
          y: e.clientY - offset.y,
        };

        // Apply any needed scaling factor from CSS transforms
        const transformMatrix = window.getComputedStyle(container).transform;
        const scale = transformMatrix !== "none" ? parseFloat(transformMatrix.split(",")[3]) || 1 : 1;

        // Adjust for any scaling if necessary
        if (scale !== 1) {
          click.x /= scale;
          click.y /= scale;
        }

        // Convert viewport coordinates to graph coordinates
        const pos = sigma.viewportToGraph(click);

        // Determine if this is a shape or an entity based on the data structure
        if (dropData.shapeType) {
          // This is a shape drop
          handleShapeDrop(dropData.shapeType, pos.x, pos.y);
        } else if (dropData.entityTypeId) {
          // This is an entity drop
          handleEntityDrop(dropData, pos);
        }
      } catch (err) {
        console.error("Error handling drop:", err);
      }
    };

    // Handle entity drop
    const handleEntityDrop = (entityData: any, pos: { x: number; y: number }) => {
      const config = configService.getEntityConfiguration(entityData.entityTypeId);
      if (config) {
        const newEntity = createEntity(config);
        newEntity.PosX = pos.x;
        newEntity.PosY = pos.y;

        addEntity(newEntity);
      }
    };

    // Handle shape drop and creation
    const handleShapeDrop = (shapeType: ShapeType, x: number, y: number) => {
      const id = generateUUID();

      // Standard dimensions for different shape types
      const dimensions = {
        text: { width: 150, height: -50 },
        rectangle: { width: 120, height: -80 },
        ellipse: { width: 120, height: -80 },
        line: { width: 100, height: 0 },
      };

      // Get current sigma camera scale to adjust dimensions if needed
      const cameraScale = sigma?.getCamera().ratio || 1;

      // If the view is significantly zoomed out, we may want to scale shapes accordingly
      if (cameraScale > 1.5) {
        const scaleFactor = Math.min(1.2, cameraScale / 1.5);
        Object.keys(dimensions).forEach((key) => {
          dimensions[key as ShapeType].width *= scaleFactor;
          if (key !== "line") {
            dimensions[key as ShapeType].height *= scaleFactor;
          }
        });
      }

      // Calculate coordinates to center the shape on the cursor position
      const centerX = x - dimensions[shapeType].width / 2;
      const centerY = y - dimensions[shapeType].height / 2;

      let newShape: IShape;

      switch (shapeType) {
        case "text": {
          // For text shapes, position with better alignment adjustments
          const textOffsetY = -15; // Upward adjustment for better visual centering
          const textOffsetX = -5; // Small leftward adjustment for better alignment

          newShape = {
            id,
            type: "text",
            x: centerX + textOffsetX,
            y: centerY + textOffsetY,
            width: dimensions.text.width,
            height: dimensions.text.height,
            strokeColor: "transparent",
            fillColor: "transparent",
            text: "Text",
            fontSize: 16,
            fontColor: "#000000",
            inGraphCoordinates: true,
          };
          break;
        }
        case "line": {
          const halfLength = dimensions.line.width / 2;
          newShape = {
            id,
            type: "line",
            x: x,
            y: y,
            width: dimensions.line.width,
            height: dimensions.line.height,
            strokeColor: "#000000",
            fillColor: "transparent",
            linePoints: {
              x1: x - halfLength,
              y1: y,
              x2: x + halfLength,
              y2: y,
            },
            inGraphCoordinates: true,
          };
          break;
        }
        case "rectangle": {
          newShape = {
            id,
            type: "rectangle",
            x: centerX,
            y: centerY,
            width: dimensions.rectangle.width,
            height: dimensions.rectangle.height,
            strokeColor: "#000000",
            fillColor: "rgba(255, 255, 255, 0.0)",
            inGraphCoordinates: true,
          };
          break;
        }
        case "ellipse": {
          newShape = {
            id,
            type: "ellipse",
            x: centerX,
            y: centerY,
            width: dimensions.ellipse.width,
            height: dimensions.ellipse.height,
            strokeColor: "#000000",
            fillColor: "rgba(255, 255, 255, 0.0)",
            inGraphCoordinates: true,
          };
          break;
        }
      }

      console.log("New shape created:", newShape); // Add the shape to the store
      addShape(newShape);

      // Select the newly created shape (deselect all others)
      setSelectedShapeIds([id]);
    }; // Set up event listeners on the container
    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("dragleave", handleDragLeave);
    container.addEventListener("drop", handleDrop);

    // Clean up event listeners when component unmounts
    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("dragleave", handleDragLeave);
      container.removeEventListener("drop", handleDrop);
    };
  }, [containerRef, sigma, addEntity, addShape, setSelectedShapeIds]);

  // Return the ref callback function
  return dropRef;
}

export default useChartDrop;
