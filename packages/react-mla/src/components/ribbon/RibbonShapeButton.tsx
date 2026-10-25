// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import Icon from '../common/Icon'
import viewService from '../../services/viewService'
import type { ShapeType } from '../../interfaces/data-models/shape'
import { startShapeDrag } from '../chart/shapes/shape-drag'

interface Props {
  shapeType: ShapeType
  label: string
  iconName: string
  active?: boolean
  onClick: () => void
}

// A button for a type of shape. Press it and draw the shape on the chart, or drag it to the place where the shape is wanted
function RibbonShapeButton (props: Props) {
  const theme = viewService.getTheme()

  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => { startShapeDrag(event, props.shapeType) }}
      className={(props.active ? 'm:border-blue-300 m:bg-blue-100 ' : 'm:border-transparent ') + 'm:min-w-[64px] m:m-1 m:mb-2 m:px-1 m:text-base m:border m:enabled:hover:bg-blue-100 m:enabled:hover:border-blue-400'}
      onClick={props.onClick}
      title={props.label}
      aria-pressed={props.active}
    >
      <Icon name={props.iconName} color={theme.Icon} className="m:relative m:h-9 m:w-9 m:mb-1 m:m-auto"></Icon>
      {props.label}
    </button>
  )
}

export default RibbonShapeButton
