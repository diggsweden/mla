import { useEffect, useRef } from "react"
import * as fabric from 'fabric'
import { generateUUID } from "./utils"

export type SHAPE_TYPE = "CIRCLE" | "RECT" | "ELLIPSE" | "TRIANGLE" | "TEXT"
function useFabricEditing(canvas: fabric.Canvas | undefined, shapeType: SHAPE_TYPE | null, afterAdd: () => void) {
    const originX = useRef(0)
    const originY = useRef(0)
    const startPos = useRef({ x: 0, y: 0 })
    const shape = useRef(null as null | fabric.FabricObject)

    useEffect(() => {
        if (canvas == null) return

        // Circle
        const handleMouseDownCircle = (event: any) => {
            const id = generateUUID()
            const pointer = event.scenePoint
            const newCircle = new fabric.Circle({
                left: pointer.x,
                top: pointer.y,
                originX: 'center',
                originY: 'center',
                radius: 0,
                fill: 'transparent',
                stroke: 'black',
                strokeWidth: 2,
                strokeUniform: true,
                selectable: true,
                hasControls: true,
                id,
            })
            originX.current = pointer.x
            originY.current = pointer.y

            canvas.add(newCircle)
            shape.current = newCircle
        }

        const handleMouseMoveCircle = (event: any) => {
            if (shape.current) {
                const pointer = event.scenePoint
                const radius = Math.hypot(pointer.x - originX.current, pointer.y - originY.current)
                shape.current.set({ radius })
            }
        }

        // Rect
        const handleMouseDownRect = (event: any) => {
            const id = generateUUID()
            const pointer = event.scenePoint
            originX.current = pointer.x
            originY.current = pointer.y
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
                strokeWidth: 2,
                strokeUniform: true,
                selectable: true,
                hasControls: true,
                id,
            })
            canvas.add(newRectangle)
            shape.current = newRectangle
        }

        const handleMouseMoveRect = (event: any) => {
            if (shape.current) {
                const pointer = event.scenePoint
                shape.current.set({
                    width: Math.abs(originX.current - pointer.x),
                    height: Math.abs(originY.current - pointer.y),
                })
                if (originX > pointer.x) {
                    shape.current.set({ left: pointer.x })
                }
                if (originY > pointer.y) {
                    shape.current.set({ top: pointer.y })
                }
            }
        }

        // Ellipse
        const handleMouseDownEllipse = (event: any) => {
            const id = generateUUID()
            const pointer = event.scenePoint
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
                strokeWidth: 2,
                strokeUniform: true,
                selectable: true,
                hasControls: true,
                id,
            })

            canvas.add(newEllipse)
            shape.current = newEllipse
        }

        const handleMouseMoveEllipse = (event: any) => {
            if (shape.current) {
                const pointer = event.scenePoint
                const rx = Math.abs(pointer.x - shape.current.left)
                const ry = Math.abs(pointer.y - shape.current.top)

                shape.current.set({ rx, ry })
            }
        }

        // Triangle
        const handleMouseDownTriangle = (event: any) => {
            const id = generateUUID()
            const pointer = event.scenePoint
            startPos.current = { x: pointer.x, y: pointer.y }
            const newTriangle = new fabric.Triangle({
                absolutePositioned: true,
                left: pointer.x,
                top: pointer.y,
                width: 0,
                height: 0,
                fill: 'transparent',
                stroke: 'black',
                strokeWidth: 2,
                strokeUniform: true,
                selectable: true,
                hasControls: true,
                id,
            })
            canvas.add(newTriangle)
            shape.current = newTriangle
        }

        const handleMouseMoveTriangle = (event: any) => {
            if (shape.current) {
                const pointer = event.scenePoint
                const width = Math.abs(pointer.x - startPos.current.x)
                const height = Math.abs(pointer.y - startPos.current.y)
                shape.current.set({
                    width,
                    height,
                    left: Math.min(pointer.x, startPos.current.x),
                    top: Math.min(pointer.y, startPos.current.y),
                })
            }
        }

        // Text
        const handleMouseDownText = (event: any) => {
            const id = generateUUID()
            const pointer = event.scenePoint
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
            })
            canvas.add(newText)
            shape.current = newText
        }

        const handleMouseDown = (event: any) => {
            if (shapeType == null) return

            switch (shapeType) {
                case 'CIRCLE':
                    handleMouseDownCircle(event)
                    break
                case 'RECT':
                    handleMouseDownRect(event)
                    break
                case 'ELLIPSE':
                    handleMouseDownEllipse(event)
                    break
                case 'TRIANGLE':
                    handleMouseDownTriangle(event)
                    break
                case 'TEXT':
                    handleMouseDownText(event)
                    break
                default:
                    break
            }

            canvas.renderAll()
        }

        const handleMouseMove = (event: any) => {
            switch (shapeType) {
                case 'CIRCLE':
                    handleMouseMoveCircle(event)
                    break
                case 'RECT':
                    handleMouseMoveRect(event)
                    break
                case 'ELLIPSE':
                    handleMouseMoveEllipse(event)
                    break
                case 'TRIANGLE':
                    handleMouseMoveTriangle(event)
                    break
                default:
                    break
            }

            canvas.renderAll()
        }

        const handleMouseUp = () => {
            if (shape.current) {
                canvas.selection = true
                canvas.setActiveObject(shape.current)
                shape.current = null

                afterAdd()
            }
        }

        canvas.on('mouse:down', handleMouseDown)
        canvas.on('mouse:move', handleMouseMove)
        canvas.on('mouse:up', handleMouseUp)

        return () => {
            if (canvas) {
                canvas.off('mouse:down', handleMouseDown)
                canvas.off('mouse:move', handleMouseMove)
                canvas.off('mouse:up', handleMouseUp)
            }
        }
    }, [afterAdd, canvas, shapeType])
}

export default useFabricEditing