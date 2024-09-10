// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { freeze } from 'immer'
import { type IThemeConfiguration } from '../interfaces/configuration/theme-configuration'
import type { IBaseViewConfiguration, IRuleConfiguration, IViewConfiguration } from '../interfaces/configuration/view-configuration'
import type { IBase, IChartBase, IEntity } from '../interfaces/data-models'
import useAppStore from '../store/app-store'
import configService, { type PropertyAndConfiguration } from './configurationService'
import iconService from './iconService'
import { toDateAndTimeString } from '../utils/date'
import { DateTime } from 'luxon'

import * as global from '../global.json'

export interface IIcon {
  id: string
  selected: string
  unselected: string
}

export type LabelType = 'short' | 'long' | 'chart'

class ViewService {
  private configurations = [] as IViewConfiguration[]
  private defaultViewConfiguration = {} as Record<string, IBaseViewConfiguration>

  private theme = defaultTheme

  public init (): void {
    const config = configService.getConfiguration()
    this.configurations = config.Display
    this.theme = { ...this.theme, ...config.Theme }

    const r = document.querySelector(':root') as HTMLElement | null
    if (r == null) {
      throw new Error('Could not find document root')
    }
    // Update CSS variables
    r.style.setProperty('--color-mla-primary', this.theme.Primary)
    r.style.setProperty('--color-mla-secondary', this.theme.Secondary)
    r.style.setProperty('--color-mla-icon', this.theme.Icon)

    // Create configurations
    const defaultConfig = this.configurations.find(c => c.Id === 'default')
    if (defaultConfig == null) {
      throw new Error('Saknar vykonfiguration med id default')
    }

    defaultConfig.Show.forEach(obj => {
      if (obj.Icon == null) {
        obj.Icon = 'default'
      }

      if (obj.Color == null) {
        obj.Color = this.theme.Icon
      }
    })

    this.defaultViewConfiguration = freeze(defaultConfig.Show.reduce<any>(function (map, obj) {
      map[obj.TypeId] = obj
      return map
    }, {}))

    useAppStore.getState().setView('default')
  }

  public getRule (entity: IChartBase, viewConfiguration: IViewConfiguration): IRuleConfiguration | undefined {
    const entityRules = viewConfiguration.Rules?.filter(e => e.TypeId === entity.TypeId)
    if (entityRules == null) {
      return
    }
    const propertyRules = entityRules.flatMap(x => x.PropertyTypeId.split('|').map(s => {
      return {
        ...x,
        PropertyTypeId: s
      }
    })) satisfies IRuleConfiguration[]

    return propertyRules.find(x => this.getPropertyValue(entity, x.PropertyTypeId) === x.Equals)
  }

  public async getIconByRule (entity: IEntity, viewConfiguration: IViewConfiguration): Promise<IIcon | undefined> {
    const view = viewService.getView(entity.TypeId, entity.GlobalType)
    const configurationRule = this.getRule(entity, viewConfiguration)
    const icon = configurationRule?.Icon ?? view.Icon
    const shadeColor = entity.Color ?? configurationRule?.Color ?? view.Color
    return icon === undefined
      ? undefined
      : {
        id: `${icon}${shadeColor}${entity.MarkIcon}${entity.MarkColor}`,
        selected: await iconService.getPNG(icon, shadeColor, entity.MarkIcon, entity.MarkColor, true),
        unselected: await iconService.getPNG(icon, shadeColor, entity.MarkIcon, entity.MarkColor)
      }
  }

  public getConfiguration (): IViewConfiguration[] {
    return this.configurations
  }

  public getTheme (): IThemeConfiguration {
    return this.theme
  }

  public getDefaultView (TypeId: string, GlobalType?: string): IBaseViewConfiguration {
    let defaultView = (
      this.defaultViewConfiguration[TypeId] ??
      global.Entities.find(x => x.GlobalType == GlobalType) ?? 
      global.Links.find(x => x.GlobalType == GlobalType)
     ) as IBaseViewConfiguration


    if (defaultView == null) {
      throw new Error(TypeId + ' - ' + GlobalType + ' view is not mapped')
    }

    return defaultView
  }

  public getView (TypeId: string, GlobalType? :string): IBaseViewConfiguration {
    const selectedView = useAppStore.getState().thingViewConfiguration[TypeId]

    return { ...this.getDefaultView(TypeId, GlobalType), ...selectedView }
  }

  public getLongName (thing: IChartBase): string {
    return this.getLabel(thing, 'long')
  }

  public getShortName (thing: IChartBase): string {
    return this.getLabel(thing, 'short')
  }

