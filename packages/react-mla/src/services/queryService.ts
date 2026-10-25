// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type IQueryIntegration } from '../interfaces/configuration'
import type { IEntity, IEvent, ILink } from '../interfaces/data-models'
import { type IGeoFeature } from '../interfaces/data-models/geo'
import useMainStore from '../store/main-store'
import { findId } from '../utils/utils'
import { mergeContext } from '../utils/context'
import configService from './configurationService'
import viewService from './viewService'
import { fixDate } from '../utils/date'
import { getPluginFunction } from '../utils/plugin-functions'

interface IQueryResponse {
  Entities: IEntity[]
  Links: ILink[]
  Events: IEvent[]
  ErrorMessage?: string
}

// What a search service receives, depending on how it is configured
interface QueryInput {
  // Sent to the OutTransform function, that creates the request
  transformInput: unknown
  // The json body of the request, when there is no OutTransform function
  body: unknown
  // Sent to the RequestFunction, that does the request itself
  functionInput: unknown
}

class QueryService {
  public async queryForm (serviceId: string, query: unknown): Promise<IQueryResponse> {
    return await this.query(serviceId, { transformInput: query, body: { Form: query }, functionInput: query })
  }

  public async queryEntities (serviceId: string, entities?: IEntity[], shape?: IGeoFeature): Promise<IQueryResponse> {
    const input = { Entities: entities, Shape: shape }
    return await this.query(serviceId, { transformInput: [...(entities ?? [])], body: input, functionInput: input })
  }

  public async saveFile (data: string): Promise<boolean> {
    return await this.send(configService.getConfiguration().Save, { method: 'POST', contentType: 'application/json', body: data })
  }

  public async saveImage (data: string, imageFilename: string): Promise<boolean> {
    return await this.send(configService.getConfiguration().SaveImage, { method: 'POST', contentType: 'image/png', body: data, headers: { 'X-ImageFilename': imageFilename } })
  }

  public async openFile (): Promise<string | undefined> {
    const response = await this.request(configService.getConfiguration().Open, { method: 'GET', contentType: 'application/json' })
    return response.ok ? await response.text() : undefined
  }

  private async query (serviceId: string, input: QueryInput): Promise<IQueryResponse> {
    const config = configService.getSearchServices().find(s => s.Id === serviceId)
    if (config == null) {
      throw new Error('No service registed with Id: ' + serviceId)
    }

    const context = useMainStore.getState().context
    let response: IQueryResponse
    if (config.Url) {
      const init = config.OutTransform
        ? getPluginFunction(config.OutTransform)(input.transformInput, context) as RequestInit
        : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Context': context }, body: JSON.stringify(input.body) }

      const res = await fetch(configService.resolveUrl(config.Url), init)
      this.saveContextHeader(res)
      response = await this.handleResponse(config, res)
    } else if (config.RequestFunction) {
      response = await getPluginFunction(config.RequestFunction)(input.functionInput, context) as IQueryResponse
    } else {
      throw new Error('No way to create request for service registed with Id: ' + serviceId)
    }

    return this.mapResponse(response)
  }

  private async request (url: string, options: { method: string, contentType: string, body?: string, headers?: Record<string, string> }): Promise<Response> {
    const response = await fetch(configService.resolveUrl(url), {
      method: options.method,
      headers: { 'Content-Type': options.contentType, 'X-Context': useMainStore.getState().context, ...options.headers },
      body: options.body
    })
    this.saveContextHeader(response)

    return response
  }

  private async send (url: string, options: { method: string, contentType: string, body: string, headers?: Record<string, string> }): Promise<boolean> {
    try {
      return (await this.request(url, options)).ok
    } catch (error) {
      console.error(error)
      return false
    }
  }

  private saveContextHeader (res: Response) {
    const ctx = res.headers.get('X-Context')
    if (ctx && ctx.length > 0) {
      const main = useMainStore.getState()
      main.setContext(mergeContext(main.context, ctx))
    }
  }

  private async handleResponse (config: IQueryIntegration, res: Response): Promise<IQueryResponse> {
    if (!res.ok) {
      console.error(res.statusText)
      return {
        Entities: [],
        Links: [],
        Events: [],
        ErrorMessage: `${res.status} ${res.statusText}`
      }
    }

    let json = await res.json() as IQueryResponse
    if (config.InTransform) {
      json = getPluginFunction(config.InTransform)(json) as IQueryResponse
    }

    if (json?.ErrorMessage) {
      console.error(json.ErrorMessage)
    }

    return json
  }

  // Services can leave out entities, links and events, but what they send has to be lists
  private mapResponse (res: IQueryResponse): IQueryResponse {
    const idMap = new Map<string, string>()

    const existingEntities = Object.values(useMainStore.getState().entities).flat()
    this.list(res, 'Entities').forEach(e => {
      e.DateFrom = fixDate(e.DateFrom)
      e.DateTo = fixDate(e.DateTo)
      e.LabelShort = viewService.getShortName(e)
      e.LabelLong = viewService.getLongName(e)

      const matchRules = configService.getEntityConfiguration(e.TypeId)?.MatchRules
      if (matchRules != null) {
        const existingId = findId(e, matchRules, existingEntities)
        if (existingId != null) {
          idMap.set(e.Id, existingId)
          e.Id = existingId
        }
      }
    })

    const existingLinks = Object.values(useMainStore.getState().links).flat()
    this.list(res, 'Links').forEach(l => {
      l.DateFrom = fixDate(l.DateFrom)
      l.DateTo = fixDate(l.DateTo)
      l.LabelShort = viewService.getShortName(l)
      l.LabelLong = viewService.getLongName(l)

      l.FromEntityId = idMap.get(l.FromEntityId) ?? l.FromEntityId
      l.ToEntityId = idMap.get(l.ToEntityId) ?? l.ToEntityId

      const matchRules = configService.getLinkConfiguration(l.TypeId)?.MatchRules
      if (matchRules != null) {
        const existingId = findId(l, matchRules, existingLinks)
        if (existingId != null) {
          idMap.set(l.Id, existingId)
          l.Id = existingId
        }
      }
    })

    this.list(res, 'Events').forEach(e => {
      e.Date = fixDate(e.Date)!
    })

    return res
  }

  private list<K extends 'Entities' | 'Links' | 'Events'> (res: IQueryResponse, name: K): IQueryResponse[K] {
    if (res[name] == null) {
      res[name] = [] as IQueryResponse[K]
    } else if (!Array.isArray(res[name])) {
      throw new Error(`result.${name} has to be a list`)
    }

    return res[name]
  }
}

const queryService = new QueryService()

export default queryService
export type {
  IQueryResponse
}
