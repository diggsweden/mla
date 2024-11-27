// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import { useTranslation } from 'react-i18next'
import * as fabric from 'fabric'

function DrawTabPanel () {
  const { t } = useTranslation();

  const canvas = useMainStore((state) => state.fabric)

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

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title={t('skapa')} >
      <RibbonMenuButton label={t('text')} onClick={addText} iconName="format_shapes" />
      <RibbonMenuButton label={t('rektangel')} onClick={addRectangle} iconName="rectangle" />
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </div>
}
export default DrawTabPanel
