// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import EdgeCurveProgram, { EdgeCurvedArrowProgram } from "@sigma/edge-curve";
import { createNodeBorderProgram } from "@sigma/node-border";
import Graph from "graphology";
import { useCallback, useEffect, useRef } from "react";
import Sigma from "sigma";
import { EdgeArrowProgram, EdgeRectangleProgram, createNodeCompoundProgram, drawDiscNodeHover, drawDiscNodeLabel } from "sigma/rendering";
import { Settings } from "sigma/settings";
import useKeyDown from "../../../effects/keydown";
import configService from "../../../services/configurationService";
import useMainStore from "../../../store/main-store";
import { createNodeSvgProgram } from "../rendering/svg-node-renderer";
import { TextureManager } from "../rendering/svg-node-renderer/texture";
import useEntityDrop from "./use-entity-drop";
import useMultiselect from "./use-multiselect";
import useDragNodes from "./use-node-drag";
import useNodeHighlight from "./use-node-highlight";
import useRightMousePan from "./use-right-mouse-pan";

const useSigma = (graph: Graph) => {
    const container = useRef<HTMLDivElement>(null)

    const setSelected = useMainStore((state) => state.setSelected)

    const sigma = useMainStore((state) => state.sigma)
    const setSigma = useMainStore((state) => state.setSigma)

    const entities = useMainStore((state) => state.entities)
    const links = useMainStore((state) => state.links)

    const preloadImages = (manager: TextureManager) => {
        configService.getConfiguration().Display.forEach(c => {
            c.Show.forEach(s => {
                if (s.Icon) {
                    manager.registerImage(s.Icon)
                }
            })
        })
    }

    const createSigma = useCallback((container: HTMLElement) => {
        const NodeBorderCustomProgram = createNodeBorderProgram({
            borders: [
                { size: { value: 0.1 }, color: { attribute: "borderColor" } },
                { size: { fill: true }, color: { attribute: "color" } },
            ],
        });

        const NodePictogramCustomProgram = createNodeSvgProgram({
            padding: 0.3,
            size: { mode: "force", value: 256 },
            drawingMode: "color",
            colorAttribute: "iconColor",
            createCallback: preloadImages
        });

        const NodeProgram = createNodeCompoundProgram([NodeBorderCustomProgram, NodePictogramCustomProgram]);

        const settings = {
            zoomToSizeRatioFunction: (x) => x,
            allowInvalidContainer: true,
            autoRescale: true,
            autoCenter: false,
            itemSizesReference: "positions",
            defaultNodeType: "pictogram",
            defaultEdgeType: "straight",
            stagePadding: 75,
            //minCameraRatio: 0.5,
            //maxCameraRatio: 5,
            nodeProgramClasses: {
                pictogram: NodeProgram
            },
            edgeProgramClasses: {
                straightWithArrow: EdgeArrowProgram,
                straight: EdgeRectangleProgram,
                curved: EdgeCurveProgram,
                curvedWithArrow: EdgeCurvedArrowProgram,
            },
            enableEdgeEvents: true,
            renderEdgeLabels: true,
            defaultDrawNodeLabel: drawDiscNodeLabel,
            defaultDrawNodeHover: drawDiscNodeHover
        } as Partial<Settings>

        const sigma = new Sigma(graph, container, settings);

        const setBBox = () => {
            sigma.setCustomBBox({
                x: [0, sigma.getContainer().clientWidth],
                y: [0, sigma.getContainer().clientHeight],
            });
        }

        // Create a custom bbox because the option "autoCenter" is not currently working in sigma
        setBBox();

        // Since we are using a custom bbox, we need to set it if we change the window size
        sigma.on("resize", setBBox);

        // Ignore all doubleClicks for now
        sigma.on("doubleClickNode", (e) => e.preventSigmaDefault())
        sigma.on("doubleClickEdge", (e) => e.preventSigmaDefault())
        sigma.on("doubleClickStage", (e) => e.preventSigmaDefault())
        return sigma
    }, [graph])

    useEffect(() => {
        if (container.current == null) {
            return
        }

        const sigma = createSigma(container.current!)
        setSigma(sigma)

        // Add Workflow


        return () => {
            sigma.kill()
        }
    }, [container, createSigma, setSigma])

    useRightMousePan(sigma)
    useMultiselect(sigma)
    useDragNodes(sigma)
    useNodeHighlight(sigma)

    useKeyDown(() => {
        setSelected([...Object.keys(entities), ...Object.keys(links)])
    }, container, ['KeyA'], true)

    const dropRef = useEntityDrop(sigma, container)

    return { sigma, container, dropRef }
}

export default useSigma;

