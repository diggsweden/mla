// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { StrokeStyle } from '../../interfaces/data-models/shape'
import { strokeDash } from '../chart/shapes/shape-render'
import Icon from '../common/Icon'

const STROKE_WIDTHS = [1, 2, 3, 4, 6, 8]
const STROKE_STYLES: StrokeStyle[] = ['solid', 'dashed', 'dotted']

interface Props {
  // The value that all of the selected shapes have, or nothing when they differ
  width: number | ''
  style: StrokeStyle | ''
  onWidth: (width: number) => void
  onStyle: (style: StrokeStyle) => void
}

// A line as it is drawn on the chart
function LinePreview (props: { width: number, style: StrokeStyle }) {
  return <svg width="64" height="12" className="m:shrink-0" aria-hidden="true">
    <line
      x1={props.width} y1="6" x2={64 - props.width} y2="6"
      stroke="currentColor" strokeWidth={props.width}
      strokeDasharray={strokeDash(props.style, props.width).join(' ')}
      strokeLinecap={props.style === 'dotted' ? 'round' : 'butt'}
    />
  </svg>
}

const pressable = (onPress: () => void) => ({
  role: 'button',
  tabIndex: 0,
  onClick: onPress,
  onKeyDown: (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPress()
    }
  }
})

// A row of the menu that opens a menu beside it, like the ones of the Office programs
function SubMenu (props: { icon: string, label: string, children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div
    className="m:relative"
    onMouseEnter={() => { setOpen(true) }}
    onMouseLeave={() => { setOpen(false) }}
  >
    <div
      {...pressable(() => { setOpen(!open) })}
      aria-haspopup="menu"
      aria-expanded={open}
      className={(open ? 'm:bg-blue-100 ' : '') + 'm:flex m:items-center m:gap-2 m:p-1 m:pr-2 m:whitespace-nowrap m:hover:bg-blue-100'}
    >
      <Icon name={props.icon} className="m:text-primary m:h-4 m:w-4" />
      <span className="m:grow">{props.label}</span>
      <Icon name="outlined_arrow_left" className="m:text-primary m:h-4 m:w-4 m:rotate-180" />
    </div>
    {open && <div className="m:absolute m:left-full m:top-0 m:bg-white m:shadow-sm m:border m:border-gray-300 m:py-1">
      {props.children}
    </div>}
  </div>
}

function Choice (props: { selected: boolean, onSelect: () => void, children: ReactNode }) {
  return <div
    {...pressable(props.onSelect)}
    aria-pressed={props.selected}
    className={(props.selected ? 'm:bg-gray-200 ' : '') + 'm:flex m:items-center m:justify-between m:gap-3 m:px-3 m:py-1 m:whitespace-nowrap m:hover:bg-blue-100'}
  >
    {props.children}
  </div>
}

// The rows for the width and the style of a line, to be put under the colors of the line
function ShapeStrokeMenu (props: Props) {
  const { t } = useTranslation()

  return <div className="m:border-t m:border-gray-300 m:mt-1">
    <SubMenu icon="line_weight" label={t('line width')}>
      {STROKE_WIDTHS.map(width => <Choice key={width} selected={props.width === width} onSelect={() => { props.onWidth(width) }}>
        <span className="m:w-8 m:text-right">{width} px</span>
        <LinePreview width={width} style="solid" />
      </Choice>)}
    </SubMenu>
    <SubMenu icon="line_style" label={t('line style')}>
      {STROKE_STYLES.map(style => <Choice key={style} selected={props.style === style} onSelect={() => { props.onStyle(style) }}>
        <span>{t(style)}</span>
        <LinePreview width={2} style={style} />
      </Choice>)}
    </SubMenu>
  </div>
}

export default ShapeStrokeMenu
