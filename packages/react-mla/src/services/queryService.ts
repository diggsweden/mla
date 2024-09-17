// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { freeze } from 'immer'
import { type IQueryIntegration } from '../interfaces/configuration'
import type { IEntity, IEvent, ILink } from '../interfaces/data-models'
import { type IGeoFeature } from '../interfaces/data-models/geo'
import useMainStore from '../store/main-store'
import { findId, mergeContext } from '../utils/utils'
import configService from './configurationService'
import viewService from './viewService'
import { fixDate } from '../utils/date'

interface IQueryResponse {
  Entities: IEntity[]
  Links: ILink[]
  Events: IEvent[]
  ErrorMessage?: string
}

class QueryService {
  public async QueryForm (serviceId: string, query: any): Promise<IQueryResponse> {
    const config = configService.getSearchServices().find(s => s.Id === serviceId)
    if (config == null) {
      throw new Error('No service registed with Id: ' + serviceId)
    }

    let res = undefined as IQueryResponse | undefined
    if (config.Url) {
      let req = undefined as RequestInit | undefined
      if (config.OutTransform) {
        req = (window as any)[config.OutTransform](query, useMainStore.getState().context)
      } else {
        req = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Context': useMainStore.getState().context
          },
          body: JSON.stringify({ Form: query })
        }
      }

      const response = await fetch(this.getUrl(config.Url), req)
      this.saveContextHeader(response)

      res = await this.HandleResponse(config, response)
    } else if (config.RequestFunction) {
      res = await (window as any)[config.RequestFunction](query, useMainStore.getState().context)
    } else {
      throw new Error('No way to create request for service registed with Id: ' + serviceId)
    }

    return this.MapResponse(res!)
  }

  public async QueryEntities (serviceId: string, entities?: IEntity[], shape?: IGeoFeature): Promise<IQueryResponse> {
    const config = configService.getSearchServices().find(s => s.Id === serviceId)
    if (config == null) {
      throw new Error('No service registed with Id: ' + serviceId)
    }

    let res = undefined as IQueryResponse | undefined
    if (config.Url) {
      let req = undefined as RequestInit | undefined
      if (config.OutTransform) {
        req = (window as any)[config.OutTransform]([...(entities ?? [])], useMainStore.getState().context)
      } else {
        req = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Context': useMainStore.getState().context
          },
          body: JSON.stringify({ Entities: entities, Shape: shape })
        }
      }

      const response = await fetch(this.getUrl(config.Url), req)
      this.saveContextHeader(response)

      res = await this.HandleResponse(config, response)
    } else if (config.RequestFunction) {
      res = await (window as any)[config.RequestFunction]({ Entities: entities, Shape: shape }, useMainStore.getState().context)
    } else {
      throw new Error('No way to create request for service registed with Id: ' + serviceId)
    }

    return this.MapResponse(res!)
  }

  public async SaveFile (data: string): Promise<boolean> {
    const req = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Context': useMainStore.getState().context
      },
      body: data
    }
    const saveUrl = this.getUrl(configService.getConfiguration().Save)
    try {
      const response = await fetch(saveUrl, req)
      this.saveContextHeader(response)

      return response.ok
    } catch (error) {
      console.error(error)
      return false
    }
  }

  public async SaveImage (data: string, imageFilename: string): Promise<boolean> {
    const req = {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'X-Context': useMainStore.getState().context,
        'X-ImageFilename': imageFilename
      },
      body: data
    }
    const saveUrl = this.getUrl(configService.getConfiguration().SaveImage)
    try {
      const response = await fetch(saveUrl, req)
      this.saveContextHeader(response)

      return response.ok
    } catch (error) {
      console.error(error)
      return false
    }
  }

  public async OpenFile (): Promise<string | undefined> {
    const req = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Context': useMainStore.getState().context
      }
    }
    const url = this.getUrl(configService.getConfiguration().Open)
    const response = await fetch(url, req)
    this.saveContextHeader(response)

    if (response.ok) {
      return await response.text()
    }

    return undefined
  }

  private getUrl (url: string): string {
    if (url.startsWith('/')) {
      url = configService.getPublicUrl() + url
    }

    return url
  }

  private saveContextHeader (res: Response) {
    const ctx = res.headers.get('X-Context')
    if (ctx && ctx.length > 0) {
      let update = useMainStore.getState().context
      update = mergeContext(update, ctx)
      useMainStore.getState().setContext(update)
    }
  }

  private async HandleResponse (config: IQueryIntegration, res: Response): Promise<IQueryResponse> {
    if (!res.ok) {
      console.error(res.statusText)
      return {
        Entities: [],
        Links: [],
        Events: []
      }
    }

    let json = await res.json() as IQueryResponse
    if (config.InTransform) {
      json = ((window as any)[config.InTransform] as any)(json) as IQueryResponse
    }

    if (json?.ErrorMessage) {
      console.error(json.ErrorMessage)
    }

    return json
  }

  private MapResponse (res: IQueryResponse): IQueryResponse {
    const idMap = new Map<string, string>()
    if (res?.Entities && Array.isArray(res.Entities)) {
      const entities = Object.values(useMainStore.getState().entities).flat()
      res.Entities.forEach(e => {
        e.DateFrom = fixDate(e.DateFrom)
        e.DateTo = fixDate(e.DateTo)
        e.LabelShort = viewService.getShortName(e)
        e.LabelLong = viewService.getLongName(e)

        const matchRules = configService.getEntityConfiguration(e.TypeId)?.MatchRules
        if (matchRules != null) {
          const existingId = findId(e, matchRules, entities)
          if (existingId != null) {
            idMap.set(e.Id, existingId)
            e.Id = existingId
          }
        }
      })
    } else if (res?.Entities != null) {
      throw new Error('result.Entities has to be: Entity[]')
    } else {
      res.Entities = []
    }

    if (res?.Links && Array.isArray(res?.Links)) {
      const links = Object.values(useMainStore.getState().links).flat()
      res.Links.forEach(l => {
        l.DateFrom = fixDate(l.DateFrom)
        l.DateTo = fixDate(l.DateTo)
        l.LabelShort = viewService.getShortName(l)
        l.LabelLong = viewService.getLongName(l)

        if (idMap.has(l.FromEntityId)) {
          l.FromEntityId = idMap.get(l.FromEntityId)!
        }

        if (idMap.has(l.ToEntityId)) {
          l.ToEntityId = idMap.get(l.ToEntityId)!
        }

        const matchRules = configService.getLinkConfiguration(l.TypeId)?.MatchRules
        if (matchRules != null) {
          const existingId = findId(l, matchRules, links)
          if (existingId != null) {
            idMap.set(l.Id, existingId)
            l.Id = existingId
          }
        }
      })
    } else if (res?.Links != null) {
      throw new Error('result.Links has to be: Link[]')
    } else {
      res.Links = []
    }

    if (res?.Events && Array.isArray(res?.Events)) {
      res.Events.forEach(e => {
        e.Date = fixDate(e.Date)!
      })
    } else if (res?.Events != null) {
      throw new Error('result.Events has to be: Event[]')
    } else {
      res.Events = []
    }

    return res
  }
}

const queryService = freeze(new QueryService())

export default queryService
export type {
  IQueryResponse
}
