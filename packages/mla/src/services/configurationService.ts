// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { freeze } from 'immer'
import type { IEventConfiguration, IConfiguration, IEntityConfiguration, IImportConfiguration, ILinkConfiguration, IQueryIntegration, IPropertyConfiguration, IWorkflowConfiguration } from '../interfaces/configuration'
import type { IBase, IProperty } from '../interfaces/data-models'
import { loadScript } from '../utils/script-loader'

export interface PropertyAndConfiguration {
  property?: IProperty
  propertyConfiguration: IPropertyConfiguration
}

class ConfigurationService {
  private configuration = undefined as IConfiguration | undefined
  private entitiesConfiguration = {} as Record<string, IEntityConfiguration>
  private linksConfiguration = {} as Record<string, ILinkConfiguration>
  private eventsConfiguration = {} as Record<string, IEventConfiguration>

  private plugins = {} as any
  private publicUrl = ''

  public async init_src (configUrl: string, context?: string, publicUrl?: string) {
    this.publicUrl = publicUrl ?? ''

    try {
      const serviceJsonResponse = await fetch(this.getUrl(configUrl))
      const configurationJson = await serviceJsonResponse.text()
      await this.init(configurationJson, context, publicUrl)
    } catch (error) {
      console.error(error)
      window.alert('Misslyckades med att ladda ' + configUrl)
    }
  }

  public async init (configurationJson: string, context?: string, publicUrl?: string) {
    const configuration = JSON.parse(configurationJson) as IConfiguration

    this.publicUrl = publicUrl ?? ''

    try {
      const config = configuration

      this.entitiesConfiguration = freeze(config.Domain.EntityTypes.reduce(function (map, obj) {
        map[obj.TypeId] = obj
        return map
      }, {} as Record<string, IEntityConfiguration>))

      this.linksConfiguration = freeze(config.Domain.LinkTypes.reduce(function (map, obj) {
        map[obj.TypeId] = obj
        return map
      }, {} as Record<string, ILinkConfiguration>))

      if (config.Domain.EventTypes) {
        this.eventsConfiguration = freeze(config.Domain.EventTypes.reduce(function (map, obj) {
          map[obj.TypeId] = obj
          obj.Generate.forEach(gen => {
            map[gen.TypeId] = { ...obj, Properties: gen.Properties }
          })
          return map
        }, {} as Record<string, IEventConfiguration>))
      }

      if (config.Save == null) {
        config.Save = 'file'
      }

      if (config.SaveImage == null) {
        config.SaveImage = 'file'
      }

      if (config.Open == null) {
        config.Open = 'file'
      }

      if (config.Plugins) {
        for (const importer of config.Plugins) {
          if (this.plugins[importer]) {
            continue
          }
          const result = await loadScript(this.getUrl(importer))
          if (!result.status) {
            throw new Error(result.error ?? 'Fel vid läsning av ' + importer)
          }
          this.plugins[importer] = true
        }
      }

      this.configuration = freeze(config)
    } catch (error) {
      console.error(error)
      window.alert('Misslyckades med att läsa konfiguration')
    }
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

  public getEntityConfiguration (TypeId: string): IEntityConfiguration {
    return this.entitiesConfiguration[TypeId]
  }

  public getLinkConfiguration (TypeId: string): ILinkConfiguration {
    return this.linksConfiguration[TypeId]
  }

  public getEventConfiguration (TypeId: string): IEventConfiguration {
    return this.eventsConfiguration[TypeId]
  }

  public getThingConfiguration (TypeId: string) {
    const config = (this.getEntityConfiguration(TypeId) ?? this.getLinkConfiguration(TypeId) ?? this.getEventConfiguration(TypeId))
    if (config == null) {
      throw new Error(TypeId + ' is not mapped in config')
    }

    return config
  }

  public getTypeName (thing: IBase): string {
    const name = (this.getEntityConfiguration(thing.TypeId) ?? this.getLinkConfiguration(thing.TypeId) ?? this.getEventConfiguration(thing.TypeId))?.Name
    if (name == null) {
      throw new Error(thing.TypeId + ' is not mapped in config')
    }

    return name
  }

  public getProperties (thing: IBase): PropertyAndConfiguration[] {
    const props = (this.getEntityConfiguration(thing.TypeId) ?? this.getLinkConfiguration(thing.TypeId) ?? this.getEventConfiguration(thing.TypeId))?.Properties
    if (props == null) {
      throw new Error(thing.TypeId + ' is not mapped in config')
    }

    return props.map(e => {
      return {
        propertyConfiguration: e,
        property: thing.Properties.find(ee => ee.TypeId === e.TypeId)
      }
    })
  }

  public getPublicUrl () {
    return this.publicUrl
  }

  public getWorkflow (id: string): IWorkflowConfiguration {
    const workflow = this.configuration!.Workflows?.find(x => x.Id === id)
    if (workflow == null) {
      throw Error(`Could not find specified workflow in configuration, ${id}`)
    }

    return workflow
  }

  private getUrl (url: string): string {
    if (url.startsWith('/')) {
      url = this.publicUrl + url
    }

    return url
  }
}

const configService = freeze(new ConfigurationService())

export default configService
