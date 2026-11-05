// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from 'react-i18next'
import type { IShape, ShapeType } from '../../../interfaces/data-models/shape'
import viewService from '../../../services/viewService'
import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'
import ColorPalette from '../../common/ColorPalette'
import { DEFAULT_FONT_SIZE, DEFAULT_STROKE_WIDTH, fitText } from '../../chart/shapes/shape-render'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuDropDownIconButton from '../RibbonMenuDropDownIconButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonShapeButton from '../RibbonShapeButton'
import ShapeStrokeMenu from '../ShapeStrokeMenu'

const FONT_SIZES = [10, 12, 14, 16, 20, 24, 32, 48]

// The value that all of the shapes have, or nothing when they differ
function commonValue<T extends string | number> (values: T[]): T | '' {
  return values.length > 0 && values.every(v => v === values[0]) ? values[0] : ''
}

function DrawTabPanel () {
  const { t } = useTranslation()
  const config = viewService.getTheme()
  const shapeTool = useAppStore((state) => state.shapeTool)
  const setShapeTool = useAppStore((state) => state.setShapeTool)
  const shapes = useMainStore((state) => state.shapes)
  const selectedShapeIds = useMainStore((state) => state.selectedShapeIds)
  const updateShapes = useMainStore((state) => state.updateShapes)

  const selected = shapes.filter(s => selectedShapeIds.includes(s.Id))
  const texts = selected.filter(s => s.Type === 'text')

  // The tool is for one shape, and pressing the button of the tool again puts it away
  function selectTool (type: ShapeType) {
    setShapeTool(shapeTool === type ? undefined : type)
  }

  function change (of: IShape[], update: (shape: IShape) => IShape) {
    updateShapes(...of.map(update))
  }

  return <div className="m:flex m:text-center m:h-full m:p-1">
    <RibbonMenuSection title={t('shapes')}>
      <RibbonShapeButton shapeType="text" iconName="format_shapes" label={t('textbox')} active={shapeTool === 'text'} onClick={() => { selectTool('text') }} />
      <RibbonShapeButton shapeType="rectangle" iconName="rectangle" label={t('rectangle')} active={shapeTool === 'rectangle'} onClick={() => { selectTool('rectangle') }} />
      <RibbonShapeButton shapeType="ellipse" iconName="circle" label={t('ellipse')} active={shapeTool === 'ellipse'} onClick={() => { selectTool('ellipse') }} />
      <RibbonShapeButton shapeType="line" iconName="horizontal_rule" label={t('line')} active={shapeTool === 'line'} onClick={() => { selectTool('line') }} />
    </RibbonMenuSection>
    <RibbonMenuDivider />

    <RibbonMenuSection title={t('color')}>
      <RibbonMenuButtonGroup>
        <RibbonMenuDropDownIconButton disabled={texts.length === 0} label={t('font color')} icon="format_color_text">
          <ColorPalette kind="text" noReset colors={config.CustomContourColorPicklist} onSelect={(color) => { change(texts, s => ({ ...s, FontColor: color })) }} />
        </RibbonMenuDropDownIconButton>
        <RibbonMenuDropDownIconButton disabled={selected.length === 0} label={t('line color')} icon="border_color">
          <ColorPalette noReset noneLabel={t('no outline')} colors={config.CustomContourColorPicklist} onSelect={(color) => { change(selected, s => ({ ...s, StrokeColor: color })) }} />
          <ShapeStrokeMenu
            width={commonValue(selected.map(s => s.StrokeWidth ?? DEFAULT_STROKE_WIDTH))}
            style={commonValue(selected.map(s => s.StrokeStyle ?? 'solid'))}
            onWidth={(width) => { change(selected, s => ({ ...s, StrokeWidth: width })) }}
            onStyle={(style) => { change(selected, s => ({ ...s, StrokeStyle: style })) }}
          />
        </RibbonMenuDropDownIconButton>
        <RibbonMenuDropDownIconButton disabled={selected.length === 0 || selected.every(s => s.Type === 'line')} label={t('fill color')} icon="format_color_fill">
          <ColorPalette noReset noneLabel={t('no fill')} colors={config.CustomContourColorPicklist} onSelect={(color) => { change(selected.filter(s => s.Type !== 'line'), s => ({ ...s, FillColor: color })) }} />
        </RibbonMenuDropDownIconButton>
      </RibbonMenuButtonGroup>
    </RibbonMenuSection>
    <RibbonMenuDivider />

    <RibbonMenuSection title={t('text')}>
      <div className="m:text-left m:p-1">
        <label className="m:block m:text-sm m:mb-1" htmlFor="m-shape-font-size">{t('font size')}</label>
        <select
          id="m-shape-font-size"
          disabled={texts.length === 0}
          value={commonValue(texts.map(s => s.FontSize ?? DEFAULT_FONT_SIZE))}
          onChange={(e) => { change(texts, s => fitText({ ...s, FontSize: Number(e.target.value) })) }}
          className="m:bg-white m:border m:border-gray-300 m:text-gray-900 m:rounded-lg m:p-1 m:disabled:opacity-50"
        >
          <option value="" disabled hidden></option>
          {FONT_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
        </select>
      </div>
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </div>
}

export default DrawTabPanel
