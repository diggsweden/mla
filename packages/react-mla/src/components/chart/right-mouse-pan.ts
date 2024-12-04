// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { RefObject, useEffect, useRef } from 'react'

import Sigma from 'sigma'
import { SigmaNodeEventPayload, SigmaStageEventPayload } from 'sigma/types'
import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'

const RIGHT_CLICK = 2

function useRightMousePan(containerElement: RefObject<HTMLElement>, renderer: Sigma | undefined) {
    const pan = useRef(false)
    const selecteNode = useRef<null | string>(null)
    const panStart = useRef({ x: 0, y: 0 })
    const rightMouseButtonIsDown = useRef(false)
    const showContextMenu = useAppStore(state => state.showContextMenu)
    const drawingMode = useAppStore(state => state.drawingMode)
    const setSelected = useMainStore((state) => state.setSelected)

    useEffect(() => {
        if (containerElement.current == null || renderer == null || drawingMode) return

        const oncontextmenu = (e: MouseEvent) => {
            if (!pan.current) {
                showContextMenu(e.pageX, e.pageY)
                if (selecteNode.current) {
                    const selectedIds = useMainStore.getState().selectedIds
                    if (!selectedIds.includes(selecteNode.current)){
                        setSelected([selecteNode.current])
                    }
                }
            }

            e.preventDefault();

            selecteNode.current = null
            pan.current = false
            rightMouseButtonIsDown.current = false
        }

        containerElement.current.oncontextmenu = oncontextmenu

    }, [containerElement, drawingMode, renderer, setSelected, showContextMenu])

    useEffect(() => {
        if (renderer == null || drawingMode) return

        const downStage = (e: SigmaStageEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button != RIGHT_CLICK) return;

            panStart.current = renderer.viewportToFramedGraph(e.event)
            rightMouseButtonIsDown.current = true

            setSelected([])
        }

        const downNode = (e: SigmaNodeEventPayload) => {
            const click = e.event.original as MouseEvent;
            if (click.button != RIGHT_CLICK) return;

            panStart.current = renderer.viewportToFramedGraph(e.event)
            rightMouseButtonIsDown.current = true;

            selecteNode.current = e.node
        }

        const moveBody = (e: SigmaStageEventPayload) => {
            if (rightMouseButtonIsDown.current && !pan.current) {
                pan.current = true
            }

            if (pan.current) {
                const pos = renderer.viewportToFramedGraph(e.event)
                const camera = renderer.getCamera()
                const state = camera.getState()
                const update = { x: state.x + panStart.current.x - pos.x, y: state.y + panStart.current.y - pos.y }
                camera.setState(update)
            }
        }

        renderer.on("downStage", downStage)
        renderer.on("downNode", downNode)
        renderer.on("moveBody", moveBody)

        return () => {
            renderer.off("downStage", downStage)
            renderer.off("downNode", downNode)
            renderer.off("moveBody", moveBody)
        }
    }, [drawingMode, renderer, setSelected])
}

export default useRightMousePan
