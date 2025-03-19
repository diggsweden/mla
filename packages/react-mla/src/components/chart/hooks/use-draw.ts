// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import * as fabricUtil from 'fabric';
import { useEffect, useRef } from 'react';
import Sigma from "sigma";
import useAppStore from '../../../store/app-store';
import useMainStore from '../../../store/main-store';

function useDraw(renderer: Sigma | undefined) {
    const drawingsRef = useRef<string>(undefined)

    const fabric = useMainStore((state) => state.fabric)
    const drawings = useMainStore((state) => state.drawings)

    const setFabric = useMainStore((state) => state.setFabric)
    const drawingMode = useAppStore((state) => state.drawingMode)

    const bindFabricLayer = (sigma: Sigma, opts?: { selectionKey: fabricUtil.TOptionalModifierKey }) => {
        let isKilled = false;

        const fabricContainer = sigma.createCanvas("fabric", {
            style: { position: "absolute", inset: "0", zIndex: "0" },
            // 'edges' is the first sigma layer
            beforeLayer: "edges",
        });
        sigma.getContainer().prepend(fabricContainer);

        const fab = new fabricUtil.Canvas(fabricContainer);
        fab.elements.container.style.position = "absolute"
        fab.elements.container.style.zIndex = "-1"

        fab.selectionKey = opts?.selectionKey ?? fab.selectionKey

        // Use same style for selection as in sigma
        fab.selectionColor = 'rgba(151, 194, 252, 0.45)'
        fab.selectionBorderColor = 'rgba(78, 146, 237, 0.75)'
        fab.selectionDashArray = [5, 5]

        const cam = sigma.getCamera()
        const handleZoom = () => {
            const e = cam.getState()
            const xy = sigma.graphToViewport(e)
            const viewport = sigma.getDimensions()

            const center = { x: xy.x - viewport.width / 2, y: xy.y - viewport.height / 2 }
            const topLeft = { x: -center.x - viewport.width / 2, y: -center.y - viewport.height / 2 }

            const zoom = 1 / e.ratio

            fab.absolutePan(new fabricUtil.Point(topLeft))
            fab.setZoom(zoom);
        }

        const handleResize = () => {
            const viewport = sigma.getDimensions()
            const wscale = viewport.width / fab.getWidth();
            const hscale = viewport.height / fab.getHeight();
            const zoom = fab.getZoom()

            fab.setDimensions({ width: viewport.width, height: viewport.height });
            fab.setViewportTransform([zoom * wscale, 0, 0, zoom * hscale, 0, 0]);

            handleZoom()
        }

        sigma.on("afterRender", handleZoom)
        sigma.on("resize", handleResize)
        sigma.on("kill", fabricCleanup);

        handleResize()

        function fabricCleanup() {
            if (!isKilled) {
                isKilled = true;

                fab.destroy();

                sigma.killLayer("fabric");
                sigma.off("afterRender", handleZoom)
                sigma.off("resize", handleResize)
            }
        }

        return {
            fabricCleanup: fabricCleanup,
            fabric: fab
        }
    }

    useEffect(() => {
        if (renderer == null) {
            return
        }

        const { fabric, fabricCleanup } = bindFabricLayer(renderer!)
        fabric.loadFromJSON(drawingsRef)

        setFabric(fabric)

        return () => {
            fabricCleanup()
        }
    }, [renderer, setFabric])

    useEffect(() => {
        if (fabric != null) {
            fabric.elements.container.style.zIndex = drawingMode ? "1" : "-1"
        }
    }, [drawingMode, fabric])

    useEffect(() => {
        drawingsRef.current = drawings

        if (fabric != null && drawings) {
            fabric.loadFromJSON(drawings)
        }
    }, [fabric, drawings])
}

export default useDraw