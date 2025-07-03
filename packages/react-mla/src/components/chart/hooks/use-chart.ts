// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

// React imports
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

// Third-party imports
import Sigma from "sigma";
import { produce } from "immer";
import { SigmaEdgeEventPayload, SigmaNodeEventPayload, SigmaStageEventPayload } from "sigma/types";

// Store imports
import useAppStore from "../../../store/app-store";
import useMainStore from "../../../store/main-store";

// Interface imports
import { IEntity } from "../../../interfaces/data-models";
import { IShape } from "../../../interfaces/data-models/shape";

// Utility imports
import { calculateResizedDimensions, convertToGraphCoordinates, convertToScreenCoordinates } from "../utils/coordinate-utils";
import { isNodeIntersectingRect } from "../utils/node-detection";
import { checkForResizeHandleInSelectedShapes, getShapeAtPoint, isShapeIntersectingRect } from "../utils/shape-detection";
import { drawCanvas } from "../utils/canvas-utils";

// Hook imports
import useKeyDown from "../../../effects/keydown";
import useNodeHighlight from "./use-node-highlight";
import useChartDrop from "./use-chart-drop";
import { useSigmaConfig } from "./use-sigma-config";
import { useSigmaInitialization } from "./use-sigma-initialization";

// Constants
const LEFT_CLICK = 0;
const RIGHT_CLICK = 2;
const DOUBLE_CLICK = 2;

// Interactive mode types
type InteractiveMode = "idle" | "dragging" | "resizing" | "drawing" | "editingText" | "drawingSelectionBox" | "selecting" | "panning";

/**
 * Specialized hook for node operations (dragging, highlighting, right-click)
 * Works in coordination with the centralized interaction system
 */
