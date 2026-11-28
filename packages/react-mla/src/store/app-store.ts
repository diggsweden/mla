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

// A relation to be made between two entities, by their ids in the chart. A drawn one points to the entity it ended on,
// and it can be of the types given, or else of any type that can be between the two
export interface LinkRequest { from: string, to: string, typeIds?: string[], drawn?: boolean }

// An entity to be made. Every request has its own key, so that the dialog starts over also for the same type
export interface EntityRequest { typeId: string, position?: { x: number, y: number }, key: number }
let entityRequests = 0

interface AppState {
  contextmenuPosition: { x: number, y: number } | undefined
  // Where in the chart the menu was opened, for what is made there
  contextmenuChartPosition: { x: number, y: number } | undefined
  showContextMenu: (x: number, y: number, chart?: { x: number, y: number }) => void
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
  // The panel of properties: fastened open also when nothing is selected, or closed until something else is selected
  propertiesPinned: boolean
  setPropertiesPinned: (pinned: boolean) => void
  propertiesClosed: boolean
  setPropertiesClosed: (closed: boolean) => void
  // The explanations of the fields in the panel, all shown or each opened by itself. Kept on the computer
  fieldHelp: boolean
  setFieldHelp: (shown: boolean) => void
  // The one of the selected items that the panel shows, or that the pointer is on in its list, which the chart shows more clearly
  focusedId: string | undefined
  setFocusedId: (id?: string) => void
  // A relation is drawn by dragging from one entity to another
  linkTool: boolean
  setLinkTool: (on: boolean) => void
  // The entity a relation is drawn from when it was started from the menu: the line follows the mouse until another entity is clicked
  linkFrom: string | undefined
  startLinkFrom: (id: string) => void
  // The entities a relation is to be made between, by their ids in the chart, until it is made or cancelled
  drawnLink: LinkRequest | undefined
  setDrawnLink: (link?: LinkRequest) => void
  // An entity to be made, by its type, and where in the chart when it was asked for from there, until it is made or cancelled
  entityRequest: EntityRequest | undefined
  requestEntity: (request?: { typeId: string, position?: { x: number, y: number } }) => void
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

// Whether the panel of properties is fastened is the user's own choice on this computer
const PINNED_KEY = 'mla.properties.pinned'
const HELP_KEY = 'mla.properties.help'
function readFlag (key: string): boolean {
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}
const readPinned = () => readFlag(PINNED_KEY)

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
  contextmenuChartPosition: undefined,
  showContextMenu: (x: number, y: number, chart?: { x: number, y: number }) => {
    set(() => ({
      contextmenuPosition: { x, y },
      contextmenuChartPosition: chart
    }))
  },
  hideContextMenu: () => {
    set(() => ({
      contextmenuPosition: undefined,
      contextmenuChartPosition: undefined
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
    // One tool at a time takes the mouse in the chart
    set(() => (type != null ? { shapeTool: type, linkTool: false } : { shapeTool: type }))
  },
  propertiesPinned: readPinned(),
  setPropertiesPinned: (pinned: boolean) => {
    try { window.localStorage.setItem(PINNED_KEY, String(pinned)) } catch { /* only kept until the page is closed */ }
    set(() => ({ propertiesPinned: pinned }))
  },
  propertiesClosed: false,
  setPropertiesClosed: (closed: boolean) => {
    set(() => ({ propertiesClosed: closed }))
  },
  fieldHelp: readFlag(HELP_KEY),
  setFieldHelp: (shown: boolean) => {
    try { window.localStorage.setItem(HELP_KEY, String(shown)) } catch { /* only kept until the page is closed */ }
    set(() => ({ fieldHelp: shown }))
  },
  focusedId: undefined,
  setFocusedId: (id?: string) => {
    set(() => ({ focusedId: id }))
  },
  linkTool: false,
  setLinkTool: (on: boolean) => {
    set(() => (on ? { linkTool: true, shapeTool: undefined } : { linkTool: false, linkFrom: undefined }))
  },
  linkFrom: undefined,
  startLinkFrom: (id: string) => {
    set(() => ({ linkTool: true, shapeTool: undefined, linkFrom: id }))
  },
  entityRequest: undefined,
  requestEntity: (request) => {
    set(() => ({ entityRequest: request != null ? { ...request, key: ++entityRequests } : undefined }))
  },
  drawnLink: undefined,
  setDrawnLink: (link?: LinkRequest) => {
    set(() => ({ drawnLink: link }))
  },
  editingShapeId: undefined,
  setEditingShapeId: (id?: string) => {
    set(() => ({ editingShapeId: id }))
  }
}))

export default useAppStore
