// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDrop } from 'react-dnd'
import { NodeImageProgram } from "@sigma/node-image";
import { NodeBorderProgram } from "@sigma/node-border";

import Graph from "graphology";
import Sigma from "sigma";

import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'
import useKeyDown from '../../effects/keydown'

import type { IEntity } from '../../interfaces/data-models'
import { produce } from 'immer'
import ContentRenderer from './sigma/ContentRenderer';
import useMultiselect from './multiselect';

interface Props {
  className?: string
  children?: React.ReactNode
}

function Chart(props: Props) {
  const setSelected = useMainStore((state) => state.setSelected)

  const sigma = useMainStore((state) => state.sigma)

  const init = useMainStore((state) => state.initSigma)

  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)

  const getHistory = useMainStore((state) => state.getEntityHistory)
  const update = useMainStore((state) => state.updateEntity)

  const showContextMenu = useAppStore(state => state.showContextMenu)

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const sigmaContainer = useRef<HTMLDivElement>(null)
  const draggedNode = useRef(null as string | null)
  const isDragging = useRef(false);
  const disableHoverEffect = useAppStore(state => !state.hoverEffect)
  useLayoutEffect(() => {
    if (sigmaContainer.current == null) {
      return
    }

    const graph = new Graph();
    const renderer = new Sigma(graph, sigmaContainer.current, {
      nodeProgramClasses: {
        image: NodeImageProgram,
        border: NodeBorderProgram,
      },
      enableEdgeEvents: true,
      renderEdgeLabels: true,
      autoCenter: false,
      autoRescale: false,
      // defaultDrawNodeLabel: drawLabel,
    });

    init(graph, renderer);

    renderer.on("enterNode", e => setHoveredNode(e.node));
    renderer.on("leaveNode", () => setHoveredNode(null));

    // On mouse down on a node
    //  - we enable the drag mode
    //  - save in the dragged node in the state
    //  - highlight the node
    //  - disable the camera so its state is not updated
    renderer.on("downNode", (e) => {
      const click = e.event.original as MouseEvent;
      if (click.button != 0) {
        return;
      }
      draggedNode.current = e.node;
      graph.setNodeAttribute(draggedNode.current, "fixed", false);
      if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
    });

    // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
    renderer.on("moveBody", ({ event }) => {
      if (!draggedNode.current) return;

      isDragging.current = true;

      // Get new position of node
      const pos = renderer.viewportToGraph(event);

      graph.setNodeAttribute(draggedNode.current, "x", pos.x);
      graph.setNodeAttribute(draggedNode.current, "y", pos.y);

      // Prevent sigma to move camera:
      event.preventSigmaDefault();
      event.original.preventDefault();
      event.original.stopPropagation();
    });

    renderer.on("upNode", (e) => {
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
    });

    renderer.on("clickEdge", (e) => {
      if (e.event.original.ctrlKey) {
        const selected = useMainStore.getState().selectedIds;
        setSelected([e.edge, ...selected])
      } else {
        setSelected([e.edge])
      }
    })

    renderer.on("upStage", () => {
      if (draggedNode.current && isDragging.current) {
        graph.removeNodeAttribute(draggedNode.current, "dragging");
      } 
      
      isDragging.current = false;
      draggedNode.current = null;
    });

    renderer.on("rightClickNode", (e) => {
      setSelected([e.node])
      const click = e.event.original as MouseEvent;
      showContextMenu(click.pageX, click.pageY)
      e.preventSigmaDefault();
      e.event.original.preventDefault();
      e.event.original.stopPropagation();
    });

    return () => {
      renderer.kill()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMultiselect(sigmaContainer, sigma)

  useEffect(() => {
    if (sigma) {
      sigma.setSetting("nodeReducer", (node, data) => {
        const graph = sigma.getGraph();
        const newData = { ...data, highlighted: data.highlighted || false };

        if (!disableHoverEffect && hoveredNode) {
          if (node === hoveredNode || graph.neighbors(hoveredNode).includes(node)) {
            newData.highlighted = true;
          } else {
            newData.highlighted = false;
          }
        }
        return newData;
      })
      sigma.setSetting("edgeReducer", (edge, data) => {
        const graph = sigma.getGraph();
        const newData = { ...data, hidden: false };

        if (!disableHoverEffect && hoveredNode && !graph.extremities(edge).includes(hoveredNode)) {
          newData.hidden = true;
        }
        return newData;
      });
    }
  }, [hoveredNode, sigma, disableHoverEffect]);

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
