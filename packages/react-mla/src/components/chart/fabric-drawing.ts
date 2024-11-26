// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from 'react'
import * as  fabric from 'fabric'

import Sigma from 'sigma'
import useAppStore from '../../store/app-store'

// https://jsfiddle.net/gncabrera/hkee5L6d/5/

function useFabricDrawing(renderer: Sigma | undefined) {
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

        const circle = new fabric.Circle({
            radius: 15,
            fill: 'green',
            left: 100,
            top: 100,
            selectable: false
        });

        const triangle = new fabric.Triangle({
            fill: 'green',
            left: 200,
            top: 200,
            selectable: false
        });
        fab.add(circle, triangle);

        canvas.current = fab

        fab.on('mouse:down', (e) => {
            console.log(e);
        })

        fab.on('mouse:up', (e) => {
            console.log(e);
        })

        fab.on('mouse:over', function (e: any) {
            if (e.target) {
                e.target.fill = "#7BDBFF";
                fab.renderAll();
            }
        });

        fab.on('mouse:out', function (e: any) {
            if (e.target) {
                e.target.fill = 'green';
                fab.renderAll();
            }
        });

        const handleZoom = (e: any) => {
            let xy = renderer.graphToViewport(e)
            
            const zoom = 1 / e.ratio
            
            const zoomRatio = e.ratio * 4
            xy = { x:  -xy.x + container.clientWidth / zoomRatio, y: -xy.y + container.clientHeight / zoomRatio}
            fab.absolutePan(new fabric.Point(xy))
            fab.setZoom(zoom);
            console.log("zoom", e.ratio, zoom)
        }

        const cam = renderer.getCamera();
        fab.setZoom(1 / cam.ratio)

        cam.on("updated", handleZoom)

        const resize = new ResizeObserver(() => {
            fab.renderAll()
        })

        resize.observe(container)

        return () => {
            resize.unobserve(container)
            cam.off("updated", handleZoom)
            fab.destroy();
            canvas.current = null;
        }
    }, [renderer])

    useEffect(() => {
        if (canvas.current != null) {
            canvas.current.elements.container.style.zIndex = drawingMode ? "1" : "-1"
            canvas.current.elements.container.style.pointerEvents = drawingMode ? "" : "none"
        }

    }, [drawingMode])
}

export default useFabricDrawing