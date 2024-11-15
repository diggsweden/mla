// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import {  useEffect, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { drawDiscNodeHover, drawDiscNodeLabel } from './rendering/node-renderer';
import { NodeSvgProgram } from "./rendering/svg-node-renderer/index";
import { NodeBorderProgram } from "@sigma/node-border";

import Sigma from "sigma";

import useMainStore from '../../store/main-store'
import useKeyDown from '../../effects/keydown'

import ContentRenderer from './sigma/ContentRenderer';
import useMultiselect from './multiselect';
import { useDragNodes } from './node-drag';
import { useNodeHighlight } from './node-highlight';

interface Props {
  className?: string
  children?: React.ReactNode
}

function Chart(props: Props) {
  const setSelected = useMainStore((state) => state.setSelected)

  const graph = useMainStore((state) => state.graph)
  const sigma = useMainStore((state) => state.sigma)

  const init = useMainStore((state) => state.initSigma)

  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)

  const sigmaContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sigmaContainer.current == null) {
      return
    }

    const renderer = new Sigma(graph, sigmaContainer.current, {
      nodeProgramClasses: {
        image: NodeSvgProgram,
        border: NodeBorderProgram,
      },
      enableEdgeEvents: true,
      renderEdgeLabels: true,
      autoCenter: false,
      autoRescale: false,
      defaultDrawNodeLabel: drawDiscNodeLabel,
      defaultDrawNodeHover: drawDiscNodeHover
    });

    init(renderer);

    return () => {
      renderer.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMultiselect(sigmaContainer, sigma)
  useDragNodes(sigma)
  useNodeHighlight(sigma)

  const dropRef = useDrop(
    () => ({
      accept: ['entity', 'result'],
      drop: (item, monitor) => {
        const clientPosition = monitor.getClientOffset()
        if (clientPosition == null || sigmaContainer.current == null || sigma == null) {
          return
        }
        const offset = sigmaContainer.current.getBoundingClientRect()
        const click = { x: clientPosition.x - offset.x, y: clientPosition.y - offset.y };
        const pos = sigma.viewportToGraph(click);
        return pos
      }
    }),
    [sigma]
  )

  useKeyDown(() => {
    setSelected([...Object.keys(entities), ...Object.keys(links)])
  }, sigmaContainer, ['KeyA'], true)

  return (
    <div className={props.className}>
      <div className="m-h-full m-w-full m-absolute m-pointer-events-none m-z-10">
        {props.children}
      </div>
      <div className="m-h-full m-w-full" ref={dropRef[1]} >
        <div className="m-h-full m-w-full m-outline-none" id="m-chart" ref={sigmaContainer}>
        </div>
        <ContentRenderer />
      </div>
    </div>
  )
}

export default Chart