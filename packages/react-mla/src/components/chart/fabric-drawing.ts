// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from 'react'
import * as  fabric from 'fabric'

import Sigma from 'sigma'
import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'
import { CameraState } from 'sigma/types'

// https://jsfiddle.net/gncabrera/hkee5L6d/5/

function useFabricDrawing(renderer: Sigma | undefined) {
    const init = useMainStore(state => state.initFabric)
    const canvas = useRef(null as null | fabric.Canvas)
    const drawingMode = useAppStore(state => state.drawingMode)

    useEffect(() => {
        if (renderer == null) return

        const canv = renderer.getCanvases()["fabric"] ?? renderer.createCanvas("fabric")
        const container = renderer.getContainer();

        canv.style["width"] = `${container.clientWidth}px`;
        canv.style["height"] = `${container.clientHeight}px`;
        canv.setAttribute("width", `${container.clientWidth}px`)
        canv.setAttribute("height", `${container.clientHeight}px`)

        const fab = new fabric.Canvas(canv);

        fab.elements.container.style.pointerEvents = "none"
        fab.elements.container.style.zIndex = "-1"
        // fab.elements.container.style.display = "none"

        fab.setDimensions({width: container.clientWidth, height: container.clientHeight});

        canvas.current = fab

        const handleZoom = (e: CameraState) => {
            const xy = renderer.graphToViewport(e)
            const center = { x: xy.x - container.clientWidth / 2, y: xy.y - container.clientHeight / 2 }
            const topLeft = { x: -center.x - container.clientWidth / 2, y: -center.y - container.clientHeight / 2 }

            
            const zoom = 1 / e.ratio

            fab.absolutePan(new fabric.Point(topLeft))
            fab.setZoom(zoom);
        }

        const cam = renderer.getCamera();
        cam.on("updated", handleZoom)
        handleZoom(cam.getState())

        init(fab)

        const handleResize = () => {
            const scale = container.clientWidth / fab.getWidth();
            const zoom  = fab.getZoom() * scale;

            fab.setDimensions({width: container.clientWidth, height: container.clientHeight});
            fab.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);

            handleZoom(cam.getState())
        }
        const resize = new ResizeObserver(handleResize)
        handleResize()
        resize.observe(container)
        renderer.on("beforeRender", () => handleZoom(renderer.getCamera().getState()))
        
        return () => {
            resize.unobserve(container)
            cam.off("updated", handleZoom)
            fab.destroy();
            canvas.current = null;
        }
    }, [init, renderer])

    useEffect(() => {
        if (canvas.current != null) {
            canvas.current.elements.container.style.zIndex = drawingMode ? "1" : "-1"
           // canvas.current.elements.container.style.display = drawingMode ? "block" : "none"
            canvas.current.elements.container.style.pointerEvents = drawingMode ? "auto" : "none"
        }

    }, [drawingMode])
}

export default useFabricDrawing