  public getChartName (thing: IChartBase): string {
    return this.getLabel(thing, 'chart')
  }

  public getAttributes (thing: IChartBase): Array<{ text: string, color: string }> {
    const result = [] as Array<{ text: string, color: string }>
    const config = configService.getEntityConfiguration(thing.TypeId, thing.GlobalType) ?? configService.getLinkConfiguration(thing.TypeId, thing.GlobalType)
    if (config == null) {
      throw new Error('Configuration missing: ' + thing.TypeId + " - " + thing.GlobalType)
    }

    if (config.Attributes) {
      for (const a of config.Attributes) {
        const property = thing.Properties.find(x => x.TypeId === a.PropertyTypeId)
        const propertyConfiguration = config.Properties.find(x => x.TypeId === a.PropertyTypeId)
        if (propertyConfiguration == null) {
          throw new Error('PropertyConfiguration missing: ' + a.PropertyTypeId)
        }
        const value = this.getValue({ property, propertyConfiguration })

        if (a.Regex && value !== a.Regex) {
          continue
        }

        result.push({ text: (a.ShowName ? (propertyConfiguration.Name + ' ') : '') + (a.ShowValue !== false ? value : ''), color: a.Color ?? 'black' })
      }
    }

    return result
  }

  private getLabel (thing: IChartBase, labelType: LabelType) {
    const props = this.getView(thing.TypeId, thing.GlobalType)
    const config = configService.getProperties(thing)

    if (props == null || config == null) {
      throw new Error('View for ' + thing.TypeId + ' view is not mapped')
    }

    function getTemplate () {
      switch (labelType) {
        case 'short': return props.LabelShort
        case 'long': return props.LabelLong ?? props.LabelShort
        case 'chart': return props.LabelChart ?? props.LabelShort
      }
    }

    const template = getTemplate();

    let temp = ''
    let result = ''
    let extractingPropertyTypeId = false
    let propertyTypeId = ''
    for (let i = 0; i < template.length; i++) {
      if (template[i] === '{') {
        propertyTypeId = ''
        extractingPropertyTypeId = true
      } else if (template[i] === '}') {
        extractingPropertyTypeId = false

        let value: string | undefined
        let propertyAndConfiguration: PropertyAndConfiguration | undefined
        switch (propertyTypeId) {
          case 'DateFrom':
            value = toDateAndTimeString(thing.DateFrom) ?? ''
            break
          case 'DateTo':
            value = toDateAndTimeString(thing.DateTo) ?? ''
            break
          default:
            propertyAndConfiguration = config.find(e => 
              e.propertyConfiguration.TypeId === propertyTypeId || e.propertyConfiguration.GlobalType === propertyTypeId
            )
            if (propertyAndConfiguration) {
              value = this.getValue(propertyAndConfiguration) ?? ''
            }
            break
        }

        if (value) {
          if (result === '') {
            result += value
          } else {
            result += temp + value
          }
        }
        temp = ''
      } else if (extractingPropertyTypeId) {
        propertyTypeId += template[i]
      } else {
        temp += template[i]
      }
    }

    result += temp

    if (result === '') {
      result = configService.getTypeName(thing)
    }

    return result
  }

  public getPropertyValue (thing: IBase, propTypeId: string): string | undefined {
    const config = configService.getProperties(thing)
    const propertyConfig = config.find(x => x.propertyConfiguration?.TypeId === propTypeId)
    if (propertyConfig == null) {
      throw new Error(`No configuration for ${thing.TypeId} : ${propTypeId}`)
    }

    const value = this.getValue(propertyConfig)
    return value?.toString()
  }

  private getValue (conf: PropertyAndConfiguration): string | undefined {
    if (conf?.propertyConfiguration.FieldType === 'Select') {
      return conf.propertyConfiguration.FieldOptions?.find(opt => opt.Value === (conf.property?.Value ?? '0'))?.Name ?? ''
    }

    if (conf?.propertyConfiguration.FieldType === 'Date') {
      return conf.property?.Value ? toDateAndTimeString(DateTime.fromISO(conf.property?.Value?.toString())) : ''
    }

    if (conf?.propertyConfiguration.FieldType === 'Boolean') {
      return conf.property?.Value === true || conf.property?.Value === 'true' ? 'Ja' : 'Nej'
    }

    return conf.property?.Value?.toString()
  }
}

const defaultTheme = {
  Primary: '#64748b',
  Secondary: '#94a3b8',
  Icon: '#64748b'
} satisfies IThemeConfiguration

const viewService = freeze(new ViewService())

export default viewService
