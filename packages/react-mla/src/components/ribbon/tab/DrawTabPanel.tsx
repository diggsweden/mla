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
import { generateUUID } from '../../../utils/utils'

function DrawTabPanel () {
  const { t } = useTranslation();
  const config = viewService.getTheme()
  const canvas = useMainStore((state) => state.fabric)
  const setSelectedEntities = useMainStore((state) => state.setSelected)

  const [selected, setSelected] = useState([] as fabric.FabricObject[])

  const [isDrawing, setIsDrawing] = useState(false);
  const [shape, setShape] = useState(Object || null);
  const [shapeType, setShapeType] = useState('CIRCLE');
  const [originX, setOriginX] = useState(0);
  const [originY, setOriginY] = useState(0);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

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
        canvas.discardActiveObject()
      }
    }
  }, [canvas, setSelected, setSelectedEntities])

  useEffect(() => {
    if (canvas == null) return

    // Circle
    const handleMouseDownCircle = (event: any) => {
      if (canvas == null) return

      const id = generateUUID();
      const pointer = event.scenePoint;
      const newCircle = new fabric.Circle({
        left: pointer.x,
        top: pointer.y,
        originX: 'center',
        originY: 'center',
        radius: 0,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 3,
        strokeUniform: true,
        selectable: true,
        hasControls: true,
        id,
      });
      setOriginX(pointer.x);
      setOriginY(pointer.y);
      canvas.add(newCircle);
      setShape(newCircle);
      setIsDrawing(true);
    };

    const handleMouseMoveCircle = (event: any) => {
      if (canvas == null) return

      if (isDrawing && shape) {
        const pointer = event.scenePoint;
        const radius = Math.hypot(pointer.x - originX, pointer.y - originY);
        shape.set({ radius });
        canvas.renderAll();
      }
    };

    // Rect
    const handleMouseDownRect = (event: any) => {
      if (canvas == null) return
      const id = generateUUID();
      const pointer = event.scenePoint;
      setOriginX(pointer.x);
      setOriginY(pointer.y);
      const newRectangle = new fabric.Rect({
        absolutePositioned: true,
        left: pointer.x,
        top: pointer.y,
        originX: 'left',
        originY: 'top',
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 3,
        strokeUniform: true,
        selectable: true,
        hasControls: true,
        id,
      });
      canvas.add(newRectangle);
      setShape(newRectangle);
      setIsDrawing(true);
    };

    const handleMouseMoveRect = (event: any) => {
    if (canvas == null) return
    if (isDrawing && shape) {
      const pointer = event.scenePoint;
      shape.set({
        width: Math.abs(originX - pointer.x),
        height: Math.abs(originY - pointer.y),
      });
      if (originX > pointer.x) {
        shape.set({ left: pointer.x });
      }
      if (originY > pointer.y) {
        shape.set({ top: pointer.y });
      }
      canvas.renderAll();
    }
    };

    // Ellipse
    const handleMouseDownEllipse = (event: any) => {
    if (canvas == null) return
    const id = generateUUID();
    const pointer = event.scenePoint;
    const newEllipse = new fabric.Ellipse({
      absolutePositioned: true,
      left: pointer.x,
      top: pointer.y,
      originX: 'center',
      originY: 'center',
      rx: 0,
      ry: 0,
      fill: 'transparent',
      stroke: 'black',
      strokeWidth: 3,
      strokeUniform: true,    
      selectable: true,
      hasControls: true,
      id,
    });
    canvas.add(newEllipse);
    setShape(newEllipse);
    setIsDrawing(true);
    };

    const handleMouseMoveEllipse = (event: any) => {
    if (canvas == null) return
    if (isDrawing && shape) {
      const pointer = event.scenePoint;
      const rx = Math.abs(pointer.x - shape.left);
      const ry = Math.abs(pointer.y - shape.top);
      shape.set({ rx, ry });
      canvas.renderAll();
    }
    };

    // Triangle
    const handleMouseDownTriangle = (event: any) => {
    if (canvas == null) return
    const id = generateUUID();
    const pointer = event.scenePoint;
    setStartPos({ x: pointer.x, y: pointer.y });
    const newTriangle = new fabric.Triangle({
      absolutePositioned: true,
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: 'black',
      strokeWidth: 3,
      strokeUniform: true,
      selectable: true,
      hasControls: true,
      id,
    });
    canvas.add(newTriangle);
    setShape(newTriangle);
    setIsDrawing(true);
    };

    const handleMouseMoveTriangle = (event: any) => {
    if (canvas == null) return
    if (isDrawing && shape) {
      const pointer = event.scenePoint;
      const width = Math.abs(pointer.x - startPos.x);
      const height = Math.abs(pointer.y - startPos.y);
      shape.set({
        width,
        height,
        left: Math.min(pointer.x, startPos.x),
        top: Math.min(pointer.y, startPos.y),
      });
      canvas.renderAll();
    }
    };

    // Text
    const handleMouseDownText = (event: any) => {
    if (canvas == null) return
    const id = generateUUID();
    const pointer = event.scenePoint;
    const newText = new fabric.Textbox('Text', {
      absolutePositioned: true,
      left: pointer.x,
      top: pointer.y,
      fill: 'black',
      fontSize: 20,
      editable: true,
      selectable: true,
      hasControls: true,
      id,
    });
    canvas.add(newText);
    setShape(newText);
    setIsDrawing(true);
    };

    const handleMouseDown = (event: any) => {
      if (!isDrawing) return;

      switch (shapeType) {
        case 'CIRCLE':
          handleMouseDownCircle(event);
          break;
        case 'RECT':
          handleMouseDownRect(event);
          break;
        case 'ELLIPSE':
          handleMouseDownEllipse(event);
          break;
        case 'TRIANGLE':
          handleMouseDownTriangle(event);
          break;
        case 'TEXT':
          handleMouseDownText(event);
          break;
        default:
          break;
      }
    };
  
    const handleMouseMove = (event: any) => {
      switch (shapeType) {
        case 'CIRCLE':
          handleMouseMoveCircle(event);
          break;
        case 'RECT':
          handleMouseMoveRect(event);
          break;
        case 'ELLIPSE':
          handleMouseMoveEllipse(event);
          break;
        case 'TRIANGLE':
          handleMouseMoveTriangle(event);
          break;
        default:
          break;
      }
    };
    
    // Function to unlock (enable interaction) all objects on canvas
    const unlockObjects = () => {
      canvas?.getObjects().forEach((obj) => {
        obj.selectable = true;
        obj.evented = true;
      });
      canvas?.renderAll();
    };  

    const handleMouseUp = () => {
      if (isDrawing && shape) {
        canvas.selection = true;
        canvas.setActiveObject(shape)
        setIsDrawing(false);
        unlockObjects();
        setShape(null);
        if (canvas) {
          canvas.defaultCursor = 'default';
        }
      }
    };    

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
  
    return () => {
      if (canvas) {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
      }
    };
  }, [shapeType, isDrawing, shape, originX, originY, startPos, canvas]);

  function drawShape(shapeType: string) {
    if (canvas == null) return

    canvas.selection = false;
    setSelected([]);
    setShapeType(shapeType);
    setIsDrawing(true); // Set drawing mode to true
    canvas.defaultCursor = 'crosshair'; // Change cursor to crosshair
    lockObjects(); // Lock objects on canvas
  }

  // Function to lock (disable interaction) all objects on canvas
  const lockObjects = () => {
    canvas?.getObjects().forEach((obj) => {
      obj.selectable = false;
      obj.evented = false;
    });
    canvas?.renderAll();
  };

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
      <RibbonMenuButton label={t('textbox')} active={isDrawing && shapeType=="TEXT"} onClick={() => { drawShape("TEXT")}} iconName="format_shapes" />
    </RibbonMenuSection>
    <RibbonMenuDivider />
    <RibbonMenuSection title={t('shapes')} >
      <RibbonMenuButton label={t('rectangle')} active={isDrawing && shapeType=="RECT"} onClick={() => { drawShape("RECT")}} iconName="rectangle" />
      <RibbonMenuButton label={t('circle')} active={isDrawing && shapeType=="CIRCLE"} onClick={() => { drawShape("CIRCLE")}} iconName="circle" />
      <RibbonMenuButton label={t('ellipse')} active={isDrawing && shapeType=="ELLIPSE"} onClick={() => { drawShape("ELLIPSE")}} iconName="circle" />
      <RibbonMenuButton label={t('triangle')} active={isDrawing && shapeType=="TRIANGLE"} onClick={() => { drawShape("TRIANGLE")}} iconName="change_history" />
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
