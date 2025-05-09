// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef, useState } from "react";
import { type IEntityConfiguration } from "../../interfaces/configuration";
import iconService from "../../services/iconService";
import viewService from "../../services/viewService";
import Icon from "../common/Icon";

interface Props {
  entity: IEntityConfiguration;
  disabled?: boolean;
  draggable?: boolean;
  onClick?: () => void;
}

function RibbonEntityButton(props: Props) {
  const view = viewService.getView(props.entity.TypeId);
  const [icon, setIcon] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const iconImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    async function getToken() {
      const png = await iconService.getPNG(view.Icon, view.Color);
      setIcon(png);

      // Preload the image to ensure it's ready for drag operations
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
        iconImageRef.current = img;
      };
      img.src = png;
    }
    void getToken();
  }, [view]);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || props.draggable === false || props.disabled) return;

    const handleDragStart = (e: DragEvent) => {
      setIsDragging(true);

      // Create a custom drag ghost element
      if (e.dataTransfer) {
        // Create circular ghost element that matches the provided image
        const ghostElement = document.createElement("div");
        ghostElement.className = "m-flex m-items-center m-justify-center";
        ghostElement.style.width = "48px";
        ghostElement.style.height = "48px";
        ghostElement.style.borderRadius = "50%";
        ghostElement.style.border = `2px solid ${view.Color}`;
        ghostElement.style.backgroundColor = "white";
        ghostElement.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";

        // Container for the icon, centered in the circle
        if (icon && imageLoaded && iconImageRef.current) {
          const iconImg = iconImageRef.current.cloneNode() as HTMLImageElement;
          iconImg.className = "m-h-9 m-w-9"; // Smaller icon to fit nicely in the circle
          iconImg.style.objectFit = "contain";
          ghostElement.appendChild(iconImg);
        }

        // Add to document temporarily
        ghostElement.style.position = "absolute";
        ghostElement.style.top = "-1000px";
        ghostElement.style.opacity = "0.8";
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
            entityTypeId: props.entity.TypeId,
            name: props.entity.Name,
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
  }, [props.draggable, props.disabled, icon, props.entity, view.Color, imageLoaded]);

  const dragPreview =
    (isDragging ? "m-opacity-50" : "m-opacity-100") +
    " m-h-5 m-m-px m-inline-flex m-flex-row m-flex-nowrap m-items-center m-py-0 m-pl-0.5 m-pr-1 m-border m-border-transparent enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 disabled:m-opacity-50 disabled:m-cursor-default";

  return (
    <button ref={buttonRef} type="button" disabled={props.disabled} onClick={props.onClick} title={props.entity.Name} data-entity-type-id={props.entity.TypeId} className={dragPreview}>
      <span className="m-flex m-justify-center m-items-center">
        <span className="m-leading-4">
          <Icon color={view.Color} name={view.Icon} className="m-h-5 m-w-5" />
        </span>
      </span>
      <span className="m-ml-1">{props.entity.Name}</span>
    </button>
  );
}

export default RibbonEntityButton;
