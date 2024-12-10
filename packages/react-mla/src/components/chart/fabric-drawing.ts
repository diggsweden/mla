// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import * as  fabric from 'fabric'

import Sigma from 'sigma'

export default function bindFabricLayer(
    sigma: Sigma,
    opts?: {
        selectionKey: fabric.TOptionalModifierKey
    },
) {
    let isKilled = false;

    const fabricContainer = sigma.createCanvas("fabric", {
        style: { position: "absolute", inset: "0", zIndex: "0" },
        // 'edges' is the first sigma layer
        beforeLayer: "edges",
    });
    sigma.getContainer().prepend(fabricContainer);
    const fab = new fabric.Canvas(fabricContainer);
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

        fab.absolutePan(new fabric.Point(topLeft))
        fab.setZoom(zoom);
    }

    const handleResize = () => {
        const viewport = sigma.getDimensions()
        const wscale = viewport.width / fab.getWidth();
        const hscale = viewport.height / fab.getHeight();
        const zoom = fab.getZoom()

        fab.setDimensions({ width: viewport.width, height:viewport.height });
        fab.setViewportTransform([zoom * wscale, 0, 0, zoom * hscale, 0, 0]);

        handleZoom()
    }

    sigma.on("afterRender", handleZoom)
    sigma.on("resize", handleResize)
    sigma.on("kill", clean);

    handleResize()

    function clean() {
        if (!isKilled) {
            isKilled = true;

            fab.destroy();

            sigma.killLayer("fabric");
            sigma.off("afterRender", handleZoom)
            sigma.off("resize", handleResize)
        }
    }

    return {
        clean,
        fabric: fab
    }
}
