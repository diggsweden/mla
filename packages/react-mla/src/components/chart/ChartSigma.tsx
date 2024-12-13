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
import configService from '../../services/configurationService';
import { TextureManager } from './rendering/svg-node-renderer/texture';
import bindFabricLayer from './fabric-drawing';
import useAppStore from '../../store/app-store';

interface Props {
  className?: string
  children?: React.ReactNode
}

const preloadImages = (manager: TextureManager) => {
  configService.getConfiguration().Display.forEach(c => {
    c.Show.forEach(s => {
      if (s.Icon) {
        manager.registerImage(s.Icon)
      }
    })
  })
}

function Chart(props: Props) {
  const setSelected = useMainStore((state) => state.setSelected)

  const graph = useMainStore((state) => state.graph)
  const sigma = useMainStore((state) => state.sigma)

  const fabric = useMainStore((state) => state.fabric)
  const drawingMode = useAppStore((state) => state.drawingMode)

  const init = useMainStore((state) => state.init)

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
      colorAttribute: "iconColor",
      createCallback: preloadImages
    });

    const NodeProgram = createNodeCompoundProgram([NodeBorderCustomProgram, NodePictogramCustomProgram]);

    const settings = {
      zoomToSizeRatioFunction: (x) => x,
      allowInvalidContainer: true,
      autoRescale: true,
      autoCenter: false,
      itemSizesReference: "positions",
      defaultNodeType: "pictogram",
      defaultEdgeType: "straight",
      stagePadding: 75,
      minCameraRatio: 0.25,
      maxCameraRatio: 5,
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
      defaultDrawNodeLabel: drawDiscNodeLabel,
      defaultDrawNodeHover: drawDiscNodeHover
    } as Partial<Settings>

    const renderer = new Sigma(graph, sigmaContainer.current, settings);

    const setBBox = () => {
      renderer.setCustomBBox({
        x: [0, renderer.getContainer().clientWidth],
        y: [0, renderer.getContainer().clientHeight],
      });
    }

    // Create a custom bbox because the option "autoCenter" is not currently working in sigma
    setBBox();

    // Since we are using a custom bbox, we need to set it if we change the window size
    renderer.on("resize", setBBox);

    // Ignore all doubleClicks for now
    renderer.on("doubleClickNode", (e) => e.preventSigmaDefault())
    renderer.on("doubleClickEdge", (e) => e.preventSigmaDefault())
    renderer.on("doubleClickStage", (e) => e.preventSigmaDefault())

    const fabric = bindFabricLayer(renderer)
    init(renderer, fabric.fabric)

    return () => {
      renderer.kill()
    }
  }, [graph, init])

  useEffect(() => {
    if (fabric != null) {
      fabric.elements.container.style.zIndex = drawingMode ? "1" : "-1"
    }

  }, [drawingMode, fabric])

  useRightMousePan(sigma)
  useMultiselect(sigma)
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
        <div className="m-h-full m-w-full m-outline-none" id="m-chart" tabIndex={1} ref={sigmaContainer}>
        </div>
        <ContentRenderer />
      </div>
    </div>
  )
}

export default Chart