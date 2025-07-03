// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef, useState } from "react";
import { ShapeType } from "../../interfaces/data-models/shape";
import Icon from "../common/Icon";
import viewService from "../../services/viewService";

interface Props {
  shapeType: ShapeType;
  iconName: string;
  label: string;
  title?: string;
  disabled?: boolean;
  draggable?: boolean;
  active?: boolean;
  visible?: boolean;
  iconClassName?: string;
  onClick?: (e: any) => void;
  color?: string;
}

function RibbonShapeButton(props: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const theme = viewService.getTheme();

  // Set default color if not provided
  const color = props.color || theme.Icon;
  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    console.log("Selected shape type:", props.shapeType);

    // Simply call the onClick handler from props
    if (props.onClick) {
      props.onClick(e);
    }
  };

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || props.draggable === false || props.disabled) return;
    const handleDragStart = (e: DragEvent) => {
      setIsDragging(true);

      // Create a custom drag ghost element
      if (e.dataTransfer) {
        // Create ghost element that represents the shape
        const ghostElement = document.createElement("div");
        ghostElement.className = "m-flex m-items-center m-justify-center";

        // Style based on shape type
        switch (props.shapeType) {
          case "rectangle":
            ghostElement.style.width = "60px";
            ghostElement.style.height = "40px";
            ghostElement.style.border = `2px solid ${color}`;
            ghostElement.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
            ghostElement.style.borderRadius = "2px"; // Slight rounding
            break;
          case "ellipse":
            ghostElement.style.width = "60px";
            ghostElement.style.height = "40px";
            ghostElement.style.border = `2px solid ${color}`;
            ghostElement.style.borderRadius = "50%";
            ghostElement.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
            break;
          case "line":
            ghostElement.style.width = "60px";
            ghostElement.style.height = "3px"; // Slightly thicker for better visibility
            ghostElement.style.backgroundColor = color;
            ghostElement.style.marginTop = "10px"; // Better vertical positioning
            break;
          case "text":
            ghostElement.style.width = "60px";
            ghostElement.style.height = "40px";
            ghostElement.style.border = `1px solid ${color}`;
            ghostElement.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
            ghostElement.style.display = "flex";
            ghostElement.style.alignItems = "center";
            ghostElement.style.justifyContent = "center";
            ghostElement.textContent = "Abc";
            ghostElement.style.color = color;
            ghostElement.style.fontWeight = "bold";
            ghostElement.style.fontSize = "14px"; // More readable font size
            break;
        } // Add elevated shadow and transform for better visual feedback
        ghostElement.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
        ghostElement.style.transform = "scale(1.05)"; // Slightly larger for emphasis

        // Add animation for smoother appearance
        ghostElement.style.transition = "opacity 0.1s ease-in-out";

        // Add to document temporarily
        ghostElement.style.position = "absolute";
        ghostElement.style.top = "-1000px";
        ghostElement.style.opacity = "0.9";
        ghostElement.style.pointerEvents = "none"; // Ensure it doesn't interfere with other elements
        document.body.appendChild(ghostElement);

        // Set the drag image with an offset
        const ghostRect = ghostElement.getBoundingClientRect();
        e.dataTransfer.setDragImage(ghostElement, ghostRect.width / 2, ghostRect.height / 2);

        // Clean up the ghost element after a short delay
        setTimeout(() => {
          document.body.removeChild(ghostElement);
        }, 0);

        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData(
          "text/plain",
          JSON.stringify({
            shapeType: props.shapeType,
            color: color,
          })
        );
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    button.draggable = true;
    button.addEventListener("dragstart", handleDragStart);
    button.addEventListener("dragend", handleDragEnd);
    return () => {
      button.removeEventListener("dragstart", handleDragStart);
      button.removeEventListener("dragend", handleDragEnd);
    };
  }, [props.draggable, props.disabled, props.shapeType, color]);
  if (props.visible === false) {
    return null;
  }
  return (
    <button
      ref={buttonRef}
      className={
        (props.active ? "m-border-blue-300 m-bg-blue-100 " : "m-border-transparent ") +
        "m-min-w-[64px] m-m-1 m-mb-2 m-px-1 m-bb-1 m-text-base m-border enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 disabled:m-opacity-50 disabled:m-cursor-default" +
        (isDragging ? " m-opacity-50 m-bg-gray-100 m-shadow-inner" : " m-opacity-100")
      }
      onClick={handleClick}
      title={props.title || props.label}
      disabled={props.disabled}
      type="button"
      data-shape-type={props.shapeType}
      style={{
        transition: "opacity 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease",
        cursor: props.disabled ? "default" : isDragging ? "grabbing" : "pointer",
      }}
    >
      {" "}
      <Icon name={props.iconName} color={color} className={"m-relative m-h-9 m-w-9 m-mb-1 m-m-auto " + (props.iconClassName ?? "") + (isDragging ? " m-transform m-scale-90" : "")}></Icon>
      {props.label}
    </button>
  );
}

export default RibbonShapeButton;
