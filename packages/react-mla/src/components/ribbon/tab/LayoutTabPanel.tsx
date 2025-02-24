// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import louvain from 'graphology-communities-louvain'
import ForceSupervisor from 'graphology-layout-force/worker'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import FA2Layout from "graphology-layout-forceatlas2/worker"
import NoverlapLayout from 'graphology-layout-noverlap/worker'
import circlepack from 'graphology-layout/circlepack'
import { type ChangeEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlainObject } from 'sigma/types'
import { animateNodes } from "sigma/utils"
import configService from '../../../services/configurationService'
import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'
import { fitNodesInView } from '../../chart/sigma/chart-utils'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuSection from '../RibbonMenuSection'

function LayoutTabPanel() {
  const { t } = useTranslation();

  type Cancel = () => void

  const cancelAnimation = useRef(null as null | Cancel);
  const config = configService.getConfiguration()
  const graph = useMainStore((state) => state.graph)
  const sigma = useMainStore((state) => state.sigma)
  const storePositions = useMainStore((state) => state.storePositions)
  const view = useAppStore((state) => state.view)
  const setView = useAppStore((state) => state.setView)

  const [layout, setLayout] = useState("")

  function changeView(event: ChangeEvent<HTMLSelectElement>) {
    const viewId = event.target.value
    setView(viewId)
  }

  function setRandomLayout() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    const xExtents = { min: 0, max: 0 };
    const yExtents = { min: 0, max: 0 };
    graph.forEachNode((_node, attributes) => {
      xExtents.min = Math.min(attributes.x, xExtents.min);
      xExtents.max = Math.max(attributes.x, xExtents.max);
      yExtents.min = Math.min(attributes.y, yExtents.min);
      yExtents.max = Math.max(attributes.y, yExtents.max);
    });
    const randomPositions: PlainObject<PlainObject<number>> = {};
    graph.forEachNode((node) => {
      randomPositions[node] = {
        x: Math.random() * (xExtents.max - xExtents.min),
        y: Math.random() * (yExtents.max - yExtents.min),
      };
    });

    cancelAnimation.current = animateNodes(graph, randomPositions, { duration: 2000 }, () => {
      storePositions();
      fit();
    });
  }

  function setCircleLayout() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    // To directly assign communities as a node attribute
    louvain.assign(graph);

    const scale = graph.nodes().length * 1;
    const positions = circlepack(graph, {
      scale: scale,
      hierarchyAttributes: ['community'],
    });

    cancelAnimation.current = animateNodes(graph, positions, { duration: 2000 }, () => {
      storePositions();
      fit();
    });
  }

  function toggleNoOverlap() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    if (graph) {
      if (layout === 'na') {
        setLayout("reset")
        graph.forEachNode(n => {
          graph.updateNodeAttribute(n, "fixed", () => true)
        })
        storePositions();
        fit();
      } else {
        setLayout('na')

        const margin = graph.nodes().length * 20;
        const noOverlapLayout = new NoverlapLayout(graph, {
          settings: {
            gridSize: 80,
            margin: margin,
            speed: 1
          }
        });

        graph.forEachNode(n => {
          graph.removeNodeAttribute(n, "fixed")
        })

        cancelAnimation.current = () => {
          noOverlapLayout.kill();
        }

        noOverlapLayout.start();
      }
    }
  }

  function toggleForceLayout() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }
    if (graph) {
      if (layout === 'fl') {
        setLayout("reset")
        graph.forEachNode(n => {
          graph.updateNodeAttribute(n, "fixed", () => true)
        })
        storePositions();
        fit();
      } else {
        setLayout('fl')

        graph.forEachNode(n => {
          graph.removeNodeAttribute(n, "fixed")
        })

        const forceLayoutSupervisor = new ForceSupervisor(graph, {
          settings: {
            attraction: 0.0005,
            repulsion: 10,
            gravity: 0.0001,
            inertia: 0.6,
            maxMove: 200
          }
        });

        cancelAnimation.current = () => {
          forceLayoutSupervisor.kill();

          graph?.forEachNode(n => {
            const x = graph.getNodeAttribute(n, "x")
            const y = graph.getNodeAttribute(n, "y")
            console.log("Pos", n, x, y)
          })

        }

        forceLayoutSupervisor.start();
      }
    }
  }

  function toggleForceAtlas2Layout() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }
    if (graph) {
      if (layout === 'fa2') {
        setLayout("reset")
        graph.forEachNode(n => {
          graph.updateNodeAttribute(n, "fixed", () => true)
        })
        storePositions();
        fit();
      } else {
        setLayout('fa2')
        const sensibleSettings = forceAtlas2.inferSettings(graph);
        const fa2Layout = new FA2Layout(graph, {
          settings: {
            ...sensibleSettings,
            gravity: 0.025,
            scalingRatio: 400,
            adjustSizes: true
          }
        });

        graph.forEachNode(n => {
          graph.removeNodeAttribute(n, "fixed")
        })

        cancelAnimation.current = () => {
          fa2Layout.kill();
        }

        fa2Layout.start();
      }
    }
  }

  function fit() {
    if (sigma && graph && graph.nodes().length) {
      fitNodesInView(sigma, graph.nodes())
    }
  }

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title={t('placement')} >
      <RibbonMenuButton label={(t('random'))} onClick={() => { setRandomLayout() }} iconName="outlined_casino" />
      <RibbonMenuButton label={t('circle')} onClick={() => { setCircleLayout() }} iconName="workspaces" />
      <RibbonMenuButton label={layout === 'na' ? t('stop') : t('no overlap')} onClick={() => { toggleNoOverlap() }} iconName="join" iconClassName={layout === 'na' ? 'm-animate-spin' : ''} />
      <RibbonMenuButton label={layout === 'fl' ? t('stop') : t('dynamic 1')} onClick={() => { toggleForceLayout() }} iconName="hub" iconClassName={layout === 'fl' ? 'm-animate-spin' : ''} />
      <RibbonMenuButton label={layout === 'fa2' ? t('stop') : t('dynamic 2')} onClick={() => { toggleForceAtlas2Layout() }} iconName="hub" iconClassName={layout === 'fa2' ? 'm-animate-spin' : ''} />
    </RibbonMenuSection>
    <RibbonMenuDivider />
    <RibbonMenuSection title={t('views')}>
      <select onChange={changeView} value={view} className="m-bg-white m-border m-border-gray-300 m-text-gray-900 m-rounded-lg focus:m-ring-blue-500 focus:m-border-blue-500 m-block m-w-full m-p-1">
        {config.Display.map(e => (
          <option key={e.Id} value={e.Id}>{e.Name}</option>
        ))}
      </select>
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </div>
}
export default LayoutTabPanel
