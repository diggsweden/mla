// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand'
import chartLayouts from '../utils/chart-layouts'
import interactionOptions from '../utils/interaction-options'

import type { IBaseViewConfiguration, IViewConfiguration } from '../interfaces/configuration/view-configuration'
import { type IGeoFeatureBounds } from '../interfaces/data-models/geo'
import viewService from '../services/viewService'
import { internalUpdateLabels } from './internal-actions'
import useMainStore from './main-store'
import useSearchStore from './search-state'

export type Tab = 'archive' | 'start' | 'search find' | 'analysis' | 'select' | 'look feel' | 'show' | 'map' | 'draw'
export type Tool = 'search' | 'explore' | 'import' | 'activity'

interface AppState {
  contextmenuPosition: { x: number, y: number } | undefined
  showContextMenu: (x: number, y: number) => void
  hideContextMenu: () => void

  selectedGeoFeature: IGeoFeatureBounds | undefined
  setSelectedGeoFeature: (feature?: IGeoFeatureBounds) => void
  placeEntityId: string | undefined
  setPlaceEntityId: (placeEntityId?: string) => void

  currentViewConfiguration: IViewConfiguration
  thingViewConfiguration: Record<string, IBaseViewConfiguration>

  view: string

  selectedTab: Tab
  selectedTool: Tool | undefined
  layout: any
  layoutId: string
  interaction: any
  historyMode: boolean
  showMap: boolean
  hoverEffect: boolean

  mapLayers: number[]
  setMapLayers: (layers: number[]) => void

  setShowMap: (show: boolean) => void
  setTab: (tab: Tab) => void
  setLayout: (layoutId: string) => void
  setInteraction: (interactionId: string) => void
  setInteractionObject: (interaction: any) => void

  setView: (viewId: string) => void
  setTool: (tool?: Tool) => void
  setHistoryMode: (value: boolean) => void
  setHoverEffect: (value: boolean) => void
}

const useAppStore = create<AppState>((set, get) => ({
  thingViewConfiguration: {},
  currentViewConfiguration: { Id: 'default', Name: 'default', Show: [] },

  view: 'default',
  setView: (viewId: string) => {
    const v = viewService.getConfiguration().find(c => c.Id === viewId)
    if (v == null) {
      return
    }

    const update = v.Show.reduce(function (map, obj) {
      map[obj.TypeId] = obj
      return map
    }, {} as Record<string, IBaseViewConfiguration>)

    set((state) => ({
      view: viewId,
      currentViewConfiguration: v,
      thingViewConfiguration: update
    }))

    internalUpdateLabels()
  },

  contextmenuPosition: undefined,
  showContextMenu: (x: number, y: number) => {
    set((state) => ({
      contextmenuPosition: { x, y }
    }))
  },
  hideContextMenu: () => {
    set((state) => ({
      contextmenuPosition: undefined
    }))
  },

  selectedGeoFeature: undefined,
  setSelectedGeoFeature: (feature?: IGeoFeatureBounds) => {
    set((state) => ({
      selectedGeoFeature: feature
    }))
  },
  placeEntityId: undefined,
  setPlaceEntityId: (placeEntityId?: string) => {
    set((state) => ({
      placeEntityId
    }))
  },

  layoutId: 'reset',
  layout: chartLayouts.reset,
  setLayout: (layoutId: string) => {
    set((state) => ({
      layoutId,
      layout: chartLayouts[layoutId]
    }))
  },
  historyMode: false,
  setHistoryMode: (value: boolean) => {
    set((state) => ({
      historyMode: value,
      selectedTool: value ? 'activity' : undefined
    }))

    const main = useMainStore.getState()

    main.setSelected([])
    main.setDate(main.minDate)
  },
  interaction: interactionOptions.reset,
  setInteraction: (interactionId: string) => {
    set((state) => ({
      interaction: interactionOptions[interactionId]
    }))
  },
  setInteractionObject: (interaction: string) => {
    set((state) => ({
      interaction
    }))
  },

  hoverEffect: false,
  setHoverEffect: (enabled) => {
    set((state) => ({
      hoverEffect: enabled
    }))
  },
  selectedTab: 'start',
  setTab: (tab) => {
    set((state) => ({
      selectedTab: tab,
    }))
  },

  selectedTool: undefined,
  setTool: (tool) => {
    if (tool === undefined) {
      useSearchStore.getState().clearSelectedTool()
    }
    set((state) => ({
      historyMode: false,
      selectedTool: tool
    }))
  },

  showMap: false,
  setShowMap: (showMap: boolean) => {
    set((state) => ({
      showMap
    }))
  },

  mapLayers: [0],
  setMapLayers: (layers: number[]) => {
    set((state) => ({
      mapLayers: layers
    }))
  }
}))

export default useAppStore
