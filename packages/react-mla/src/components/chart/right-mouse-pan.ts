// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { RefObject, useEffect, useRef } from 'react'

import Sigma from 'sigma'
import { SigmaEdgeEventPayload, SigmaNodeEventPayload, SigmaStageEventPayload } from 'sigma/types'
import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'

const RIGHT_CLICK = 2

const CONTEXT_TIMEOUT = 300

function useRightMousePan(containerElement: RefObject<HTMLElement>, renderer: Sigma | undefined) {
    const pan = useRef(false)
    const panStart = useRef({ x: 0, y: 0 })
    const time = useRef(0)
    const showContextMenu = useAppStore(state => state.showContextMenu)
    const drawingMode = useAppStore(state => state.drawingMode)
    const setSelected = useMainStore((state) => state.setSelected)

    useEffect(() => {
        if (containerElement.current == null || renderer == null || drawingMode) return

        const down = (e: MouseEvent) => {
            if (e.button === RIGHT_CLICK) {
                e.preventDefault();
                //e.stopPropagation();
                time.current = Date.now()
                const pos = renderer.viewportToFramedGraph(e)
                time.current = Date.now()
                pan.current = true
                panStart.current = pos
            }
        }

        const up = (e: MouseEvent) => {
            if (e.button === RIGHT_CLICK && !drawingMode) {
                pan.current = false;
                e.preventDefault();
                //e.stopPropagation();

                const diff = Date.now() - time.current

                if (diff < CONTEXT_TIMEOUT) {
                    window.setTimeout(() => {
                        showContextMenu(e.pageX, e.pageY)
                    })
                }
            }
        }

        containerElement.current.onmousedown = down
        containerElement.current.oncontextmenu = up
    }, [containerElement, drawingMode, renderer, showContextMenu])

    useEffect(() => {
        if (renderer == null || drawingMode) return

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
        }

        const move = (e: SigmaStageEventPayload) => {
            if (pan.current) {
                const pos = renderer.viewportToFramedGraph(e.event)
                const camera = renderer.getCamera()
                const state = camera.getState()
                const update = { x: state.x + panStart.current.x - pos.x, y: state.y + panStart.current.y - pos.y }
                camera.setState(update)
            }
        }


        const upStage = (e: SigmaStageEventPayload | SigmaEdgeEventPayload) => {
            pan.current = false;
            const click = e.event.original as MouseEvent;
            const diff = Date.now() - time.current

            if (click.button === RIGHT_CLICK) {
                e.preventSigmaDefault();
                click.preventDefault();
                click.stopPropagation();

                if (diff < CONTEXT_TIMEOUT) {
                    showContextMenu(click.pageX, click.pageY)
                }
            }
        }


        const upNode = (e: SigmaNodeEventPayload) => {
            pan.current = false;
            const click = e.event.original as MouseEvent;
            const diff = Date.now() - time.current

            if (click.button === RIGHT_CLICK) {
                e.preventSigmaDefault();
                click.preventDefault();
                click.stopPropagation();

                if (diff < CONTEXT_TIMEOUT) {
                    const selectedIds = useMainStore.getState().selectedIds
                    if (selectedIds.length > 0) {
                        setSelected([...selectedIds, e.node])

                    } else {
                        setSelected([e.node])
                    }

                    const click = e.event.original as MouseEvent;
                    showContextMenu(click.pageX, click.pageY)
                }
            }
        }

        renderer.on("downStage", down)
        renderer.on("moveBody", move)
        renderer.on("upStage", upStage)
        renderer.on("upNode", upNode)
        renderer.on("upEdge", upStage)

        return () => {
            renderer.off("downStage", down)
            renderer.off("moveBody", move)
            renderer.off("upStage", upStage)
            renderer.off("upNode", upNode)
            renderer.off("upEdge", upStage)
        }
    }, [drawingMode, renderer, setSelected, showContextMenu])
}

export default useRightMousePan
