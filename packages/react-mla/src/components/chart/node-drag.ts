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

    useEffect(() => {
        if (renderer == null) return

        // On mouse down on a node
        //  - we enable the drag mode
        //  - save in the dragged node in the state
        //  - highlight the node
        //  - disable the camera so its state is not updated
        const down = (e: SigmaNodeEventPayload) => {
            const click = e.event.original as MouseEvent
            if (click.button != 0) {
                return;
            }
            draggedNode.current = e.node;
            graph.setNodeAttribute(draggedNode.current, "fixed", false);
            dragStart.current = {
                x: graph.getNodeAttribute(draggedNode.current, "x"),
                y: graph.getNodeAttribute(draggedNode.current, "x")
            }

            if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
        }

        const move = (e: SigmaStageEventPayload) => {
            if (!draggedNode.current) return;

            const event = e.event
            isDragging.current = true

            // Get new position of node
            const pos = renderer.viewportToGraph(event);

            graph.setNodeAttribute(draggedNode.current, "x", pos.x)
            graph.setNodeAttribute(draggedNode.current, "y", pos.y)

            // Prevent sigma to move camera:
            event.preventSigmaDefault()
            event.original.preventDefault()
            event.original.stopPropagation()
        }

        const upNode = (e: SigmaNodeEventPayload) => {
            if (draggedNode.current && isDragging.current) {
                graph.setNodeAttribute(draggedNode.current, "fixed", true)
                const x = graph.getNodeAttribute(draggedNode.current, "x")
                const y = graph.getNodeAttribute(draggedNode.current, "y")
                const positionUpdate = [] as IEntity[]

                getHistory(draggedNode.current)?.filter(e => e.PosX !== x || e.PosY !== y).forEach(e => {
                    positionUpdate.push(produce(e, draft => {
                        draft.PosX = x
                        draft.PosY = y
                    }))
                })
                update(...positionUpdate)
            } else {
                if (e.event.original.ctrlKey) {
                    const selected = useMainStore.getState().selectedIds;
                    setSelected([e.node, ...selected])
                } else {
                    setSelected([e.node])
                }
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

    }, [getHistory, graph, renderer, setSelected, update])
}