function useChart(containerRef: RefObject<HTMLDivElement | null>) {
  // ============================================================================
  // STORE SELECTORS
  // ============================================================================

  // Node and entity store selectors
  const entities = useMainStore((state) => state.entities);
  const selectedNodeAndLinkIds = useMainStore((state) => state.selectedNodeAndLinkIds);
  const setSelectedNodeAndLinkIds = useMainStore((state) => state.setSelectedNodeAndLinkIds);
  const links = useMainStore((state) => state.links);
  const graph = useMainStore((state) => state.graph);
  const update = useMainStore((state) => state.updateEntity);
  const getHistory = useMainStore((state) => state.getEntityHistory);
  const clearSelection = useMainStore((state) => state.clearSelection);

  // Shape store selectors
  const activeShapeType = useMainStore((state) => state.activeShapeType);
  const selectedShapeIds = useMainStore((state) => state.selectedShapeIds);
  const shapes = useMainStore((state) => state.shapes);
  const setSelectedShapeIds = useMainStore((state) => state.setSelectedShapeIds);
  const addShape = useMainStore((state) => state.addShape);
  const updateShape = useMainStore((state) => state.updateShape);
  const removeShape = useMainStore((state) => state.removeShape);
  const setActiveShapeType = useMainStore((state) => state.setActiveShapeType);

  // Sigma store selectors
  const renderer = useMainStore((state) => state.sigma);
  const setSigma = useMainStore((state) => state.setSigma);

  // App store selectors
  const setGeo = useAppStore((state) => state.setSelectedGeoFeature);
  const showContextMenu = useAppStore((state) => state.showContextMenu);

  // ============================================================================
  // STATE VARIABLES
  // ============================================================================

  // Interactive mode state - replaces isDragging, isResizing, isDrawing, isEditingText, isDrawingSelectionBox
  const [interactiveMode, setInteractiveMode] = useState<InteractiveMode>("idle");

  // Shape state that depends on the interactive mode
  const [liveShapeUpdates, setLiveShapeUpdates] = useState<IShape | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [shapeBeingResized, setShapeBeingResized] = useState<IShape | null>(null);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [shapeBeingDrawn, setShapeBeingDrawn] = useState<IShape | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // ============================================================================
  // REFS
  // ============================================================================

  // Container refs
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Canvas and selection refs
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const multiselectCanvasRef = useRef(null as null | HTMLCanvasElement);

  // Mouse and interaction refs
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const selectionBoxRef = useRef({ startX: 0, endX: 0, startY: 0, endY: 0, clientOffsetX: 0, clientOffsetY: 0 });

  // Text editing refs
  const editingTextIdRef = useRef<string | null>(null);
  const eventCleanupRef = useRef<(() => void) | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  const updateSelectedNodePositions = useCallback(
    (diff: { x: number; y: number }) => {
      graph.updateEachNodeAttributes((node, attr) => {
        if (selectedNodeAndLinkIds.includes(node)) {
          return {
            ...attr,
            x: attr.x - diff.x,
            y: attr.y - diff.y,
          };
        } else {
          return attr;
        }
      });
    },
    [graph, selectedNodeAndLinkIds]
  );

  const updateSelectedShapePositions = useCallback(
    (diff: { x: number; y: number }) => {
      selectedShapeIds.forEach((shapeId) => {
        const shapeIndex = shapes.findIndex((s) => s.id === shapeId);
        if (shapeIndex === -1) return;

        const shape = shapes[shapeIndex];
        let updatedShape: IShape;

        if (shape.type === "line" && shape.linePoints) {
          updatedShape = {
            ...shape,
            x: shape.linePoints.x1 - diff.x,
            y: shape.linePoints.y1 - diff.y,
            linePoints: {
              x1: shape.linePoints.x1 - diff.x,
              y1: shape.linePoints.y1 - diff.y,
              x2: shape.linePoints.x2 - diff.x,
              y2: shape.linePoints.y2 - diff.y,
            },
          };
        } else {
          updatedShape = {
            ...shape,
            x: shape.x - diff.x,
            y: shape.y - diff.y,
          };
        }

        // Update the shape in the store
        updateShape(updatedShape);
      });
    },
    [selectedShapeIds, shapes, updateShape]
  );

  // ============================================================================
  // CONFIGURATION HOOKS
  // ============================================================================

  const { createNodePrograms, getSigmaSettings } = useSigmaConfig();
  const { initializeEmptyChart, setupBoundingBox, setupEventHandlers } = useSigmaInitialization();

  const createSigma = useCallback(
    (container: HTMLElement) => {
      const NodeProgram = createNodePrograms();
      const settings = getSigmaSettings(NodeProgram);
      const sigma = new Sigma(graph, container, settings);

      // Initialize chart and setup
      initializeEmptyChart(sigma, graph);
      setupBoundingBox(sigma);
      setupEventHandlers(sigma);

      return sigma;
    },
    [graph, createNodePrograms, getSigmaSettings, initializeEmptyChart, setupBoundingBox, setupEventHandlers]
  );

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const deleteSelectedShapes = () => {
    // Delete all selected shapes
    selectedShapeIds.forEach((id) => {
      removeShape(id);
    });
  };

  const setShapeColor = (strokeColor: string, fillColor: string) => {
    selectedShapeIds.forEach((shapeId) => {
      const shapeToUpdate = shapes.find((s) => s.id === shapeId);
      if (shapeToUpdate) {
        const updates: Partial<IShape> = {};
        if (strokeColor) updates.strokeColor = strokeColor;
        if (fillColor) updates.fillColor = fillColor;

        updateShape({ ...shapeToUpdate, ...updates });
      }
    });
  };

  const setTextProperties = (text: string, fontSize?: number, fontColor?: string) => {
    selectedShapeIds.forEach((shapeId) => {
      const shapeToUpdate = shapes.find((s) => s.id === shapeId);
      if (shapeToUpdate && shapeToUpdate.type === "text") {
        const updates: Partial<IShape> = {};
        if (text) updates.text = text;
        if (fontSize) updates.fontSize = fontSize;
        if (fontColor) updates.fontColor = fontColor;

        updateShape({ ...shapeToUpdate, ...updates });
      }
    });
  };

  const hideTextInput = useCallback(() => {
    if (!textInputRef.current) return;

    // Clean up event handlers
    if (eventCleanupRef.current) {
      eventCleanupRef.current();
      eventCleanupRef.current = null;
    }

    textInputRef.current.style.display = "none";
    textInputRef.current.value = "";
    setInteractiveMode("idle");
    setEditingTextId(null);
    editingTextIdRef.current = null; // Also clear the ref
  }, [setInteractiveMode, setEditingTextId]);

  // Add this helper function before the downStage function
  const finishTextEditing = useCallback(() => {
    if (!textInputRef.current || !editingTextIdRef.current || !renderer) {
      return;
    }

    const newText = textInputRef.current.value;
    const shapeToUpdate = shapes.find((s) => s.id === editingTextIdRef.current);

    if (shapeToUpdate) {
      // Get the textarea's current height to update the shape
      const textareaHeight = textInputRef.current.offsetHeight;

      // Get the current screen coordinates of the shape to understand its current dimensions
      const { screenShape } = convertToScreenCoordinates(shapeToUpdate, renderer);

      // Calculate the scale factor between the current screen height and textarea height
      const heightRatio = textareaHeight / Math.abs(screenShape.height);

      // Apply the same ratio to the original graph height, preserving the sign
      const newHeight = shapeToUpdate.height * heightRatio;

      const updatedShape = {
        ...shapeToUpdate,
        text: newText,
        height: newHeight,
      };
      updateShape(updatedShape);
    }

    hideTextInput();
    drawCanvas(drawingContextRef.current!, drawingCanvasRef.current!, shapes, selectedShapeIds, shapeBeingDrawn, renderer);
  }, [renderer, shapes, selectedShapeIds, shapeBeingDrawn, updateShape, hideTextInput]);

  // ============================================================================
  // EFFECTS AND HOOKS
  // ============================================================================

  // Sigma lifecycle management
  useEffect(() => {
    if (chartContainerRef.current == null) return;

    const sigma = createSigma(chartContainerRef.current);
    setSigma(sigma);

    return () => sigma.kill();
  }, [chartContainerRef, createSigma, setSigma]);

  // Chart functionality hooks
  useNodeHighlight(renderer);
  const dropRef = useChartDrop(renderer, containerRef);

  // Keyboard shortcuts
  useKeyDown(() => setSelectedNodeAndLinkIds([...Object.keys(entities), ...Object.keys(links)]), chartContainerRef, ["KeyA"], true);

  // Initialize canvas and textarea only once when renderer is available
  useEffect(() => {
    if (!renderer) return;

    const drawingCanvas = renderer.createCanvas("custom-drawings", {
      style: {
        position: "absolute",
        inset: "0",
        zIndex: "0",
        pointerEvents: "none",
      },
      beforeLayer: "edges",
    });

    renderer.getContainer().prepend(drawingCanvas);

    // Create a textarea for text editing instead of input
    const textInput = document.createElement("textarea");
    textInput.style.position = "absolute";
    textInput.style.display = "none";
    textInput.style.zIndex = "1000";
    textInput.style.border = "1px dashed #4e92ed"; // Use border instead of outline
    textInput.style.outline = "none";
    textInput.style.padding = "0px 2px 2px 1px"; // Reduce top padding by 1px for better vertical alignment
    textInput.style.margin = "0";
    textInput.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    textInput.style.fontFamily = "Arial";
    textInput.style.lineHeight = "1.2"; // Match canvas text line height
    textInput.style.pointerEvents = "auto";
    textInput.style.cursor = "text";
    textInput.style.resize = "none";
    textInput.style.overflow = "hidden";
    textInput.style.boxSizing = "border-box";
    textInput.style.verticalAlign = "top"; // Align text to top like canvas
    textInput.style.textAlign = "left"; // Ensure consistent text alignment
    textInput.style.whiteSpace = "pre-wrap"; // Handle line breaks like canvas
    textInput.style.wordWrap = "break-word"; // Match canvas word wrapping

    textInputRef.current = textInput;
    renderer.getContainer().appendChild(textInput);

    const handleResize = () => {
      const viewport = renderer.getDimensions();
      drawingCanvas.width = viewport.width;
      drawingCanvas.height = viewport.height;
    };

    drawingCanvasRef.current = drawingCanvas;
    drawingContextRef.current = drawingCanvas.getContext("2d");

    renderer.on("resize", handleResize);

    handleResize();

    return () => {
      renderer.off("resize", handleResize);
      renderer.killLayer("custom-drawings");

      if (textInputRef.current && renderer.getContainer().contains(textInputRef.current)) {
        renderer.getContainer().removeChild(textInputRef.current);
        textInputRef.current = null;
      }
    };
  }, [renderer]);

  // Separate effect for drawing updates that depend on shape state
  useEffect(() => {
    if (renderer && drawingContextRef.current && drawingCanvasRef.current) {
      drawCanvas(drawingContextRef.current, drawingCanvasRef.current, shapes, selectedShapeIds, shapeBeingDrawn, renderer);
    }
  }, [selectedShapeIds, renderer, editingTextId, shapes, shapeBeingDrawn]);

  // Handle afterRender event separately to avoid dependency issues
  useEffect(() => {
    if (!renderer) return;

    const handleSigmaRender = () => {
      drawCanvas(drawingContextRef.current, drawingCanvasRef.current, shapes, selectedShapeIds, shapeBeingDrawn, renderer);
    };

    renderer.on("afterRender", handleSigmaRender);

    return () => {
      renderer.off("afterRender", handleSigmaRender);
    };
  }, [renderer, shapes, selectedShapeIds, shapeBeingDrawn]);

  // Initialize multiselect canvas
  useEffect(() => {
    if (renderer == null) return;

    const canv = renderer.getCanvases()["multiselect"] ?? renderer.createCanvas("multiselect");
    const container = renderer.getContainer();

    canv.style.userSelect = "none";
    canv.style.touchAction = "none";
    canv.style.pointerEvents = "none";
    canv.style["width"] = `${container.clientWidth}px`;
    canv.style["height"] = `${container.clientHeight}px`;
    canv.setAttribute("width", `${container.clientWidth}px`);
    canv.setAttribute("height", `${container.clientHeight}px`);

    multiselectCanvasRef.current = canv;

    container.oncontextmenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    return () => {
      multiselectCanvasRef.current = null;
    };
  }, [renderer]);

  // Add a separate effect to handle selection box clearing based on interactive mode
  useEffect(() => {
    if (!renderer || !multiselectCanvasRef.current) return;

    if (interactiveMode !== "drawingSelectionBox") {
      const canvas = multiselectCanvasRef.current;
      const ctx = canvas.getContext("2d")!;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [renderer, interactiveMode]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  useEffect(() => {
    if (renderer == null || multiselectCanvasRef.current == null) return;

    const handleKeyDownInShapeTextEdit = (e: KeyboardEvent) => {
      // Only handle if the textarea is focused
      if (document.activeElement !== textInputRef.current) return;

      if (e.key === "Escape") {
        // Call cancelTextEditing directly
        if (!textInputRef.current || !editingTextIdRef.current || !renderer) {
          return;
        }

        hideTextInput();
        drawCanvas(drawingContextRef.current!, drawingCanvasRef.current!, shapes, selectedShapeIds, shapeBeingDrawn, renderer);

        //document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDownInShapeTextEdit);
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        // Explicitly allow Delete and Backspace keys for text editing
        e.stopPropagation(); // Prevent other handlers from interfering
        // Don't call preventDefault() - let the default behavior work
      }
      // Allow Enter key for multiline text - don't prevent default
    };

    const selectNodesAndShapedInSelectionBox = (addToAlreadySelected: boolean) => {
      const rect = selectionBoxRef.current;
      const start = renderer.viewportToGraph({ x: rect.startX, y: rect.startY });
      const end = renderer.viewportToGraph({ x: rect.endX, y: rect.endY });

      // Check for nodes that intersect with the selection box
      const nodeIdsToSelect = addToAlreadySelected ? [...selectedNodeAndLinkIds] : [];
      for (const entityId of Object.keys(entities)) {
        const entity = entities[entityId][0];

        if (isNodeIntersectingRect(entity, start.x, start.y, end.x, end.y)) {
          if (!nodeIdsToSelect.includes(entityId)) {
            nodeIdsToSelect.push(entityId);
          }
        }
      }

      // Check for shapes that intersect with the selection box
      const shapeIdsToSelect: string[] = addToAlreadySelected ? [...selectedShapeIds] : [];

      for (const shape of shapes) {
        const { screenShape } = convertToScreenCoordinates(shape, renderer);

        if (isShapeIntersectingRect(screenShape, rect.startX, rect.startY, rect.endX, rect.endY)) {
          if (!shapeIdsToSelect.includes(shape.id)) {
            shapeIdsToSelect.push(shape.id);
          }
        }
      }

      setSelectedShapeIds(shapeIdsToSelect);
      setSelectedNodeAndLinkIds(nodeIdsToSelect);
    };

    const selectInSelectBox = (addToAlreadySelected: boolean) => {
      setInteractiveMode("idle");
      selectNodesAndShapedInSelectionBox(addToAlreadySelected);
    };

    const selectNodeOrLink = (toggle: boolean, id: string) => {
      if (toggle) {
        if (selectedNodeAndLinkIds.indexOf(id) >= 0) {
          setSelectedNodeAndLinkIds(selectedNodeAndLinkIds.filter((x) => x != id));
        } else {
          setSelectedNodeAndLinkIds([id, ...selectedNodeAndLinkIds]);
        }
      } else {
        setSelectedNodeAndLinkIds([id]);
      }
    };

    const selectShape = (toggle: boolean, shapeId: string) => {
      if (toggle) {
        if (selectedShapeIds.indexOf(shapeId) >= 0) {
          setSelectedShapeIds(selectedShapeIds.filter((x) => x != shapeId));
        } else {
          setSelectedShapeIds([shapeId, ...selectedShapeIds]);
        }
      } else {
        setSelectedShapeIds([shapeId]);
      }
    };

    const drawSelectionBox = () => {
      if (renderer == null || multiselectCanvasRef.current == null || containerRef.current == null) {
        return;
      }

      multiselectCanvasRef.current.style["width"] = `${containerRef.current.clientWidth}px`;
      multiselectCanvasRef.current.style["height"] = `${containerRef.current.clientHeight}px`;
      multiselectCanvasRef.current.setAttribute("width", `${containerRef.current.clientWidth}px`);
      multiselectCanvasRef.current.setAttribute("height", `${containerRef.current.clientHeight}px`);

      const ctx = multiselectCanvasRef.current.getContext("2d")!;
      if (interactiveMode !== "drawingSelectionBox") {
        ctx.clearRect(0, 0, containerRef.current.clientWidth, containerRef.current.clientHeight);
        return;
      }

      const rect = selectionBoxRef.current;

      ctx.setLineDash([5]);
      ctx.strokeStyle = "rgba(78, 146, 237, 0.75)";
      ctx.strokeRect(rect.startX + rect.clientOffsetX, rect.startY, rect.endX + rect.clientOffsetX - rect.startX, rect.endY - rect.startY);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(151, 194, 252, 0.45)";
      ctx.fillRect(rect.startX + rect.clientOffsetX, rect.startY, rect.endX + rect.clientOffsetX - rect.startX, rect.endY - rect.startY);
    };

    const moveBody = (e: SigmaStageEventPayload) => {
      // Always prevent sigmas default panning
      e.preventSigmaDefault();

      if (interactiveMode === "selecting") {
        setInteractiveMode("dragging");

        // Save location if the user want to start draging
        const pos = renderer.viewportToGraph(e.event);
        dragStartRef.current = {
          x: pos.x,
          y: pos.y,
        };
      }

      // Move nodes or shapes
      if (interactiveMode === "dragging") {
        const pos = renderer.viewportToGraph(e.event);

        const diff = {
          x: dragStartRef.current.x - pos.x,
          y: dragStartRef.current.y - pos.y,
        };

        dragStartRef.current = {
          x: pos.x,
          y: pos.y,
        };

        updateSelectedNodePositions(diff);
        updateSelectedShapePositions(diff);

        e.event.original.preventDefault();
        e.event.original.stopPropagation();
      }

      // Create selectbox
      if (interactiveMode === "drawingSelectionBox") {
        Object.assign(selectionBoxRef.current, {
          endX: e.event.x,
          endY: e.event.y,
        });

        drawSelectionBox();

        e.event.original.preventDefault();
        e.event.original.stopPropagation();
      }

      // Pan chart
      if (interactiveMode === "panning") {
        const pos = renderer.viewportToFramedGraph(e.event);
        const camera = renderer.getCamera();
        const state = camera.getState();
        const update = { x: state.x + panStartRef.current.x - pos.x, y: state.y + panStartRef.current.y - pos.y };
        camera.setState(update);
      }

      // Drawing or draging shapes
      if (drawingCanvasRef.current != null) {
        const moveEvent = e.event.original as MouseEvent;
        const canvas = drawingCanvasRef.current;
        const canvasRect = canvas.getBoundingClientRect();
        const screenX = moveEvent.clientX - canvasRect.left;
        const screenY = moveEvent.clientY - canvasRect.top;

        if (selectedShapeIds.length > 0) {
          const container = renderer.getContainer();
          const resizeInfo = checkForResizeHandleInSelectedShapes(screenX, screenY, selectedShapeIds, shapes, renderer, convertToScreenCoordinates);

          if (resizeInfo) {
            if (resizeInfo.shape.type === "line" && (resizeInfo.handle === "line-start" || resizeInfo.handle === "line-end")) {
              container.style.cursor = "ns-resize"; // Cursor for line endpoint resizing
            } else if (resizeInfo.shape.type !== "line") {
              // Set the appropriate cursor based on which handle is being hovered
              // For rectangles, ellipses, and text shapes
              switch (resizeInfo.handle) {
                case "tl": // Top-left handle
                  container.style.cursor = "nwse-resize"; // Northwest-Southeast for top-left corner
                  break;
                case "tr": // Top-right handle
                  container.style.cursor = "nesw-resize"; // Northeast-Southwest for top-right corner
                  break;
                case "bl": // Bottom-left handle
                  container.style.cursor = "nesw-resize"; // Northeast-Southwest for bottom-left corner
                  break;
                case "br": // Bottom-right handle
                  container.style.cursor = "nwse-resize"; // Northwest-Southeast for bottom-right corner
                  break;
                default:
                  container.style.cursor = "default";
              }
            } else {
              container.style.cursor = "default";
            }
          } else {
            const hoveredShape = getShapeAtPoint(screenX, screenY, shapes, renderer, convertToScreenCoordinates);
            if (hoveredShape && selectedShapeIds.includes(hoveredShape.id)) {
              container.style.cursor = "move";
            } else {
              container.style.cursor = "default";
            }
          }
        } else {
          // Set cursor based on whether a shape drawing type is active
          renderer.getContainer().style.cursor = activeShapeType ? "crosshair" : "default";
        }

        if (interactiveMode === "drawing" && activeShapeType && shapeBeingDrawn) {
          // Update temp shape immediately
          let updatedShape: IShape;

          if (activeShapeType === "line" && shapeBeingDrawn.linePoints) {
            updatedShape = {
              ...shapeBeingDrawn,
              linePoints: {
                ...shapeBeingDrawn.linePoints,
                x2: screenX,
                y2: screenY,
              },
            };
          } else {
            updatedShape = {
              ...shapeBeingDrawn,
              width: screenX - drawStart.x,
              height: screenY - drawStart.y,
            };
          }

          setShapeBeingDrawn(updatedShape);

          // Clear the canvas before drawing the updated shape
          drawCanvas(drawingContextRef.current!, canvas, shapes, selectedShapeIds, updatedShape, renderer);

          e.event.original.preventDefault();
          e.event.original.stopPropagation();
        } else if (interactiveMode === "resizing" && shapeBeingResized !== null && resizeHandle != null) {
          const shapeIndex = shapes.findIndex((s) => s.id === shapeBeingResized.id);
          if (shapeIndex === -1) return;

          const shape = shapes[shapeIndex];
          let updatedShape: IShape | null = null;

          // Handle line resizing
          if (shape.type === "line" && shape.linePoints && (resizeHandle === "line-start" || resizeHandle === "line-end")) {
            // Convert current mouse position from screen to graph coordinates
            const graphMousePosition = renderer.viewportToGraph({ x: screenX, y: screenY });

            if (resizeHandle === "line-start") {
              // Update the start point of the line, keeping the end point fixed
              updatedShape = {
                ...shape,
                linePoints: {
                  ...shape.linePoints, // Keep existing x2, y2
                  x1: graphMousePosition.x,
                  y1: graphMousePosition.y,
                },
                // Lines are assumed to be stored with graph coordinates after creation
                inGraphCoordinates: true,
              };
            } else if (resizeHandle === "line-end") {
              // Update the end point of the line, keeping the start point fixed
              updatedShape = {
                ...shape,
                linePoints: {
                  ...shape.linePoints, // Keep existing x1, y1
                  x2: graphMousePosition.x,
                  y2: graphMousePosition.y,
                },
                inGraphCoordinates: true,
              };
            }

            if (updatedShape) {
              setLiveShapeUpdates(updatedShape);
            }
          } else if (shape.type !== "line") {
            // Handle rectangle, ellipse, and text shape resizing
            const { screenShape } = convertToScreenCoordinates(shape, renderer);
            const { newScreenX, newScreenY, newScreenWidth, newScreenHeight } = calculateResizedDimensions(screenX, screenY, screenShape, resizeHandle);
            const topLeftGraph = renderer.viewportToGraph({ x: newScreenX, y: newScreenY });

            const bottomRightGraph = renderer.viewportToGraph({
              x: newScreenX + newScreenWidth,
              y: newScreenY + newScreenHeight,
            });

            const newX = topLeftGraph.x;
            const newY = topLeftGraph.y;
            const newWidth = bottomRightGraph.x - topLeftGraph.x;
            const newHeight = bottomRightGraph.y - topLeftGraph.y;

            updatedShape = {
              ...shape,
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight,
              inGraphCoordinates: true,
            };

            setLiveShapeUpdates(updatedShape);
          }

          // Clear the canvas before drawing the updated shape
          drawCanvas(drawingContextRef.current!, canvas, shapes, selectedShapeIds, updatedShape, renderer);

          e.event.original.preventDefault();
          e.event.original.stopPropagation();
        }
      }
    };

    const downNode = (e: SigmaNodeEventPayload) => {
      if (activeShapeType) return; // Don't allow when drawing shapes

      const click = e.event.original as MouseEvent;
      if (click.button != LEFT_CLICK) return;

      // Handle shape selection with Ctrl+click support
      if (click.ctrlKey) {
        selectNodeOrLink(click.ctrlKey, e.node);
      } else if (selectedNodeAndLinkIds.indexOf(e.node) == -1) {
        selectNodeOrLink(false, e.node);
        setSelectedShapeIds([]);
      }

      setInteractiveMode("selecting");
    };

    const upNode = (e: SigmaNodeEventPayload) => {
      if (activeShapeType) return; // Don't allow multiselect when drawing shapes

      const click = e.event.original as MouseEvent;
      if (click.button != LEFT_CLICK) return;

      if (interactiveMode === "dragging") {
        const positionUpdate = [] as IEntity[];
        const nodes = selectedNodeAndLinkIds.filter((n) => graph.hasNode(n));
        for (const n of nodes) {
          graph.setNodeAttribute(n, "fixed", true);
          const x = graph.getNodeAttribute(n, "x");
          const y = graph.getNodeAttribute(n, "y");

          getHistory(n)
            ?.filter((e) => e.PosX !== x || e.PosY !== y)
            .forEach((e) => {
              positionUpdate.push(
                produce(e, (draft) => {
                  draft.PosX = x;
                  draft.PosY = y;
                })
              );
            });
        }

        update(...positionUpdate);
      }

      if (interactiveMode === "drawingSelectionBox") {
        selectInSelectBox(click.ctrlKey);
      }

      setInteractiveMode("idle");
    };

    const rightClickNode = (e: SigmaNodeEventPayload) => {
      const rightClick = e.event.original as MouseEvent;
      showContextMenu(rightClick.pageX, rightClick.pageY);
      const selectedIds = useMainStore.getState().selectedNodeAndLinkIds;
      if (!selectedIds.includes(e.node)) {
        setSelectedNodeAndLinkIds([e.node]);
      }

      setInteractiveMode("idle");
    };

    const downEdge = (e: SigmaEdgeEventPayload) => {
      if (activeShapeType) return; // Don't allow multiselect when drawing shapes

      const click = e.event.original as MouseEvent;
      if (click.button != LEFT_CLICK) return;

      selectNodeOrLink(click.ctrlKey, e.edge);

      setInteractiveMode("selecting");
    };

    const upEdge = (e: SigmaEdgeEventPayload) => {
      if (activeShapeType) return; // Don't allow multiselect when drawing shapes

      const click = e.event.original as MouseEvent;
      if (click.button != LEFT_CLICK) return;

      if (interactiveMode === "drawingSelectionBox") {
        selectInSelectBox(click.ctrlKey);
      }

      setInteractiveMode("idle");
    };

    const downStage = (e: SigmaStageEventPayload) => {
      const click = e.event.original as MouseEvent;

      // Left mouse button pressed down
      if (click.button == LEFT_CLICK) {
        // Editing text while clicking outside
        if (interactiveMode === "editingText" && editingTextId && drawingCanvasRef.current && drawingContextRef.current && textInputRef.current != null) {
          finishTextEditing();
        }

        setInteractiveMode("idle");

        const offset = renderer.getContainer().getBoundingClientRect();
        const screenX = click.clientX - offset.x;
        const screenY = click.clientY - offset.y;

        // Draw a new shape
        if (activeShapeType != null) {
          setInteractiveMode("drawing");
          setDrawStart({ x: screenX, y: screenY });
          clearSelection();

          const newTempShape: IShape = {
            id: `temp-${Date.now().toString()}`,
            type: activeShapeType,
            x: screenX,
            y: screenY,
            width: 0,
            height: 0,
            strokeColor: "#000000",
            fillColor: "rgba(255, 255, 255, 0.0)",
            text: activeShapeType === "text" ? "Text" : undefined,
            fontSize: 16,
            fontColor: "#000000",
            linePoints: activeShapeType === "line" ? { x1: screenX, y1: screenY, x2: screenX, y2: screenY } : undefined,
            inGraphCoordinates: false,
          };

          setShapeBeingDrawn(newTempShape);
          return;
        }

        // Check if we clicked a resize handle
        const resizeInfo = checkForResizeHandleInSelectedShapes(screenX, screenY, selectedShapeIds, shapes, renderer, convertToScreenCoordinates);
        if (resizeInfo) {
          setInteractiveMode("resizing");
          setResizeHandle(resizeInfo.handle);
          setShapeBeingResized(resizeInfo.shape);
          return;
        }

        // Check if a shape was clicked
        const clickedShape = getShapeAtPoint(screenX, screenY, shapes, renderer, convertToScreenCoordinates);
        if (clickedShape) {
          // Check if shape is a text box and user double clicked
          if (clickedShape && clickedShape.type === "text" && drawingCanvasRef.current && drawingContextRef.current && textInputRef.current != null && click.detail === DOUBLE_CLICK) {
            setInteractiveMode("editingText");
            setEditingTextId(clickedShape.id);
            editingTextIdRef.current = clickedShape.id; // Also set the ref
            clearSelection();

            const { screenShape } = convertToScreenCoordinates(clickedShape, renderer);
            const textInput = textInputRef.current;

            // Position the textarea exactly over the text shape with same border positioning as selected shape
            textInput.style.left = `${screenShape.x - 2}px`; // Match selection border positioning
            textInput.style.top = `${screenShape.y - 2 - 2}px`; // Match selection border positioning, -2px to compensate for jump
            textInput.style.width = `${screenShape.width + 4}px`; // Match selection border width
            textInput.style.minHeight = `${screenShape.height + 4}px`; // Match selection border height
            textInput.style.fontSize = `${screenShape.fontSize || 16}px`;
            textInput.style.color = screenShape.fontColor || "#000000";
            textInput.style.display = "block";
            textInput.style.backgroundColor = "white"; // Solid background to cover text behind
            textInput.style.boxSizing = "border-box"; // Ensure padding doesn't affect sizing

            // Match the exact styling used in the canvas text rendering
            textInput.style.fontFamily = "Arial";
            textInput.style.lineHeight = "1.2"; // Match the line height used in canvas rendering
            textInput.style.margin = "0";
            textInput.style.padding = "0px 2px 2px 1px"; // Reduce top padding by 1px for better alignment
            textInput.style.border = "1px dashed #4e92ed"; // Use border instead of outline
            textInput.style.outline = "none";
            textInput.style.verticalAlign = "top"; // Align text to top like canvas
            textInput.style.textAlign = "left"; // Ensure consistent text alignment
            textInput.style.whiteSpace = "pre-wrap"; // Handle line breaks like canvas
            textInput.style.wordWrap = "break-word"; // Match canvas word wrapping

            textInput.value = screenShape.text || "";

            // Auto-resize the textarea when typing
            const autoResizeTextarea = () => {
              textInput.style.height = "auto";
              textInput.style.height = Math.min(Math.max(textInput.scrollHeight, screenShape.height), 500) + "px";
            };
            textInput.addEventListener("input", autoResizeTextarea);

            // Ensure textarea is properly sized before focusing
            setTimeout(autoResizeTextarea, 0);

            setTimeout(() => {
              if (document.activeElement !== textInput) {
                textInput.focus();
                textInput.select();
              }
            }, 10);

            // Add click-outside handler to finish text editing
            const handleClickOutside = (event: MouseEvent) => {
              if (textInput && !textInput.contains(event.target as Node)) {
                finishTextEditing();
                document.removeEventListener("mousedown", handleClickOutside);
              }
            };

            // Add the event listener after a small delay to avoid immediate triggering
            setTimeout(() => {
              document.addEventListener("mousedown", handleClickOutside);
              // Store the cleanup function
              eventCleanupRef.current = () => {
                document.removeEventListener("mousedown", handleClickOutside);
              };
            }, 100);

            e.preventSigmaDefault();
            return;
          }

          // Handle shape selection with Ctrl+click support
          if (click.ctrlKey) {
            selectShape(click.ctrlKey, clickedShape.id);
          } else if (selectedShapeIds.indexOf(clickedShape.id) == -1) {
            selectShape(false, clickedShape.id);
            setSelectedNodeAndLinkIds([]);
          }

          setInteractiveMode("selecting");
          return;
        }

        // Set the selection box start position
        Object.assign(selectionBoxRef.current, {
          startX: screenX,
          startY: screenY,
          endX: screenX,
          endY: screenY,
          clientOffsetX: offset.x,
          clientOffsetY: offset.y,
        });

        setInteractiveMode("drawingSelectionBox");
      } else if (click.button == RIGHT_CLICK) {
        panStartRef.current = renderer.viewportToFramedGraph(e.event);
        setInteractiveMode("panning");
      }
    };

    const upStage = (e: SigmaStageEventPayload) => {
      const click = e.event.original as MouseEvent;
      if (click.button == LEFT_CLICK) {
        // Is drawing
        if (interactiveMode === "drawing" && shapeBeingDrawn) {
          setInteractiveMode("idle");

          if (shapeBeingDrawn.type === "line" || shapeBeingDrawn.width > 5 || shapeBeingDrawn.height > 5) {
            const graphShape = convertToGraphCoordinates(shapeBeingDrawn, renderer);
            addShape(graphShape);
            setActiveShapeType(null);
          }

          setSelectedShapeIds([shapeBeingDrawn.id]);
          setShapeBeingDrawn(null);
          return;
        }

        // Dont change selection if the left mouse button was down on a node or shape
        if (interactiveMode === "selecting") {
          setInteractiveMode("idle");
        } else if (interactiveMode === "drawingSelectionBox") {
          selectInSelectBox(click.ctrlKey);
        } else if (interactiveMode === "idle") {
          setSelectedNodeAndLinkIds([]);
          setSelectedShapeIds([]);
        }

        // Resizing
        if (interactiveMode === "resizing") {
          setInteractiveMode("idle");
          setResizeHandle(null);
          setShapeBeingResized(null);

          if (liveShapeUpdates) {
            updateShape(liveShapeUpdates);
            setLiveShapeUpdates(null);
          }
        }

        // Dragging
        if (interactiveMode === "dragging") {
          setInteractiveMode("idle");
        }
      }

      if (interactiveMode === "panning") {
        setInteractiveMode("idle");
      }
    };

    const rightClickStage = () => {
      setInteractiveMode("idle");
    };

    // Event registration
    renderer.on("downStage", downStage);
    renderer.on("upStage", upStage);
    renderer.on("upNode", upNode);
    renderer.on("downNode", downNode);
    renderer.on("rightClickNode", rightClickNode);
    renderer.on("rightClickStage", rightClickStage);
    renderer.on("downEdge", downEdge);
    renderer.on("upEdge", upEdge);
    renderer.on("moveBody", moveBody);

    document.addEventListener("keydown", handleKeyDownInShapeTextEdit);

    // Cleanup function
    return () => {
      renderer.off("downStage", downStage);
      renderer.off("upStage", upStage);
      renderer.off("upNode", upNode);
      renderer.off("downNode", downNode);
      renderer.off("rightClickNode", rightClickNode);
      renderer.off("rightClickStage", rightClickStage);
      renderer.off("downEdge", downEdge);
      renderer.off("upEdge", upEdge);
      renderer.off("moveBody", moveBody);

      document.removeEventListener("keydown", handleKeyDownInShapeTextEdit);
    };
  }, [
    entities,
    renderer,
    selectedNodeAndLinkIds,
    setGeo,
    setSelectedNodeAndLinkIds,
    activeShapeType,
    selectedShapeIds,
    shapes,
    setSelectedShapeIds,
    graph,
    update,
    getHistory,
    showContextMenu,
    updateSelectedNodePositions,
    containerRef,
    interactiveMode,
    editingTextId,
    shapeBeingDrawn,
    updateShape,
    clearSelection,
    resizeHandle,
    addShape,
    setActiveShapeType,
    liveShapeUpdates,
    updateSelectedShapePositions,
    shapeBeingResized,
    drawStart.x,
    drawStart.y,
    finishTextEditing,
    hideTextInput,
  ]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    deleteSelectedShapes,
    setShapeColor,
    setTextProperties,
    hasSelection: selectedShapeIds.length > 0,
    hasShapes: shapes.length > 0,
    activeShapeType,
    renderer,
    container: chartContainerRef,
    dropRef,
    // Interactive mode state
    interactiveMode,
  };
}

export default useChart;
