// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useMemo } from 'react'

import ArchiveTabPanel from './tab/ArchiveTabPanel'
import AnalysisTabPanel from './tab/AnalysisTabPanel'
import LayoutTabPanel from './tab/LayoutTabPanel'
import MapTabPanel from './tab/MapTabPanel'
import ToolsTabPanel from './tab/ToolsTabPanel'
import StartTabPanel from './tab/StartTabPanel'
import StyleTabPanel from './tab/StyleTabPanel'
import SearchTabPanel from './tab/SearchTabPanel'

import configService from '../../services/configurationService'
import useAppStore, { type Tab } from '../../store/app-store'
import { useTranslation } from 'react-i18next'

function RibbonMenu () {
  const { t } = useTranslation();
  const configuration = configService.getConfiguration()

  const activeTab = useAppStore((state) => state.selectedTab)
  const setActiveTab = useAppStore((state) => state.setTab)
  const setActiveTool = useAppStore((state) => state.setTool)

  function showTab (tab: Tab) {
    setActiveTool(undefined)
    setActiveTab(tab)
  }

  function getTab (tab: Tab) {
    switch (tab) {
      case 'archive':
        return <ArchiveTabPanel />
      case 'start':
        return <StartTabPanel />
      case 'search find':
        return <SearchTabPanel />
      case 'analysis':
        return <AnalysisTabPanel />
      case 'look feel':
        return <StyleTabPanel />
      case 'show':
        return <LayoutTabPanel />
      case 'select':
        return <ToolsTabPanel />
      case 'map':
        return <MapTabPanel />
      default:
        return null
    }
  }

  const [searchToolsAvailable, exploreToolsAvailable] = useMemo(() => {
    return [
      (configService.getSearchServices().filter(s => s.Parameters.Form != null)?.length ?? 0) > 0,
      (configService.getSearchServices().filter(s => s.Parameters.EntityTypes != null)?.length ?? 0) > 0
    ]
  }, [])

  const tabs = useMemo(() => {
    let tabs = ['archive', 'start', 'search find', 'analysis', 'look feel', 'select', 'show', 'map'] as Tab[]

    if (configuration.Menu?.Archive?.Show === false) {
      tabs = tabs.filter(t => t !== 'archive')
    }

    if (configuration.MapConfiguration == null) {
      tabs = tabs.filter(t => t !== 'map')
    }

    if (!searchToolsAvailable && !exploreToolsAvailable) {
      tabs = tabs.filter(t => t !== 'look feel')
    }

    return tabs
  }, [configuration.Menu?.Archive?.Show, configuration.MapConfiguration, exploreToolsAvailable, searchToolsAvailable])

  return <div className="m-flex m-flex-col m-select-none">
    <div className="m-w-full m-ml-2 m-leading-6">
      <ul>
        {tabs.map(tab =>
          <li key={tab} className={'m-inline m-whitespace-nowrap m-cursor-pointer m-px-2 m-p-1 m-mx-1 ' + (activeTab === tab ? 'm-bg-gray-100 m-text-black' : 'hover:m-bg-slate-400 hover:m-text-black')} onClick={() => { showTab(tab) }}>{t(tab)}</li>
        )}
      </ul>
    </div>
    <div className="m-w-full m-flex m-flex-row">
      <div className="m-w-full m-bg-gray-100 m-text-black">
        {getTab(activeTab)}
      </div>
    </div>
  </div>
}

export default RibbonMenu