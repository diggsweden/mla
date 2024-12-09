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
import { useEffect, useRef, useState } from 'react'
import useFabricEditing, { SHAPE_TYPE } from '../../../utils/fabric-editing'

const RIGHT_CLICK = 2

function DrawTabPanel() {
  const { t } = useTranslation();
  const config = viewService.getTheme()
  const canvas = useMainStore((state) => state.fabric)
  const sigma = useMainStore((state) => state.sigma)
  const setSelectedEntities = useMainStore((state) => state.setSelected)

  const [selected, setSelected] = useState([] as fabric.FabricObject[])
  const [shapeType, setShapeType] = useState(null as SHAPE_TYPE | null)
  
  const panStart = useRef({ x: 0, y: 0 })
  const pan = useRef(false)

  useEffect(() => {
    if (canvas != null && sigma != null) {
      setSelectedEntities([])
      const selectAction = ({ selected }: { selected: fabric.FabricObject[] }) => setSelected(selected)
      const clearSelection = () => setSelected([])
      const startPan = (e: fabric.TPointerEventInfo<MouseEvent>) => {
        if (e.e.button == RIGHT_CLICK && shapeType == null) {
          pan.current = true
          panStart.current = sigma.viewportToFramedGraph(e.viewportPoint)
          canvas.defaultCursor = 'grab'
        }
      }
      const panMove = (e: fabric.TPointerEventInfo<MouseEvent>) => {
        if (pan.current) {
          const pos = sigma.viewportToFramedGraph(e.viewportPoint)
          const camera = sigma.getCamera()
          const state = camera.getState()
          const update = { x: state.x + panStart.current.x - pos.x, y: state.y + panStart.current.y - pos.y }
          camera.setState(update)
        }
      }
      const stopPan = () => {
        pan.current = false
        canvas.defaultCursor = 'default'
      }

      canvas.on("selection:created", selectAction);
      canvas.on("selection:updated", selectAction);
      canvas.on("selection:cleared", clearSelection);
      canvas.on("mouse:down:before", startPan)
      canvas.on("mouse:move", panMove)
      canvas.on("mouse:up:before", stopPan)

      return () => {
        canvas.off("selection:created", selectAction);
        canvas.off("selection:updated", selectAction);
        canvas.off("selection:cleared", clearSelection);
        canvas.off("mouse:down:before", startPan)
        canvas.off("mouse:move", panMove)
        canvas.off("mouse:up:before", stopPan)

        canvas.discardActiveObject()
      }
    }
  }, [canvas, sigma, setSelected, setSelectedEntities, shapeType])

  useFabricEditing(canvas, shapeType, () => {
    unlockObjects()
    setShapeType(null)
    if (canvas) {
      canvas.defaultCursor = 'default'
    }
  })

  function drawShape(type: SHAPE_TYPE) {
    if (canvas == null) return

    canvas.selection = false;
    setSelected([]);
    setShapeType(type)
    canvas.defaultCursor = 'crosshair';
    lockObjects();
  }

  const lockObjects = () => {
    canvas?.getObjects().forEach((obj) => {
      obj.selectable = false;
      obj.evented = false;
    });
    canvas?.renderAll();
  };

  
  const unlockObjects = () => {
    canvas?.getObjects().forEach((obj) => {
        obj.selectable = true
        obj.evented = true
    })
    canvas?.renderAll()
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

  function setFillColor(color?: string) {
    selected.forEach(e => {
      if (e.type !== 'textbox') {
        e.set('fill', color ?? 'transparent')
      }
    })

    canvas?.renderAll()
  }

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title={t('text')} >
      <RibbonMenuButton label={t('textbox')} active={shapeType == "TEXT"} onClick={() => { drawShape("TEXT") }} iconName="format_shapes" />
    </RibbonMenuSection>
    <RibbonMenuDivider />
    <RibbonMenuSection title={t('shapes')} >
      <RibbonMenuButton label={t('rectangle')} active={shapeType == "RECT"} onClick={() => { drawShape("RECT") }} iconName="rectangle" />
      <RibbonMenuButton label={t('circle')} active={shapeType == "CIRCLE"} onClick={() => { drawShape("CIRCLE") }} iconName="circle" />
      <RibbonMenuButton label={t('ellipse')} active={shapeType == "ELLIPSE"} onClick={() => { drawShape("ELLIPSE") }} iconName="circle" />
      <RibbonMenuButton label={t('triangle')} active={shapeType == "TRIANGLE"} onClick={() => { drawShape("TRIANGLE") }} iconName="change_history" />
    </RibbonMenuSection>
    <RibbonMenuDivider />
    <RibbonMenuSection title={t('color')} >
      <RibbonMenuButtonGroup>
        <RibbonMenuColorPickerButton disabled={selected.length === 0} label={t('font color')} colors={config.CustomIconColorPicklist} onColorSelected={setFontColor} icon="format_color_text"></RibbonMenuColorPickerButton>
        <RibbonMenuColorPickerButton disabled={selected.length === 0} label={t('line color')} colors={config.CustomIconColorPicklist} onColorSelected={setForeColor} icon="border_color"></RibbonMenuColorPickerButton>
        <RibbonMenuColorPickerButton disabled={selected.length === 0} label={t('fill color')} colors={config.CustomContourColorPicklist} onColorSelected={setFillColor} icon="format_color_fill"></RibbonMenuColorPickerButton>
      </RibbonMenuButtonGroup>
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </div>
}
export default DrawTabPanel
