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
import { useEffect, useState } from 'react'

function DrawTabPanel () {
  const { t } = useTranslation();
  const config = viewService.getTheme()
  const canvas = useMainStore((state) => state.fabric)
  const setSelectedEntities = useMainStore((state) => state.setSelected)
  const [selected, setSelected] = useState([] as fabric.FabricObject[])

  useEffect(() => {
    if (canvas) {
      setSelectedEntities([])
      const selectAction = ({ selected }: { selected: fabric.FabricObject[]}) => setSelected(selected)
      const clearSelection = () => setSelected([])

      canvas.on("selection:created", selectAction);
      canvas.on("selection:updated", selectAction);
      canvas.on("selection:cleared", clearSelection);

      return () => {
        canvas.off("selection:created", selectAction);
        canvas.off("selection:updated", selectAction);
        canvas.off("selection:cleared", clearSelection);
      }
    }
  }, [canvas, setSelected, setSelectedEntities])

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

  function setFontColor(color?: string) {
    selected.forEach(e => {
      if (e.type === 'textbox') {
        e.set('fill', color ?? 'black')
      }
    })

    canvas?.renderAll()
  }

  function setForeColor(color?: string) {
    selected.forEach(e => {
      e.set('stroke', color ?? 'black')
    })

    canvas?.renderAll()
  }

  function setFillColor (color?: string) {
    selected.forEach(e => {
      if (e.type !== 'textbox') {
        e.set('fill', color ?? 'transparent')
      }
    })

    canvas?.renderAll()
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
        <RibbonMenuColorPickerButton disabled={selected.length === 0} label={t('font color')} colors={ config.CustomIconColorPicklist } onColorSelected={setFontColor}  icon="format_color_text"></RibbonMenuColorPickerButton>
        <RibbonMenuColorPickerButton disabled={selected.length === 0} label={t('line color')} colors={ config.CustomIconColorPicklist } onColorSelected={setForeColor}  icon="border_color"></RibbonMenuColorPickerButton>
        <RibbonMenuColorPickerButton disabled={selected.length === 0} label={t('fill color')} colors={ config.CustomContourColorPicklist } onColorSelected={setFillColor} icon="format_color_fill"></RibbonMenuColorPickerButton>
      </RibbonMenuButtonGroup>
      </RibbonMenuSection>
    <RibbonMenuDivider />

  </div>
}
export default DrawTabPanel
