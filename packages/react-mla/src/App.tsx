// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useMemo, lazy, Suspense } from 'react'

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

import 'vis-network/dist/dist/vis-network.min.css'
import './App.scss'

const Map = lazy(() =>
  import("./components/map/Map").then((module) => ({
    default: module.Map,
  }))
);

export function App () {
  const history = useAppStore((state) => state.historyMode)
  const map = useAppStore((state) => state.showMap)
  const context = useMainStore((state) => state.context)
  const title = useMemo(() => getContextValue(context, 'title') ?? 'Mönster Länk Analys - verktyget', [context])

  return (
    <AppShortcuts className="m-h-full m-w-full m-max-h-full m-max-w-full m-text-base m-flex m-flex-col">
      <DndProvider backend={HTML5Backend}>
        <header className="m-h-100 m-flex-none m-w-full m-border-b m-border-gray-300 m-text-white m-bg-primary">
          <h1 className="m-pt-2 m-pb-2 m-pl-4">MLA - {title}</h1>
            <RibbonMenu />
        </header>
        <section className="m-flex-1 m-flex m-min-h-0 m-relative">
          <Chart className="m-h-full m-flex-1 m-relative m-overflow-hidden">
            <div className="m-h-full m-w-full m-flex m-flex-row m-overflow-hidden">
              <ToolPanel className="m-w-72 m-flex-none m-h-full m-border-r m-border-gray-300 m-pointer-events-auto" />
              <div className="m-flex-1 m-flex m-pointer-events-none">
                {history && <div className="m-w-full m-self-end m-mb-5">
                  <Timeline className="m-pointer-events-auto" />
                </div>}
              </div>
              <PropertiesPanel className="m-w-72 m-flex-none m-h-full m-border-l m-border-gray-300 m-pointer-events-auto" />
            </div>
          </Chart>

          {configService.getConfiguration().MapConfiguration && (<ErrorBoundary>
            <div className={(map ? '' : 'm-hidden ') + 'm-h-full m-w-1 m-bg-gray-300 m-z-10 hover:m-cursor-col-resize'} />
            <Suspense>
              <Map className={(map ? '' : 'm-hidden ') + 'm-h-full m-w-full m-flex-1'} />
            </Suspense>
          </ErrorBoundary>)}
        </section>
        
          <Footer />
      </DndProvider>
    </AppShortcuts>
  )
}
