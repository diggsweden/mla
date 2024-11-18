// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useState } from "react";
import Sigma from "sigma";
import useAppStore from "../../store/app-store";
import { SigmaNodeEventPayload } from "sigma/types";
import useMainStore from "../../store/main-store";

function useNodeHighlight(renderer: Sigma | undefined) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const disableHoverEffect = useAppStore(state => !state.hoverEffect)
    const graph = useMainStore((state) => state.graph)

    useEffect(() => {
        if (renderer == null) return

        const enter = (e: SigmaNodeEventPayload) => {
            graph.setNodeAttribute(e.node, "highlighted", true)
            setHoveredNode(e.node)
        }

        const exit = (e: SigmaNodeEventPayload) => {
            graph.setNodeAttribute(e.node, "highlighted", false)
            setHoveredNode(null)
        }

        renderer.on("enterNode", enter);
        renderer.on("leaveNode", exit);

        return () => {
            renderer.off("enterNode", enter);
            renderer.off("leaveNode", exit);
        }
    }, [graph, renderer])

    useEffect(() => {
        if (renderer == null) return

        renderer.setSetting("nodeReducer", (node, data) => {
            const graph = renderer.getGraph();
            const newData = { ...data, highlighted: data.highlighted || false };

            if (!disableHoverEffect && hoveredNode) {
                if (node === hoveredNode || graph.neighbors(hoveredNode).includes(node)) {
                    newData.highlighted = true;
                } else {
                    newData.highlighted = false;
                }
            }
            return newData;
        })
        renderer.setSetting("edgeReducer", (edge, data) => {
            const graph = renderer.getGraph();
            const newData = { ...data, hidden: false };

            if (!disableHoverEffect && hoveredNode && !graph.extremities(edge).includes(hoveredNode)) {
                newData.hidden = true;
            }
            return newData;
        });

        return () => {
            renderer.setSetting("nodeReducer", null)
            renderer.setSetting("edgeReducer", null)
        }
    }, [hoveredNode, disableHoverEffect, renderer]);
}

export default useNodeHighlight
