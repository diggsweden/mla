// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2


import { create } from 'zustand'
import queryService, { type IQueryResponse } from '../services/queryService'
import useAppStore from './app-store'
import configService from '../services/configurationService'
import type { IImportConfiguration, IQueryIntegration } from '../interfaces/configuration'
import useMainStore from './main-store'

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
  search: (query: any) => Promise<IQueryResponse>
  explore: () => Promise<IQueryResponse>
}

const useSearchStore = create<SearchState>((set, get) => ({
  searchTool: undefined,
  exploreTool: undefined,
  importTool: undefined,
  result: undefined,
  loading: false,

  setSearchTool: (id: string) => {
    if (id !== get().searchTool?.Id) {
      useAppStore.getState().setTool('search')
      set(() => ({
        exploreTool: undefined,
        searchTool: configService.getSearchServices().find(x => x.Id === id),
        importTool: undefined,
        loading: false,
        result: undefined
      }))
    }
  },

  setExploreTool: (id: string) => {
    if (id !== get().exploreTool?.Id) {
      useAppStore.getState().setTool('explore')
      set(() => ({
        searchTool: undefined,
        exploreTool: configService.getSearchServices().find(x => x.Id === id),
        importTool: undefined,
        loading: false,
        result: undefined
      }))
    }
  },

  setImportTool: (id: string) => {
    if (id !== get().importTool?.Id) {
      useAppStore.getState().setTool('import')
      set(() => ({
        exploreTool: undefined,
        searchTool: undefined,
        importTool: configService.getImportServices().find(x => x.Id === id),
        loading: false,
        result: undefined
      }))
    }
  },

  clearSelectedTool: () => {
    set(() => ({
      exploreTool: undefined,
      searchTool: undefined,
      importTool: undefined,
      loading: false,
      result: undefined
    }))
  },

  search: async (query: any) => {
    useAppStore.getState().setTool('search')

    set(() => ({
      loading: true,
      result: undefined
    }))

    try {
      const result = await queryService.QueryForm(get().searchTool!.Id, query)
      set(() => ({
        loading: false,
        result
      }))

      return result
    } catch (error) {
      set(() => ({
        loading: false
      }))
      window.alert(error)
      return { Entities: [], Links: [], Events: [] }
    }
  },
  explore: async () => {
    useAppStore.getState().setTool('explore')
    const query = useMainStore.getState().selectedEntities
    const shape = useAppStore.getState().selectedGeoFeature

    set(() => ({
      loading: true,
      exploreResult: undefined
    }))

    try {
      const result = await queryService.QueryEntities(get().exploreTool!.Id, query, shape)
      set(() => ({
        loading: false,
        result
      }))

      set(() => ({
        loading: false
      }))
      return result
    } catch (error) {
      window.alert(error)
      return { Entities: [], Links: [], Events: [] }
    }
  },
  import: (fileContents: string) => {
    useAppStore.getState().setTool('import')

    set(() => ({
      loading: true,
      result: undefined
    }))

    try {
      let result = undefined as IQueryResponse | undefined
      const transformFunction = get().importTool?.TransformFunction
      if (transformFunction) {
        result = (window as any)[transformFunction](fileContents)
      } else {
        result = JSON.parse(fileContents)
      }
      if (result?.Entities == null) {
        throw new Error('result.Entities is not Entity[]')
      }
      if (result?.Links == null) {
        throw new Error('result.Links is not Link[]')
      }

      set(() => ({
        loading: false,
        result
      }))

      return result
    } catch (error) {
      set(() => ({
        loading: false
      }))
      window.alert(error)
      return { Entities: [], Links: [], Events: [] }
    }
  }

}))

export default useSearchStore
