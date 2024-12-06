// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from "react";
import Sigma from "sigma";
import useMainStore from "../../store/main-store";
import { SigmaNodeEventPayload, SigmaStageEventPayload } from "sigma/types";
import { IEntity } from "../../interfaces/data-models";
import { produce } from "immer";

const LEFT_CLICK = 0

export function useDragNodes(renderer: Sigma | undefined) {
    const draggedNode = useRef(null as string | null)
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 })

    const graph = useMainStore((state) => state.graph)
    const getHistory = useMainStore((state) => state.getEntityHistory)
    const update = useMainStore((state) => state.updateEntity)
    const setSelected = useMainStore((state) => state.setSelected)
    const selectedIds = useMainStore((state) => state.selectedIds)

    useEffect(() => {
        if (renderer == null) return

        const downNode = (e: SigmaNodeEventPayload) => {
            console.debug("node-drag: downNode")
            const click = e.event.original as MouseEvent
            if (click.button != LEFT_CLICK || click.ctrlKey) return

            if (!selectedIds.includes(e.node)) {
                setSelected([e.node])
            }

            draggedNode.current = e.node;
            graph.setNodeAttribute(e.node, "fixed", false)

            const pos = renderer.viewportToGraph(e.event);
            dragStart.current = {
                x: pos.x,
                y: pos.y
            }
        }

        const moveBody = (e: SigmaStageEventPayload) => {
            console.debug("node-drag: moveBody")
            if (!draggedNode.current) return;

            const event = e.event
            isDragging.current = true

            const pos = renderer.viewportToGraph(event);

            const diff = {
                x: dragStart.current.x - pos.x,
                y: dragStart.current.y - pos.y,
            }

            dragStart.current = {
                x: pos.x,
                y: pos.y,
            }

            graph.updateEachNodeAttributes((node, attr) => {
                if (selectedIds.includes(node)) {
                    return {
                        ...attr,
                        x: attr.x - diff.x,
                        y: attr.y - diff.y
                    }
                } else {
                    return attr
                }
            });

            event.preventSigmaDefault()
            event.original.preventDefault()
            event.original.stopPropagation()
        }

        const upNode = () => {
            console.debug("node-drag: upNode")
            if (isDragging.current) {
                const positionUpdate = [] as IEntity[]
                const nodes = selectedIds.filter(n => graph.hasNode(n))
                for (const n of nodes) {
                    graph.setNodeAttribute(n, "fixed", true)
                    const x = graph.getNodeAttribute(n, "x")
                    const y = graph.getNodeAttribute(n, "y")

                    getHistory(n)?.filter(e => e.PosX !== x || e.PosY !== y).forEach(e => {
                        positionUpdate.push(produce(e, draft => {
                            draft.PosX = x
                            draft.PosY = y
                        }))
                    })
                }

                update(...positionUpdate)
            }

            isDragging.current = false;
            draggedNode.current = null;
        }

        const upStage = () => {
            console.debug("node-drag: upStage")
            if (draggedNode.current && isDragging.current) {
                graph.removeNodeAttribute(draggedNode.current, "dragging");
            }

            isDragging.current = false;
            draggedNode.current = null;
        }

        renderer.on("upStage", upStage);
        renderer.on("downNode", downNode)
        renderer.on("upNode", upNode);
        renderer.on("moveBody", moveBody)

        return () => {
            renderer.off("upStage", upStage);
            renderer.off("downNode", downNode)
            renderer.off("upNode", upNode);
            renderer.off("moveBody", moveBody)
        }

    }, [getHistory, graph, renderer, selectedIds, setSelected, update])
}

export default useDragNodes
