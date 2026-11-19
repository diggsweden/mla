// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { IColor } from "../../interfaces/configuration/theme-configuration";

interface Props {
  // The colors of the theme, that are shown first
  colors?: IColor[];
  // Called with the color, or with nothing when the color is reset
  onSelect: (color?: string) => void;
  // Leaves out the reset of the color
  noReset?: boolean;
  // Text has its own default colors, shape has the ones for lines and backgrounds
  kind?: "text" | "shape";
  // The title of a choice for no color at all, like "No fill". The choice is left out without it
  noneLabel?: string;
}

interface DefaultColor {
  // Also the key of the title, which is translated
  name: string;
  color: string;
}

// The default colors of text, that has to be readable on a light background
const TEXT_COLORS: DefaultColor[] = [
  { name: "black", color: "#000000" },
  { name: "dark gray", color: "#444444" },
  { name: "gray", color: "#808080" },
  { name: "white", color: "#ffffff" },
  { name: "dark blue", color: "#446995" },
  { name: "blue", color: "#4169E1" },
  { name: "green", color: "#008000" },
  { name: "red", color: "#C00000" },
  { name: "purple", color: "#800080" },
  { name: "orange", color: "#C55A11" },
];

// The default colors of lines and backgrounds, shown in this order
const SHAPE_COLORS: DefaultColor[] = [
  { name: "white", color: "#ffffff" },
  { name: "dark blue", color: "#446995" },
  { name: "blue", color: "#4169E1" },
  { name: "green", color: "#008000" },
  { name: "red", color: "#FF4040" },
  { name: "yellow", color: "#FFD700" },
  { name: "purple", color: "#800080" },
  { name: "orange", color: "#FFA500" },
];

// The title of a group of colors, that is only text and is set apart from the group above it by a line
const heading = "m:pt-2 m:pb-1 m:px-2 m:text-base m:font-semibold";

const swatch ="m:w-4 m:h-4 m:outline-1 m:outline-blue-400 m:outline-none m:hover:outline-solid";
// The default colors have an edge, since some of them are as light as the menu
const defaultSwatch = `${swatch} m:border m:border-gray-300`;

// Makes a box work with the keyboard as well
const pressable = (onPress: () => void) => ({
  role: "button",
  tabIndex: 0,
  onClick: onPress,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPress();
    }
  },
});

// The content of a menu where a color is chosen
function ColorPalette(props: Props) {
  const { t } = useTranslation();

  return (
    <>
      {props.colors != null && props.colors.length > 0 && (
        <div>
          <div className={heading}>{t("theme colors")}</div>
          <div className="m:flex m:flex-wrap m:gap-1 m:p-1">
            {props.colors.map((c) => (
              <div
                key={c.Name}
                title={c.Name}
                {...pressable(() => {
                  props.onSelect(c.Color);
                })}
                className={swatch}
                style={{ backgroundColor: c.Color }}
              ></div>
            ))}
          </div>
        </div>
      )}
      <div className={heading + " m:border-t m:border-gray-300 m:mt-1"}>{t("default colors")}</div>
      <div className="m:flex m:gap-1 m:p-1">
        {(props.kind === "text" ? TEXT_COLORS : SHAPE_COLORS).map((c) => (
          <div
            key={c.name}
            title={t(c.name)}
            {...pressable(() => {
              props.onSelect(c.color);
            })}
            className={defaultSwatch}
            style={{ backgroundColor: c.color }}
          ></div>
        ))}
      </div>
      {props.noneLabel != null && (
        <div className="m:border-t m:border-gray-300 m:mt-1">
          <div
            {...pressable(() => {
              props.onSelect("transparent");
            })}
            className="m:flex m:text-sm m:text-left m:border-none m:hover:bg-blue-100 m:text-gray-700 m:p-1 m:whitespace-nowrap"
          >
            <div className="m:w-4 m:h-4 m:border m:bg-white m:border-gray-400 m:mr-2"></div>
            {props.noneLabel}
          </div>
        </div>
      )}
      {props.noReset !== true && (
        <div
          {...pressable(() => {
            props.onSelect(undefined);
          })}
          className="m:flex m:text-sm m:text-left m:border-none m:hover:bg-blue-100 m:text-gray-700 m:p-1 m:whitespace-nowrap"
        >
          <div className="m:w-4 m:h-4 m:border m:bg-gray-100 m:border-gray-400 m:mr-2"></div>
          {t("reset color")}
        </div>
      )}
    </>
  );
}

export default ColorPalette;
