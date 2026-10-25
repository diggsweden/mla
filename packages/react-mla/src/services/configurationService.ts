// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { freeze } from 'immer'
import type { IBaseThing, IConfiguration, IEntityConfiguration, IEventConfiguration, IImportConfiguration, ILinkConfiguration, IPropertyConfiguration, IQueryIntegration, IWorkflowConfiguration } from '../interfaces/configuration'
import type { IBase, IProperty } from '../interfaces/data-models'
import { loadScript } from '../utils/script-loader'

import * as global from '../global.json'
import { isSameType } from '../utils/utils'
import i18n from 'i18next'

export interface PropertyAndConfiguration {
  property?: IProperty
  propertyConfiguration: IPropertyConfiguration
}

// The types can be found by their TypeId and by their GlobalType
function indexByType<T extends { TypeId: string, GlobalType?: string }> (types: T[]): Record<string, T> {
  const index: Record<string, T> = {}
  for (const type of types) {
    index[type.TypeId] = type
    if (type.GlobalType) {
      index[type.GlobalType] = type
    }
  }

  return freeze(index)
}

class ConfigurationService {
  private configuration = undefined as IConfiguration | undefined
  private entitiesConfiguration = {} as Record<string, IEntityConfiguration>
  private linksConfiguration = {} as Record<string, ILinkConfiguration>
  private eventsConfiguration = {} as Record<string, IEventConfiguration>

  private plugins = {} as Record<string, boolean>
  private publicUrl = ''

  public async initFromUrl (configUrl: string, publicUrl?: string) {
    this.publicUrl = publicUrl ?? ''

    const response = await fetch(this.resolveUrl(configUrl))
    if (!response.ok) {
      throw new Error(`Could not load the configuration ${configUrl}: ${response.status} ${response.statusText}`)
    }

    await this.init(await response.text(), publicUrl)
  }

  public async init (configurationJson: string, publicUrl?: string) {
    const config = JSON.parse(configurationJson) as IConfiguration

    this.publicUrl = publicUrl ?? ''
    void i18n.changeLanguage(config.Language ?? 'en')

    this.entitiesConfiguration = indexByType(config.Domain.EntityTypes)
    this.linksConfiguration = indexByType(config.Domain.LinkTypes)

    if (config.Domain.EventTypes) {
      const events: Record<string, IEventConfiguration> = {}
      for (const type of config.Domain.EventTypes) {
        events[type.TypeId] = type
        type.Generate.forEach(gen => {
          events[gen.TypeId] = { ...type, Properties: gen.Properties }
        })
      }
      this.eventsConfiguration = freeze(events)
    }

    config.Save ??= 'file'
    config.SaveImage ??= 'file'
    config.Open ??= 'file'

    for (const plugin of config.Plugins ?? []) {
      if (!this.plugins[plugin]) {
        await loadScript(this.resolveUrl(plugin))
        this.plugins[plugin] = true
      }
    }

    this.configuration = freeze(config)
  }

  public isConfigured () {
    return this.configuration != null
  }

  public getConfiguration (): IConfiguration {
    if (this.configuration == null) {
      throw new Error('Configuration not loaded...')
    }

    return this.configuration
  }

  public getSearchServices (): IQueryIntegration[] {
    return this.configuration?.Integrations?.Search ?? []
  }

  public getImportServices (): IImportConfiguration[] {
    return this.configuration?.Integrations?.Import ?? []
  }

  public getEntityConfiguration (TypeId: string, GlobalType?: string): IEntityConfiguration | undefined {
    return this.entitiesConfiguration[TypeId] ?? this.entitiesConfiguration[GlobalType ?? ''] ?? global.Entities.find(x => x.GlobalType === GlobalType)
  }

  public getLinkConfiguration (TypeId: string, GlobalType?: string): ILinkConfiguration | undefined {
    return this.linksConfiguration[TypeId] ?? this.linksConfiguration[GlobalType ?? ''] ?? global.Links.find(x => x.GlobalType === GlobalType)
  }

  public getEventConfiguration (TypeId: string): IEventConfiguration | undefined {
    return this.eventsConfiguration[TypeId]
  }

  public getThingConfiguration (TypeId: string, GlobalType?: string): IBaseThing {
    const config = (
      this.getEntityConfiguration(TypeId, GlobalType) ??
      this.getLinkConfiguration(TypeId, GlobalType) ??
      this.getEventConfiguration(TypeId)
    )
    if (config == null) {
      throw new Error(TypeId + ' is not mapped in config')
    }

    return config
  }

  public getTypeName (thing: IBase): string {
    const config = this.getThingConfiguration(thing.TypeId, thing.GlobalType)
    return config.Name ?? config.GlobalType ?? config.TypeId
  }

  public getProperties (thing: IBase): PropertyAndConfiguration[] {
    return this.getThingConfiguration(thing.TypeId, thing.GlobalType).Properties.map(e => {
      return {
        propertyConfiguration: e,
        property: thing.Properties.find(ee => isSameType(ee, e))
      }
    })
  }

  public getWorkflow (id: string): IWorkflowConfiguration {
    const workflow = this.getConfiguration().Workflows?.find(x => x.Id === id)
    if (workflow == null) {
      throw Error(`Could not find specified workflow in configuration, ${id}`)
    }

    return workflow
  }

  // Urls that start with a slash are relative to the public url of the host page
  public resolveUrl (url: string): string {
    return url.startsWith('/') ? this.publicUrl + url : url
  }
}

const configService = new ConfigurationService()

export default configService
