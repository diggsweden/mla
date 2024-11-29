// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { drawDiscNodeHover, drawDiscNodeLabel } from './rendering/node-renderer';
import { createNodeSvgProgram } from "./rendering/svg-node-renderer/index";
import { createNodeBorderProgram } from "@sigma/node-border";
import { EdgeArrowProgram, EdgeRectangleProgram, createNodeCompoundProgram } from 'sigma/rendering';
import EdgeCurveProgram, { EdgeCurvedArrowProgram } from "@sigma/edge-curve";

import Sigma from "sigma";
import { Settings } from "sigma/settings";

import ContentRenderer from './sigma/ContentRenderer';

import useMainStore from '../../store/main-store'

import useRightMousePan from './right-mouse-pan';
import useDragNodes from './node-drag';
import useNodeHighlight from './node-highlight';
import useMultiselect from './multiselect';
import useKeyDown from '../../effects/keydown'
import useFabricDrawing from './fabric-drawing';

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
      colorAttribute: "borderColor",
    });
  
    const NodeProgram = createNodeCompoundProgram([NodeBorderCustomProgram, NodePictogramCustomProgram]);
  
    const settings = {
      zoomToSizeRatioFunction: (x) => x,
      autoRescale: false,
      itemSizesReference: "positions",
      //minCameraRatio: 0.3,
      //maxCameraRatio: 4.5,
      defaultNodeType: "pictogram",
      defaultEdgeType: "straight",
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
      autoCenter: false,
      defaultDrawNodeLabel: drawDiscNodeLabel,
      defaultDrawNodeHover: drawDiscNodeHover
    } as Partial<Settings>

    const renderer = new Sigma(graph, sigmaContainer.current, settings);

    // Ignore all doubleClicks for now
    renderer.on("doubleClickNode", (e) => e.preventSigmaDefault())
    renderer.on("doubleClickEdge", (e) => e.preventSigmaDefault())
    renderer.on("doubleClickStage", (e) => e.preventSigmaDefault())

    init(renderer);

    return () => {
      renderer.kill()
    }
  }, [graph, init])

  useRightMousePan(sigmaContainer, sigma)
  useMultiselect(sigma)
  useDragNodes(sigma)
  useNodeHighlight(sigma)
  useFabricDrawing(sigma)

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