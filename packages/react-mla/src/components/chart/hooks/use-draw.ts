// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useCallback, useEffect, useRef, useState } from "react";
import Sigma from "sigma";
import { SigmaStageEventPayload } from "sigma/types";
import { IShape, ShapeType } from "../../../interfaces/data-models/shape";
import useMainStore from "../../../store/main-store";

// Import utilities
import { drawCanvas, redrawCanvasWithUpdatedShape, redrawCanvasWithUpdatedShapeAtIndex, redrawShapeWithNewDimensions } from "../utils/canvas-utils";
import { calculateResizedDimensions, convertToGraphCoordinates, convertToScreenCoordinates } from "../utils/coordinate-utils";
import { checkForResizeHandle, getShapeAtPoint } from "../utils/shape-detection";

const LEFT_CLICK = 0;

/**
 * Custom hook for drawing shapes on a canvas in a Sigma graph
 */
function useDraw(renderer: Sigma | undefined) {
  // Use shapes and selectedShapeId from the store instead of local state
  const shapes = useMainStore((state) => state.shapes);
  const selectedShapeId = useMainStore((state) => state.selectedShapeId);
  const setSelectedShapeId = useMainStore((state) => state.setSelectedShapeId);
  const addShape = useMainStore((state) => state.addShape);
  const updateShape = useMainStore((state) => state.updateShape);
  const removeShape = useMainStore((state) => state.removeShape);
  const currentShapeType = useMainStore((state) => state.currentShapeType);
  const setCurrentShapeType = useMainStore((state) => state.setCurrentShapeType);

  // Local state for drawing operations
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [tempShape, setTempShape] = useState<IShape | null>(null);
  const [changingShape, setChangingShape] = useState<IShape | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);

  const finalizeTextEditing = useCallback(() => {
    if (!textInputRef.current || !editingTextId) return;

    const newText = textInputRef.current.value;
    const shapeToUpdate = shapes.find((s) => s.id === editingTextId);

    if (shapeToUpdate) {
      const updatedShape = { ...shapeToUpdate, text: newText };
      updateShape(updatedShape);
    }

    hideTextInput();
    drawCanvas(ctxRef.current, canvasRef.current, shapes, selectedShapeId, tempShape, renderer);
  }, [renderer, editingTextId, selectedShapeId, shapes, tempShape, updateShape]);

  // Handle click on Sigma nodes to deselect shapes
  useEffect(() => {
    if (!renderer) return;

    const clickNode = () => {
      setSelectedShapeId(null);
      hideTextInput();
    };

    renderer.on("clickNode", clickNode);

    return () => {
      renderer.off("clickNode", clickNode);
    };
  }, [renderer, setSelectedShapeId]);

  // Handle click on Sigma nodes to deselect shapes
  useEffect(() => {
    if (!renderer) return;

    const handleClickOnExistingShape = (screenX: number, screenY: number): boolean => {
      if (!renderer) return false;

      const clickedShape = getShapeAtPoint(screenX, screenY, shapes, renderer, convertToScreenCoordinates);

      if (clickedShape) {
        setSelectedShapeId(clickedShape.id);
        setIsDragging(true);

        const graphCoords = renderer.viewportToGraph({ x: screenX, y: screenY });
        setDragOffset({
          x: graphCoords.x - clickedShape.x,
          y: graphCoords.y - clickedShape.y,
        });

        const shapeIndex = shapes.findIndex((s) => s.id === clickedShape.id);
        if (shapeIndex !== shapes.length - 1) {
          const updatedShapes = [...shapes];
          const [shape] = updatedShapes.splice(shapeIndex, 1);
          updatedShapes.push(shape);
        }

        return true;
      }

      return false;
    };

    const startDrawingNewShape = (screenX: number, screenY: number) => {
      if (!currentShapeType || !renderer) return;

      setIsDrawing(true);
      setDrawStart({ x: screenX, y: screenY });
      setSelectedShapeId(null);

      const newTempShape: IShape = {
        id: `temp-${Date.now().toString()}`,
        type: currentShapeType,
        x: screenX,
        y: screenY,
        width: 0,
        height: 0,
        strokeColor: "#000000",
        fillColor: "rgba(255, 255, 255, 0.0)",
        text: currentShapeType === "text" ? "New Text" : undefined,
        fontSize: 16,
        fontColor: "#000000",
        linePoints: currentShapeType === "line" ? { x1: screenX, y1: screenY, x2: screenX, y2: screenY } : undefined,
        inGraphCoordinates: false,
      };

      setTempShape(newTempShape);
    };

    const startTextEditing = (shape: IShape) => {
      if (!textInputRef.current || !renderer || !ctxRef.current || !canvasRef.current) return;

      setIsEditingText(true);
      setEditingTextId(shape.id);
      setSelectedShapeId(shape.id);

      const { screenShape } = convertToScreenCoordinates(shape, renderer);
      const textInput = textInputRef.current;

      // Position the textarea exactly over the text shape
      textInput.style.left = `${screenShape.x}px`;
      textInput.style.top = `${screenShape.y}px`;
      textInput.style.width = `${screenShape.width}px`;
      textInput.style.minHeight = `${screenShape.height}px`;
      textInput.style.fontSize = `${screenShape.fontSize || 16}px`;
      textInput.style.color = screenShape.fontColor || "#000000";
      textInput.style.display = "block";
      textInput.style.backgroundColor = "white"; // Solid background to cover text behind
      textInput.style.boxSizing = "border-box"; // Ensure padding doesn't affect sizing
      textInput.value = screenShape.text || "";

      // Auto-resize the textarea when typing
      const autoResizeTextarea = () => {
        textInput.style.height = "auto";
        textInput.style.height = Math.min(Math.max(textInput.scrollHeight, screenShape.height), 500) + "px";
      };
      textInput.addEventListener("input", autoResizeTextarea);

      // Ensure textarea is properly sized before focusing
      setTimeout(autoResizeTextarea, 0);

      // Use a more reliable approach to focus the textarea
      // First immediate focus attempt
      textInput.focus();
      textInput.select();

      // Second focus attempt with small delay to ensure focus
      setTimeout(() => {
        if (document.activeElement !== textInput) {
          textInput.focus();
          textInput.select();
        }
      }, 10);

      // Add click outside listener
      const handleClickOutside = (e: MouseEvent) => {
        if (textInputRef.current && !textInputRef.current.contains(e.target as Node)) {
          finalizeTextEditing();
          document.removeEventListener("mousedown", handleClickOutside);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);

      textInput.onkeydown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          finalizeTextEditing();
          document.removeEventListener("mousedown", handleClickOutside);
        } else if (e.key === "Escape") {
          finalizeTextEditing();
          document.removeEventListener("mousedown", handleClickOutside);
        }
      };
    };

    const downStage = (e: SigmaStageEventPayload) => {
      const click = e.event.original as MouseEvent;
      if (click.button != LEFT_CLICK || click.ctrlKey) return;

      if (isEditingText && editingTextId) {
        finalizeTextEditing();
      }

      const canvasRect = renderer.getContainer().getBoundingClientRect();
      const screenX = click.clientX - canvasRect.left;
      const screenY = click.clientY - canvasRect.top;

      if (click.detail === 2) {
        const clickedShape = getShapeAtPoint(screenX, screenY, shapes, renderer, convertToScreenCoordinates);
        if (clickedShape && clickedShape.type === "text") {
          startTextEditing(clickedShape);
          e.preventSigmaDefault();
          return;
        }
      }

      if (selectedShapeId != null) {
        const handle = checkForResizeHandle(screenX, screenY, selectedShapeId, shapes, renderer, convertToScreenCoordinates);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          return;
        }
      }

      if (currentShapeType) {
        startDrawingNewShape(screenX, screenY);
        return;
      }

      const clickedShape = handleClickOnExistingShape(screenX, screenY);
      if (clickedShape) return;

      setSelectedShapeId(null);
    };

    renderer.on("downStage", downStage);

    return () => {
      renderer.off("downStage", downStage);
    };
  }, [renderer, currentShapeType, editingTextId, isEditingText, selectedShapeId, shapes, setSelectedShapeId, finalizeTextEditing]);

  // Handle click on Sigma nodes to deselect shapes
  useEffect(() => {
    if (!renderer) return;

    const handleDraggingMouseMove = (graphPosition: { x: number; y: number }, canvas: HTMLCanvasElement) => {
      if (!ctxRef.current || !renderer) return;

      const shapeIndex = shapes.findIndex((s) => s.id === selectedShapeId);
      if (shapeIndex === -1) return;

      const shape = shapes[shapeIndex];

      const newX = graphPosition.x - dragOffset.x;
      const newY = graphPosition.y - dragOffset.y;

      const updatedShape = {
        ...shape,
        x: newX,
        y: newY,
      };

      setChangingShape(updatedShape);

      redrawCanvasWithUpdatedShapeAtIndex(ctxRef.current, canvas, shapeIndex, updatedShape, shapes, selectedShapeId, renderer);
    };

    const handleDrawingMouseMove = (screenX: number, screenY: number, canvas: HTMLCanvasElement) => {
      if (!ctxRef.current || !tempShape || !renderer) return;

      let updatedShape: IShape;

      if (currentShapeType === "line" && tempShape.linePoints) {
        updatedShape = {
          ...tempShape,
          linePoints: {
            ...tempShape.linePoints,
            x2: screenX,
            y2: screenY,
          },
        };
      } else {
        updatedShape = {
          ...tempShape,
          width: screenX - drawStart.x,
          height: screenY - drawStart.y,
        };
      }

      setTempShape(updatedShape);

      redrawCanvasWithUpdatedShape(ctxRef.current, canvas, updatedShape, shapes, selectedShapeId, renderer);
    };

    const handleResizingMouseMove = (screenX: number, screenY: number, canvas: HTMLCanvasElement) => {
      if (!ctxRef.current || !renderer || !resizeHandle) return;

      const shapeIndex = shapes.findIndex((s) => s.id === selectedShapeId);
      if (shapeIndex === -1) return;

      const shape = shapes[shapeIndex];
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

      const updatedShape = {
        ...shape,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };

      setChangingShape(updatedShape);

      redrawShapeWithNewDimensions(ctxRef.current, canvas, shapeIndex, newScreenX, newScreenY, newScreenWidth, newScreenHeight, shapes, selectedShapeId, renderer);
    };

    const moveBody = (e: SigmaStageEventPayload) => {
      if (!canvasRef.current) return;

      const moveEvent = e.event.original as MouseEvent;

      const container = renderer.getContainer();
      const canvas = canvasRef.current;
      const canvasRect = canvas.getBoundingClientRect();
      const screenX = moveEvent.clientX - canvasRect.left;
      const screenY = moveEvent.clientY - canvasRect.top;

      if (selectedShapeId != null) {
        const handle = checkForResizeHandle(screenX, screenY, selectedShapeId, shapes, renderer, convertToScreenCoordinates);
        if (handle) {
          container.style.cursor = handle == "tl" || handle == "br" ? "nwse-resize" : "nesw-resize";
        } else {
          const hoveredShape = getShapeAtPoint(screenX, screenY, shapes, renderer, convertToScreenCoordinates);
          if (hoveredShape && hoveredShape.id === selectedShapeId) {
            container.style.cursor = "move";
          } else {
            container.style.cursor = "default";
          }
        }
      }

      const graphPosition = renderer.viewportToGraph({ x: screenX, y: screenY });

      if (isDrawing && currentShapeType) {
        handleDrawingMouseMove(screenX, screenY, canvas);
      } else if (isResizing && selectedShapeId !== null && resizeHandle) {
        handleResizingMouseMove(screenX, screenY, canvas);
      } else if (isDragging && selectedShapeId !== null) {
        handleDraggingMouseMove(graphPosition, canvas);
      }
    };

    renderer.on("moveBody", moveBody);

    return () => {
      renderer.off("moveBody", moveBody);
    };
  }, [renderer, currentShapeType, dragOffset.x, dragOffset.y, drawStart.x, drawStart.y, isDragging, isDrawing, isResizing, resizeHandle, selectedShapeId, shapes, tempShape]);

  // Handle click on Sigma nodes to deselect shapes
  useEffect(() => {
    if (!renderer) return;

    const finalizeDrawing = () => {
      if (!tempShape || !renderer) return;

      setIsDrawing(false);

      if (tempShape.type == "line" || tempShape.width > 5 || tempShape.height > 5) {
        const graphShape = convertToGraphCoordinates(tempShape, renderer);

        addShape(graphShape);
        setCurrentShapeType(null);
        setSelectedShapeId(graphShape.id);
      }

      setTempShape(null);
    };

    const upStage = () => {
      if (isResizing) {
        setIsResizing(false);
        setResizeHandle(null);

        if (changingShape) {
          updateShape(changingShape);
          setChangingShape(null);
        }
      }

      if (isDragging) {
        setIsDragging(false);

        if (changingShape) {
          updateShape(changingShape);
          setChangingShape(null);
        }
      }

      if (isDrawing && tempShape) {
        finalizeDrawing();
      }
    };

    renderer.on("upStage", upStage);

    return () => {
      renderer.off("upStage", upStage);
    };
  }, [renderer, addShape, changingShape, isDragging, isDrawing, isResizing, setCurrentShapeType, setSelectedShapeId, tempShape, updateShape]);

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
    textInput.style.border = "1px solid #4e92ed";
    textInput.style.padding = "4px";
    textInput.style.margin = "0";
    textInput.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    textInput.style.outline = "none";
    textInput.style.fontFamily = "Arial";
    textInput.style.pointerEvents = "auto";
    textInput.style.cursor = "text";
    textInput.style.resize = "none";
    textInput.style.overflow = "hidden";
    textInputRef.current = textInput;
    renderer.getContainer().appendChild(textInput);

    const handleResize = () => {
      const viewport = renderer.getDimensions();
      drawingCanvas.width = viewport.width;
      drawingCanvas.height = viewport.height;
      drawCanvas(ctxRef.current, canvasRef.current, shapes, selectedShapeId, tempShape, renderer);
    };

    canvasRef.current = drawingCanvas;
    ctxRef.current = drawingCanvas.getContext("2d");

    const handleSigmaRender = () => {
      drawCanvas(ctxRef.current, canvasRef.current, shapes, selectedShapeId, tempShape, renderer);
    };

    renderer.on("afterRender", handleSigmaRender);
    renderer.on("resize", handleResize);

    handleResize();

    return () => {
      renderer.off("afterRender", handleSigmaRender);
      renderer.off("resize", handleResize);
      renderer.killLayer("custom-drawings");

      if (textInputRef.current) {
        renderer.getContainer().removeChild(textInputRef.current);
      }
    };
  }, [renderer, selectedShapeId, tempShape, shapes]);

  useEffect(() => {
    if (renderer) {
      drawCanvas(ctxRef.current, canvasRef.current, shapes, selectedShapeId, tempShape, renderer);
    }
  }, [selectedShapeId, renderer, editingTextId, shapes, tempShape]);

  const hideTextInput = () => {
    if (!textInputRef.current) return;

    textInputRef.current.style.display = "none";
    textInputRef.current.value = "";
    setIsEditingText(false);
    setEditingTextId(null);
  };

  const setCurrentShape = (type: ShapeType | null) => {
    setCurrentShapeType(type);
  };

  const deleteSelectedShape = () => {
    if (selectedShapeId) {
      removeShape(selectedShapeId);
    }
  };

  const setShapeColor = (strokeColor: string, fillColor: string) => {
    if (selectedShapeId) {
      const shapeToUpdate = shapes.find((s) => s.id === selectedShapeId);
      if (shapeToUpdate) {
        const updates: Partial<IShape> = {};
        if (strokeColor) updates.strokeColor = strokeColor;
        if (fillColor) updates.fillColor = fillColor;

        updateShape({ ...shapeToUpdate, ...updates });
      }
    }
  };

  const setTextProperties = (text: string, fontSize?: number, fontColor?: string) => {
    if (selectedShapeId) {
      const shapeToUpdate = shapes.find((s) => s.id === selectedShapeId);
      if (shapeToUpdate && shapeToUpdate.type === "text") {
        const updates: Partial<IShape> = {};
        if (text) updates.text = text;
        if (fontSize) updates.fontSize = fontSize;
        if (fontColor) updates.fontColor = fontColor;

        updateShape({ ...shapeToUpdate, ...updates });
      }
    }
  };

  return {
    setCurrentShape,
    deleteSelectedShape,
    setShapeColor,
    setTextProperties,
    selectedShape: selectedShapeId !== null,
    hasShapes: shapes.length > 0,
    currentShapeType,
  };
}

export default useDraw;
