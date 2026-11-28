// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

// The red, green and blue of a color written as #rgb, #rrggbb or rgb(r, g, b), or undefined for any other color
function channels (color: string): [number, number, number] | undefined {
  const value = color.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].split('').map(d => d + d) : hex[1].match(/../g)!
    return digits.map(d => parseInt(d, 16)) as [number, number, number]
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(value)
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  }
  return undefined
}

// How much of its own color a phase shows, mixed with white, so that it looks soft
export const PHASE_OPACITY = 0.1

// The color of text that can be read on a background: black on light colors and white on dark ones.
// A background that is partly transparent is read as it looks over white
export function textColorOn (background: string, opacity = 1): string {
  const rgb = channels(background)
  if (rgb == null) {
    return '#000000'
  }
  const [r, g, b] = rgb.map(c => {
    const s = (c * opacity + 255 * (1 - opacity)) / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  // The text that has the most contrast with the background
  return luminance > 0.179 ? '#111827' : '#ffffff'
}

// A color as it looks when it is partly transparent over white, or the color as it is when it can not be read.
// It is solid, so that nothing behind it shows through
export function overWhite (color: string, opacity: number): string {
  const rgb = channels(color)
  return rgb == null ? color : `rgb(${rgb.map(c => Math.round(c * opacity + 255 * (1 - opacity))).join(', ')})`
}

// The background and the text of a phase with a color of its own
export function phaseStyle (color: string): { background: string, color: string } {
  return { background: overWhite(color, PHASE_OPACITY), color: textColorOn(color, PHASE_OPACITY) }
}
