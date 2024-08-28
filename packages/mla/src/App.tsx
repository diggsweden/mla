// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useMemo } from 'react'

import Chart from './components/chart/Chart'
import RibbonMenu from './components/ribbon/RibbonMenu'
import PropertiesPanel from './components/properties/PropertiesPanel'
import ToolPanel from './components/tools/ToolPanel'
import Timeline from './components/timeline/Timeline'
import useMainStore from './store/main-store'
import configService from './services/configurationService'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import useAppStore from './store/app-store'
import { getContextValue } from './utils/utils'
import ErrorBoundary from './components/common/ErrorBoundary'
import AppShortcuts from './components/common/AppShortcuts'
import Footer from './components/common/Footer'
import Map from './components/map/Map'

import 'vis-network/dist/dist/vis-network.min.css'
import './App.scss'

export function App () {
  const history = useAppStore((state) => state.historyMode)
  const map = useAppStore((state) => state.showMap)
  const context = useMainStore((state) => state.context)
  const title = useMemo(() => getContextValue(context, 'title') ?? 'Mönster Länk Analys - verktyget', [context])

  return (
    <AppShortcuts className="h-full w-full max-h-full max-w-full text-base flex flex-col">
      <DndProvider backend={HTML5Backend}>
        <header className="h-100 flex-none w-full border-b border-gray-300 text-white bg-primary">
          <h1 className='pt-2 pb-2 pl-4'>MLA - {title}</h1>
            <RibbonMenu />
        </header>
        <section className="flex-1 flex min-h-0 relative">
          <Chart className='h-full flex-1 relative overflow-hidden'>
            <div className='h-full w-full flex flex-row overflow-hidden'>
              <ToolPanel className="w-72 flex-none h-full border-r border-gray-300 pointer-events-auto" />
              <div className='flex-1 flex pointer-events-none'>
                {history && <div className='w-full self-end mb-5'>
                  <Timeline className='pointer-events-auto' />
                </div>}
              </div>
              <PropertiesPanel className="w-72 flex-none h-full border-l border-gray-300 pointer-events-auto" />
            </div>
          </Chart>

          {configService.getConfiguration().MapConfiguration && (<ErrorBoundary>
            <div className={(map ? '' : 'hidden ') + 'h-full w-1 bg-gray-300 z-10 hover:cursor-col-resize'} />
            <Map className={(map ? '' : 'hidden ') + 'h-full w-full flex-1'} />
          </ErrorBoundary>)}
        </section>
        
          <Footer />
      </DndProvider>
    </AppShortcuts>
  )
}
