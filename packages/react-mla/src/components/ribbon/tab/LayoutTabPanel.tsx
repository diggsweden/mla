// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useAppStore from '../../../store/app-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import configService from '../../../services/configurationService'
import { type ChangeEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import useMainStore from '../../../store/main-store'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import FA2Layout from "graphology-layout-forceatlas2/worker";

function LayoutTabPanel() {
  const { t } = useTranslation();
  const config = configService.getConfiguration()
  const graph = useMainStore((state) => state.graph)
  const storePositions = useMainStore((state) => state.storePositions)
  const setLayout = useAppStore((state) => state.setLayout)
  const view = useAppStore((state) => state.view)
  const setView = useAppStore((state) => state.setView)
  const layoutId = useAppStore((state) => state.layoutId)

  function changeView(event: ChangeEvent<HTMLSelectElement>) {
    const viewId = event.target.value
    setView(viewId)
  }

  const layoutRef = useRef(undefined as any);
  function toggleDynamic() {
    if (graph) {
      if (layoutId === 'Dynamic') {
        setLayout("reset")
        if (layoutRef.current) {
          layoutRef.current.stop();
          graph.forEachNode(n => {
            graph.updateNodeAttribute(n, "fixed", () => true)
          })
          storePositions();
        }
      } else {
        setLayout('Dynamic')
        const sensibleSettings = forceAtlas2.inferSettings(graph);
        const fa2Layout = new FA2Layout(graph, {
          settings: {
            ...sensibleSettings,
          }
        });

        graph.forEachNode(n => {
          graph.removeNodeAttribute(n, "fixed")
        })

        fa2Layout.start();
        layoutRef.current = fa2Layout
      }
    }
  }

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title={t('placement')} >
      <RibbonMenuButton label={(t('up'))} onClick={() => { setLayout('UD') }} iconName="outlined_account_tree" iconClassName="-rotate-90 -scale-x-100" />
      <RibbonMenuButton label={(t('down'))} onClick={() => { setLayout('DU') }} iconName="outlined_account_tree" iconClassName="-rotate-90" />
      <RibbonMenuButton label={(t('left'))} onClick={() => { setLayout('LR') }} iconName="outlined_account_tree" />
      <RibbonMenuButton label={(t('right'))} onClick={() => { setLayout('RL') }} iconName="outlined_account_tree" iconClassName="-rotate-180" />
      <RibbonMenuButton label={layoutId === 'Dynamic' ? t('stop') : t('dynamic')} onClick={() => { toggleDynamic() }} iconName="autorenew" iconClassName={layoutId === 'Dynamic' ? 'animate-spin' : ''} />
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
