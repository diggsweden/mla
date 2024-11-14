// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { RefObject, useEffect, useRef } from 'react'

import useAppStore from '../../store/app-store'
import Sigma from 'sigma'
import { SigmaEdgeEventPayload, SigmaNodeEventPayload, SigmaStageEventPayload } from 'sigma/types'
import useMainStore from '../../store/main-store'

const LEFT_CLICK = 0
const RIGHT_CLICK = 2

const CONTEXT_TIMEOUT = 300

export function useMultiselect(containerElement: RefObject<HTMLElement>, renderer: Sigma | undefined) {
    const drag = useRef(false)
    const pan = useRef(false)
    const canvas = useRef(null as null | HTMLCanvasElement)
    const time = useRef(0)
    const graphSelect = useRef({ startX: 0, endX: 0, startY: 0, endY: 0 })
    const panStart = useRef({ x: 0, y: 0 })

    const setSelected = useMainStore((state) => state.setSelected)
    const selectedIds = useMainStore((state) => state.selectedIds)
    const entities = useMainStore((state) => state.entities)
    const showContextMenu = useAppStore(state => state.showContextMenu)
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

        const selectInGraph = (ctrlKey: boolean) => {
            const rect = graphSelect.current
            const order = (a: number, b: number) => {
                return b < a ? [b, a] : [a, b]
            }

            const [sX, eX] = order(rect.startX, rect.endX)
            const [sY, eY] = order(rect.startY, rect.endY)

            const result = ctrlKey ? [...selectedIds]  : []
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

        const drawMultiselect = () => {
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
                if (drag.current == false) {
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

        const down = (e: SigmaStageEventPayload) => {
            const click = e.event.original as MouseEvent;
            
            if (click.button == RIGHT_CLICK) {
                const pos = renderer.viewportToFramedGraph(e.event)
                time.current = Date.now()
                pan.current = true
                panStart.current = pos
                e.preventSigmaDefault()
                e.event.original.preventDefault()
                e.event.original.stopImmediatePropagation()
            }
            else if (click.button == LEFT_CLICK) {
                const pos = renderer.viewportToGraph(e.event)
                Object.assign(graphSelect.current, {
                    startX: pos.x,
                    startY: pos.y,
                    endX: pos.x,
                    endY: pos.y
                })
                drag.current = true
            }
        }

        const move = (e: SigmaStageEventPayload) => {
            if (pan.current) {
                const pos = renderer.viewportToFramedGraph(e.event)
                const camera = renderer.getCamera()
                const state = camera.getState()
                const update = { x: state.x + panStart.current.x - pos.x, y: state.y + panStart.current.y - pos.y }
                camera.setState(update)
            }
            if (drag.current) {
                const pos = renderer.viewportToGraph(e.event)
                Object.assign(graphSelect.current, {
                    endX: pos.x,
                    endY: pos.y
                })

                e.preventSigmaDefault();
                e.event.original.preventDefault();
                e.event.original.stopPropagation();

                drawMultiselect();
            }
        }

        const up = (e: MouseEvent) => {
            if (e.button === RIGHT_CLICK) {
                e.preventDefault();
                const diff = Date.now() - time.current
                if (diff < CONTEXT_TIMEOUT) {
                    window.setTimeout(() => {
                        showContextMenu(e.pageX, e.pageY)
                    })
                }

                pan.current = false;
            }
        }

        const upLeft = (e: SigmaStageEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button === LEFT_CLICK) {
                if (drag.current) {
                    drag.current = false;

                    const diff = Date.now() - time.current
                    if (diff > CONTEXT_TIMEOUT) {
                        selectInGraph(click.ctrlKey)
                    }
    
                    drawMultiselect()
                } else {
                    setSelected([])
                }
            }

        }

        const upLeftNode = (e: SigmaNodeEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button === LEFT_CLICK) {
                if (drag.current) {
                    drag.current = false;

                    const diff = Date.now() - time.current
                    if (diff > CONTEXT_TIMEOUT) {
                        selectInGraph(click.ctrlKey)
                    }
    
                    drawMultiselect()
                } else {
                    if (e.event.original.ctrlKey) {
                        setSelected([e.node, ...selectedIds])
                    } else {
                        setSelected([e.node])
                    }
                }
            }
        }

        const upLeftEdge = (e: SigmaEdgeEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button === LEFT_CLICK) {
                if (drag.current) {
                    drag.current = false;

                    const diff = Date.now() - time.current
                    if (diff > CONTEXT_TIMEOUT) {
                        selectInGraph(click.ctrlKey)
                    }
    
                    drawMultiselect()
                } else {
                    if (e.event.original.ctrlKey) {
                        setSelected([e.edge, ...selectedIds])
                    } else {
                        setSelected([e.edge])
                    }
                }
            }
        }

        const rightClickStage = (e: SigmaStageEventPayload) => {
            e.preventSigmaDefault();
            e.event.original.preventDefault();
        }

        const rightClickNode = (e: SigmaNodeEventPayload) => {
            setSelected([e.node])
            const click = e.event.original as MouseEvent;
            showContextMenu(click.pageX, click.pageY)
            e.preventSigmaDefault();
            e.event.original.preventDefault();
            e.event.original.stopPropagation();
        }

        renderer.getContainer().onmouseup = up;
        renderer.on("downStage", down)
        renderer.on("moveBody", move)
        renderer.on("upStage", upLeft)
        renderer.on("upNode", upLeftNode)
        renderer.on("upEdge", upLeftEdge)
        renderer.on("rightClickNode", rightClickNode);
        renderer.on("rightClickStage", rightClickStage);

        return () => {
            renderer.getContainer().onmouseup = null;
            renderer.off("downStage", down)
            renderer.off("moveBody", move)
            renderer.off("upStage", upLeft)
            renderer.off("upNode", upLeftNode)
            renderer.off("upEdge", upLeftEdge)
            renderer.off("rightClickNode", rightClickNode);
            renderer.off("rightClickStage", rightClickStage);
        }
    }, [containerElement, entities, renderer, selectedIds, setGeo, setSelected, showContextMenu])
}

export default useMultiselect