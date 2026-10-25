// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { create } from 'zustand'
import queryService, { type IQueryResponse } from '../services/queryService'
import useAppStore from './app-store'
import configService from '../services/configurationService'
import type { IImportConfiguration, IQueryIntegration } from '../interfaces/configuration'
import useMainStore from './main-store'
import { getPluginFunction } from '../utils/plugin-functions'

interface SearchState {
  searchTool: IQueryIntegration | undefined
  exploreTool: IQueryIntegration | undefined
  importTool: IImportConfiguration | undefined
  result?: IQueryResponse

  loading: boolean

  setImportTool: (id: string) => void
  setSearchTool: (id: string) => void
  setExploreTool: (id: string) => void
  clearSelectedTool: () => void

  import: (fileContents: string) => IQueryResponse
  search: (query: unknown) => Promise<IQueryResponse>
  explore: () => Promise<IQueryResponse>
}

const noTool = {
  searchTool: undefined,
  exploreTool: undefined,
  importTool: undefined,
  loading: false,
  result: undefined
}

function noResult (error: unknown): IQueryResponse {
  window.alert(String(error))
  return { Entities: [], Links: [], Events: [] }
}

const useSearchStore = create<SearchState>((set, get) => ({
  ...noTool,

  setSearchTool: (id: string) => {
    if (id !== get().searchTool?.Id) {
      useAppStore.getState().setTool('search')
      set(() => ({ ...noTool, searchTool: configService.getSearchServices().find(x => x.Id === id) }))
    }
  },

  setExploreTool: (id: string) => {
    if (id !== get().exploreTool?.Id) {
      useAppStore.getState().setTool('explore')
      set(() => ({ ...noTool, exploreTool: configService.getSearchServices().find(x => x.Id === id) }))
    }
  },

  setImportTool: (id: string) => {
    if (id !== get().importTool?.Id) {
      useAppStore.getState().setTool('import')
      set(() => ({ ...noTool, importTool: configService.getImportServices().find(x => x.Id === id) }))
    }
  },

  clearSelectedTool: () => {
    set(() => noTool)
  },

  search: async (query: unknown) => {
    useAppStore.getState().setTool('search')
    set(() => ({ loading: true, result: undefined }))

    try {
      const result = await queryService.queryForm(get().searchTool!.Id, query)
      set(() => ({ loading: false, result }))
      return result
    } catch (error) {
      set(() => ({ loading: false }))
      return noResult(error)
    }
  },
  explore: async () => {
    useAppStore.getState().setTool('explore')
    const query = useMainStore.getState().selectedEntities
    const shape = useAppStore.getState().selectedGeoFeature
    set(() => ({ loading: true, result: undefined }))

    try {
      const result = await queryService.queryEntities(get().exploreTool!.Id, query, shape)
      set(() => ({ loading: false, result }))
      return result
    } catch (error) {
      set(() => ({ loading: false }))
      return noResult(error)
    }
  },
  import: (fileContents: string) => {
    useAppStore.getState().setTool('import')
    set(() => ({ loading: true, result: undefined }))

    try {
      const transformFunction = get().importTool?.TransformFunction
      const result = transformFunction
        ? getPluginFunction(transformFunction)(fileContents) as IQueryResponse
        : JSON.parse(fileContents) as IQueryResponse
      if (result?.Entities == null) {
        throw new Error('result.Entities is not Entity[]')
      }
      if (result?.Links == null) {
        throw new Error('result.Links is not Link[]')
      }

      set(() => ({ loading: false, result }))
      return result
    } catch (error) {
      set(() => ({ loading: false }))
      return noResult(error)
    }
  }
}))

// Closing the tool panel also forgets what was searched for
useAppStore.subscribe((state, previous) => {
  if (state.selectedTool === undefined && previous.selectedTool !== undefined) {
    useSearchStore.getState().clearSelectedTool()
  }
})

export default useSearchStore
