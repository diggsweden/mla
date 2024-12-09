// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from 'react'
import * as  fabric from 'fabric'

import Sigma from 'sigma'
import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'

function useFabricDrawing(renderer: Sigma | undefined) {
    const init = useMainStore(state => state.initFabric)
    const canvas = useRef(null as null | fabric.Canvas)
    const drawingMode = useAppStore(state => state.drawingMode)

    useEffect(() => {
        if (renderer == null) return

        const container = renderer.getContainer();
        if (canvas.current == null) {
            const canv = renderer.getCanvases()["fabric"] ?? renderer.createCanvas("fabric")

            canv.style["width"] = `${container.clientWidth}px`;
            canv.style["height"] = `${container.clientHeight}px`;
            canv.setAttribute("width", `${container.clientWidth}px`)
            canv.setAttribute("height", `${container.clientHeight}px`)

            const fab = new fabric.Canvas(canv);
            fab.selectionKey = 'ctrlKey'
            fab.selectionColor = 'rgba(151, 194, 252, 0.45)'
            fab.selectionBorderColor = 'rgba(78, 146, 237, 0.75)'
            fab.selectionDashArray = [5, 5]
            fab.elements.container.style.position = "absolute"
            fab.elements.container.style.zIndex = "-1"

            fab.setDimensions({ width: container.clientWidth, height: container.clientHeight });

            canvas.current = fab
        }

        const cam = renderer.getCamera();
        const handleZoom = () => {
            const e = cam.getState()
            const xy = renderer.graphToViewport(e)

            const center = { x: xy.x - container.clientWidth / 2, y: xy.y - container.clientHeight / 2 }
            const topLeft = { x: -center.x - container.clientWidth / 2, y: -center.y - container.clientHeight / 2 }

            const zoom = 1 / e.ratio

            canvas.current!.absolutePan(new fabric.Point(topLeft))
            canvas.current!.setZoom(zoom);
        }

        const handleResize = () => {
            const wscale = container.clientWidth / canvas.current!.getWidth();
            const hscale = container.clientHeight / canvas.current!.getHeight();
            const zoom = canvas.current!.getZoom()

            canvas.current!.setDimensions({ width: container.clientWidth, height: container.clientHeight });
            canvas.current!.setViewportTransform([zoom * wscale, 0, 0, zoom * hscale, 0, 0]);

            handleZoom()
        }

        const resize = new ResizeObserver(handleResize)
        handleResize()
        resize.observe(container)
        renderer.on("beforeRender", handleZoom)

        handleResize()

        init(canvas.current!)

        return () => {
            renderer.on("beforeRender", handleZoom)
            resize.unobserve(container)
        }
    }, [init, renderer])

    useEffect(() => {
        if (canvas.current != null) {
            canvas.current.elements.container.style.zIndex = drawingMode ? "1" : "-1"
        }

    }, [drawingMode])
}

export default useFabricDrawing