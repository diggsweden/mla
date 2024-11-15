// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useAppStore from '../../../store/app-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import configService from '../../../services/configurationService'
import { type ChangeEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useMainStore from '../../../store/main-store'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import circlepack from 'graphology-layout/circlepack'
import louvain from 'graphology-communities-louvain'
import FA2Layout from "graphology-layout-forceatlas2/worker"
import NoverlapLayout from 'graphology-layout-noverlap/worker'
import { animateNodes } from "sigma/utils"
import { PlainObject } from 'sigma/types'
import { fitViewportToNodes } from '@sigma/utils'

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

  function setGroupLayout() {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    const details = louvain.detailed(graph);
    console.log(details);

    // To directly assign communities as a node attribute
    louvain.assign(graph);

    const positions = circlepack(graph, {
      scale: 2,
      hierarchyAttributes: ['community'],
    });

    cancelAnimation.current = animateNodes(graph, positions, { duration: 2000 }, () => {
      storePositions();
      fit();
    });
  }

  function toggleFa2() {
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

        const layout = new NoverlapLayout(graph, {
          settings: {
            gridSize: 80,
            margin: 40,
            speed: 1
          }
        });

        graph.forEachNode(n => {
          graph.removeNodeAttribute(n, "fixed")
        })

        cancelAnimation.current = () => {
          layout.kill();
        }

        layout.start();
      }
    }
  }

  function fit() {
    if (sigma) {
      fitViewportToNodes(
        sigma,
        graph.nodes(),
        { animate: true },
      );
    }
  }

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title={t('placement')} >
      <RibbonMenuButton label={(t('up'))} onClick={() => { setRandomLayout() }} iconName="outlined_casino" />
      <RibbonMenuButton label={'circle'} onClick={() => { setGroupLayout() }} iconName="workspaces" />
      <RibbonMenuButton label={layout === 'na' ? t('stop') : t('placera')} onClick={() => { toggleNoOverlap() }} iconName="join" iconClassName={layout === 'na' ? 'm-animate-spin' : ''} />
      <RibbonMenuButton label={layout === 'fa2' ? t('stop') : t('dynamic')} onClick={() => { toggleFa2() }} iconName="hub" iconClassName={layout === 'fa2' ? 'm-animate-spin' : ''} />
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
