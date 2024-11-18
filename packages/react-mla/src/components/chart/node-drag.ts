// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from "react";
import Sigma from "sigma";
import useMainStore from "../../store/main-store";
import { SigmaNodeEventPayload, SigmaStageEventPayload } from "sigma/types";
import { IEntity } from "../../interfaces/data-models";
import { produce } from "immer";

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

        const down = (e: SigmaNodeEventPayload) => {
            const click = e.event.original as MouseEvent
            if (click.button != 0) {
                return;
            }
            draggedNode.current = e.node;
            graph.setNodeAttribute(draggedNode.current, "fixed", false);
            dragStart.current = {
                x: graph.getNodeAttribute(draggedNode.current, "x"),
                y: graph.getNodeAttribute(draggedNode.current, "y")
            }

            if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
        }

        const move = (e: SigmaStageEventPayload) => {
            if (!draggedNode.current) return;

            if (!selectedIds.includes(draggedNode.current)) {
                setSelected([draggedNode.current])
            }

            const event = e.event
            isDragging.current = true

            const pos = renderer.viewportToGraph(event);
            const diff = {
                x: dragStart.current.x - pos.x,
                y: dragStart.current.y - pos.y,
            }

            dragStart.current = {
                x: pos.x,
                y: pos.y
            }

            const nodes = selectedIds.filter(n => graph.hasNode(n))
            for (const n of nodes) {
                graph.updateNodeAttribute(n, "x", (x) => x - diff.x)
                graph.updateNodeAttribute(n, "y", (y) => y - diff.y)
            }

            event.preventSigmaDefault()
            event.original.preventDefault()
            event.original.stopPropagation()
        }

        const upNode = () => {
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
            if (draggedNode.current && isDragging.current) {
                graph.removeNodeAttribute(draggedNode.current, "dragging");
            }

            isDragging.current = false;
            draggedNode.current = null;
        }
        
        renderer.on("downNode", down)
        renderer.on("moveBody", move)
        renderer.on("upNode", upNode);
        renderer.on("upStage", upStage);

        return () => {
            renderer.off("downNode", down)
            renderer.off("moveBody", move)
            renderer.off("upNode", upNode);
            renderer.off("upStage", upStage);
        }

    }, [getHistory, graph, renderer, selectedIds, setSelected, update])
}

export default useDragNodes
