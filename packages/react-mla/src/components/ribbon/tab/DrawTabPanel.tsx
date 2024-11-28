// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useMainStore from '../../../store/main-store'
import viewService from '../../../services/viewService'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import { useTranslation } from 'react-i18next'
import * as fabric from 'fabric'
import RibbonMenuColorPickerButton from '../RibbonMenuColorPickerButton'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'

function DrawTabPanel () {
  const { t } = useTranslation();
  const config = viewService.getTheme()
  const canvas = useMainStore((state) => state.fabric)
  const selection = [] // useMainStore((state) => state.selectedIds)

  function addText() {
    if (canvas == null) return

    document.body.style.setProperty('cursor', 'crosshair', 'important')
    canvas.setCursor("crosshair")

    const action = (e: any) => {
      canvas.off("mouse:down", action)
      document.body.style.removeProperty('cursor')
      canvas.setCursor("default")

      const text = new fabric.Textbox("Text", {
        absolutePositioned: true,
        left: e.scenePoint.x,
        top: e.scenePoint.y,
      })

      console.log(text)
      canvas.add(text)
    }

    canvas.on("mouse:down", action)
  }

  function addRectangle() {
    if (canvas == null) return

    document.body.style.setProperty('cursor', 'crosshair', 'important')
    canvas.setCursor("crosshair")

    const action = (e: any) => {
      canvas.off("mouse:down", action)
      document.body.style.removeProperty('cursor')
      canvas.setCursor("default")

      console.log(e)

      const rect = new fabric.Rect({
        absolutePositioned: true,
        left: e.scenePoint.x,
        top: e.scenePoint.y,
        width: 100,
        height: 100,
        stroke: 'black',
        strokeWidth: 3,
        fill:'transparent'
      })

      console.log(rect)

      canvas.add(rect)
    }

    canvas.on("mouse:down", action)
  }

  function setForeColor () {
    // updateEntity(
    //   ...selectedEntities.map(e => produce(e, draft => {
    //     draft.Color = color
    //   }))
    // )
    // updateLink(
    //   ...selectedLinks.map(e => produce(e, draft => {
    //     draft.Color = color
    //   }))
    // )
  }

  function setFillColor () {
    // console.log(color)
    // updateEntity(
    //   ...selectedEntities.map(e => produce(e, draft => {
    //     draft.MarkColor = color
    //     draft.MarkIcon = color !== undefined ? 'outlined_circle' : undefined
    //   }))
    // )
    // updateLink(
    //   ...selectedLinks.map(e => produce(e, draft => {
    //     draft.MarkColor = color
    //   }))
    // )
  }

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title={t('text')} >
      <RibbonMenuButton label={t('textbox')} onClick={addText} iconName="format_shapes" />
    </RibbonMenuSection>
    <RibbonMenuDivider />
    <RibbonMenuSection title={t('shapes')} >
      <RibbonMenuButton label={t('rectangle')} onClick={addRectangle} iconName="rectangle" />
      <RibbonMenuButton label={t('circle')} onClick={addRectangle} iconName="circle" />
    </RibbonMenuSection>
    <RibbonMenuDivider />
    <RibbonMenuSection title={t('color')} >
      <RibbonMenuButtonGroup>
        <RibbonMenuColorPickerButton disabled={selection.length === 0} label={t('font color')} colors={ config.CustomIconColorPicklist } onColorSelected={() => { setForeColor() }}  icon="format_color_text"></RibbonMenuColorPickerButton>
        <RibbonMenuColorPickerButton disabled={selection.length === 0} label={t('line color')} colors={ config.CustomIconColorPicklist } onColorSelected={() => { setForeColor() }}  icon="border_color"></RibbonMenuColorPickerButton>
        <RibbonMenuColorPickerButton disabled={selection.length === 0} label={t('fill color')} colors={ config.CustomContourColorPicklist } onColorSelected={() => { setFillColor() }} icon="format_color_fill"></RibbonMenuColorPickerButton>
      </RibbonMenuButtonGroup>
      </RibbonMenuSection>
    <RibbonMenuDivider />

  </div>
}
export default DrawTabPanel
