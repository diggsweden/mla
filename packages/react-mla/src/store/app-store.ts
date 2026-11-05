// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { create } from 'zustand'

import type { IBaseViewConfiguration, IViewConfiguration } from '../interfaces/configuration/view-configuration'
import { type IGeoFeatureBounds } from '../interfaces/data-models/geo'
import viewService from '../services/viewService'
import chartLayouts, { type ChartLayout } from '../utils/chart-layouts'
import interactionOptions, { type InteractionOptions } from '../utils/interaction-options'
import type { ShapeType } from '../interfaces/data-models/shape'

export type Tab = 'archive' | 'start' | 'search find' | 'analysis' | 'draw' | 'select' | 'look feel' | 'show' | 'map'
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
  layout: ChartLayout
  layoutId: string
  interaction: InteractionOptions
  historyMode: boolean
  showMap: boolean

  mapLayers: number[]
  setMapLayers: (layers: number[]) => void

  // The type of shape that is drawn on the chart next, and the text that is being written
  shapeTool: ShapeType | undefined
  setShapeTool: (type?: ShapeType) => void
  editingShapeId: string | undefined
  setEditingShapeId: (id?: string) => void

  setShowMap: (show: boolean) => void
  setTab: (tab: Tab) => void
  setLayout: (layoutId: string) => void
  setInteraction: (interactionId: string) => void
  setInteractionObject: (interaction: InteractionOptions) => void

  setView: (viewId: string) => void
  setTool: (tool?: Tool) => void
  setHistoryMode: (value: boolean) => void
}

const useAppStore = create<AppState>((set) => ({
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

    viewService.setSelectedViews(update)
    set(() => ({
      view: viewId,
      currentViewConfiguration: v,
      thingViewConfiguration: update
    }))
  },

  contextmenuPosition: undefined,
  showContextMenu: (x: number, y: number) => {
    set(() => ({
      contextmenuPosition: { x, y }
    }))
  },
  hideContextMenu: () => {
    set(() => ({
      contextmenuPosition: undefined
    }))
  },

  selectedGeoFeature: undefined,
  setSelectedGeoFeature: (feature?: IGeoFeatureBounds) => {
    set(() => ({
      selectedGeoFeature: feature
    }))
  },
  placeEntityId: undefined,
  setPlaceEntityId: (placeEntityId?: string) => {
    set(() => ({
      placeEntityId
    }))
  },

  layoutId: 'reset',
  layout: chartLayouts.reset,
  setLayout: (layoutId: string) => {
    set(() => ({
      layoutId,
      layout: chartLayouts[layoutId]
    }))
  },
  historyMode: false,
  setHistoryMode: (value: boolean) => {
    set(() => ({
      historyMode: value,
      selectedTool: value ? 'activity' : undefined
    }))
  },
  interaction: interactionOptions.reset,
  setInteraction: (interactionId: string) => {
    set(() => ({
      interaction: interactionOptions[interactionId]
    }))
  },
  setInteractionObject: (interaction: InteractionOptions) => {
    set(() => ({
      interaction
    }))
  },

  selectedTab: 'start',
  setTab: (tab) => {
    set(() => ({
      selectedTab: tab
    }))
  },

  selectedTool: undefined,
  setTool: (tool) => {
    set(() => ({
      historyMode: false,
      selectedTool: tool
    }))
  },

  showMap: false,
  setShowMap: (showMap: boolean) => {
    set(() => ({
      showMap
    }))
  },

  mapLayers: [0],
  setMapLayers: (layers: number[]) => {
    set(() => ({
      mapLayers: layers
    }))
  },

  shapeTool: undefined,
  setShapeTool: (type?: ShapeType) => {
    set(() => ({ shapeTool: type }))
  },
  editingShapeId: undefined,
  setEditingShapeId: (id?: string) => {
    set(() => ({ editingShapeId: id }))
  }
}))

export default useAppStore
