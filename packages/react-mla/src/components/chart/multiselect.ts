// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from 'react'
import useAppStore from '../../store/app-store'
import Sigma from 'sigma'
import { SigmaEdgeEventPayload, SigmaNodeEventPayload, SigmaStageEventPayload } from 'sigma/types'
import useMainStore from '../../store/main-store'

 enum Mouse {
    LeftButton = 0,
    Right = 1,
 }

const CONTEXT_TIMEOUT = 300

function useMultiselect(renderer: Sigma | undefined) {
    const leftMouseButtonIsDown = useRef(false)
    const nodesMoved = useRef(false)
    const multiselectBox = useRef(false)
    const canvas = useRef(null as null | HTMLCanvasElement)
    const time = useRef(0)
    const graphSelect = useRef({ startX: 0, endX: 0, startY: 0, endY: 0 })

    const setSelected = useMainStore((state) => state.setSelected)
    const selectedIds = useMainStore((state) => state.selectedIds)
    const entities = useMainStore((state) => state.entities)
    const setGeo = useAppStore(state => state.setSelectedGeoFeature)

    useEffect(() => {
        if (renderer == null) return

        const canv = renderer.getCanvases()["multiselect"] ?? renderer.createCanvas("multiselect")
        const container = renderer.getContainer();
        canv.style.userSelect = "none";
        canv.style.touchAction = "none";
        canv.style.pointerEvents = "none";
        canv.style["width"] = `${container.clientWidth}px`;
        canv.style["height"] = `${container.clientHeight}px`;
        canv.setAttribute("width", `${container.clientWidth}px`)
        canv.setAttribute("height", `${container.clientHeight}px`)

        canvas.current = canv

        return () => {
            canvas.current = null;
        }
    })

    useEffect(() => {
        if (renderer == null || canvas.current == null) return

        if (canvas.current == null) {
            const container = renderer.getContainer();
            const canv = renderer.createCanvas("multiselect")
            canv.style.userSelect = "none";
            canv.style.touchAction = "none";
            canv.style.pointerEvents = "none";
            canv.style["width"] = `${container.clientWidth}px`;
            canv.style["height"] = `${container.clientHeight}px`;
            canv.setAttribute("width", `${container.clientWidth}px`)
            canv.setAttribute("height", `${container.clientHeight}px`)

            canvas.current = canv
        }

        const selectInGraph = (addToAlreadySelected: boolean) => {
            const rect = graphSelect.current
            const order = (a: number, b: number) => {
                return b < a ? [b, a] : [a, b]
            }
            const [sX, eX] = order(rect.startX, rect.endX)
            const [sY, eY] = order(rect.startY, rect.endY)

            const result = addToAlreadySelected ? [...selectedIds]  : []
            for (const entityId of Object.keys(entities)) {
                const entity = entities[entityId][0]

                const t = {
                  x: entity.PosX ?? 0,
                  y: entity.PosY ?? 0
                }

                if (sX <= t.x && t.x <= eX && sY <= t.y && t.y <= eY) {
                  if (!result.includes(entityId)) {
                      result.push(entityId)
                  }
                }
            }

            setSelected(result)
        }

        const selectInMultiSelectBox = (addToAlreadySelected : boolean) =>{
            multiselectBox.current = false;

            const diff = Date.now() - time.current
            if (diff > CONTEXT_TIMEOUT) {
                selectInGraph(addToAlreadySelected)
            }

            drawMultiSelectBox()
        }

        const select = (toggle: boolean, id: string) => {
            if (toggle) {
                if (selectedIds.indexOf(id) >= 0){
                    setSelected(selectedIds.filter(x=> x != id))
                } else {
                    setSelected([id, ...selectedIds])
                }
            } else {
                setSelected([id])
            }
        }

        const drawMultiSelectBox = () => {
            if (renderer == null || canvas.current == null) {
                return
            }

            const container = renderer.getContainer();

            canvas.current.style["width"] = `${container.clientWidth}px`;
            canvas.current.style["height"] = `${container.clientHeight}px`;
            canvas.current.setAttribute("width", `${container.clientWidth}px`)
            canvas.current.setAttribute("height", `${container.clientHeight}px`)

            if (canvas.current) {
                const ctx = canvas.current.getContext("2d")!;
                if (multiselectBox.current == false) {
                    ctx.clearRect(0, 0, container.clientWidth, container.clientHeight)
                    return
                }

                const rect = graphSelect.current
                const start = renderer.graphToViewport({ x: rect.startX, y: rect.startY })
                const end = renderer.graphToViewport({ x: rect.endX, y: rect.endY })

                ctx.setLineDash([5])
                ctx.strokeStyle = 'rgba(78, 146, 237, 0.75)'
                ctx.strokeRect(start.x, start.y, end.x - start.x, -start.y + end.y)
                ctx.setLineDash([])
                ctx.fillStyle = 'rgba(151, 194, 252, 0.45)'
                ctx.fillRect(start.x, start.y, end.x - start.x, -start.y + end.y)
            }
        }

        const moveBody = (e: SigmaStageEventPayload) => {
            if (multiselectBox.current) {
                const pos = renderer.viewportToGraph(e.event)
                Object.assign(graphSelect.current, {
                    endX: pos.x,
                    endY: pos.y
                })

                e.preventSigmaDefault();
                e.event.original.preventDefault();
                e.event.original.stopPropagation();

                drawMultiSelectBox();
            }

            if (leftMouseButtonIsDown.current && !nodesMoved.current) {
                nodesMoved.current = true;
            }
        }

        const downStage = (e: SigmaStageEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button == Mouse.LeftButton) {
                const pos = renderer.viewportToGraph(e.event)
                Object.assign(graphSelect.current, {
                    startX: pos.x,
                    startY: pos.y,
                    endX: pos.x,
                    endY: pos.y
                })
                multiselectBox.current = true
            }
        }

        const upStage = (e: SigmaStageEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button === Mouse.LeftButton) {
                if (multiselectBox.current) {
                    selectInMultiSelectBox(click.ctrlKey)
                } else {
                    setSelected([])
                }
            }

        }

        const downNode = (e: SigmaNodeEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button === Mouse.LeftButton) {
                leftMouseButtonIsDown.current = true;
            }
        }

        const upNode = (e: SigmaNodeEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button === Mouse.LeftButton) {
                if (multiselectBox.current) {
                    selectInMultiSelectBox(click.ctrlKey)
                } else {
                    if (!nodesMoved.current){
                        select(e.event.original.ctrlKey, e.node)
                    }
                }

                nodesMoved.current = false;
                leftMouseButtonIsDown.current = false
            }
        }

        const downEdge = (e: SigmaEdgeEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button === Mouse.LeftButton) {
                leftMouseButtonIsDown.current = true;
            }
        }

        const upEdge = (e: SigmaEdgeEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button === Mouse.LeftButton) {
                if (multiselectBox.current) {
                    selectInMultiSelectBox(click.ctrlKey)
                } else {
                    if (!nodesMoved.current){
                        select(e.event.original.ctrlKey, e.edge)
                    }
                }

                nodesMoved.current = false;
                leftMouseButtonIsDown.current = false
            }
        }

        renderer.on("upStage", upStage)
        renderer.on("downStage", downStage)
        renderer.on("upNode", upNode)
        renderer.on("downNode", downNode)
        renderer.on("downEdge", downEdge)
        renderer.on("upEdge", upEdge)
        renderer.on("moveBody", moveBody)

        return () => {
            renderer.off("upStage", upStage)
            renderer.off("downStage", downStage)
            renderer.off("upNode", upNode)
            renderer.off("downNode", downNode)
            renderer.off("downEdge", downEdge)
            renderer.off("upEdge", upEdge)
            renderer.off("moveBody", moveBody)
        }
    }, [entities, renderer, selectedIds, setGeo, setSelected])
}

export default useMultiselect