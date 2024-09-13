// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type IEntityConfiguration } from './entity-configuration'
import { type IImportConfiguration, type IQueryIntegration, type ISaveIntegration } from './integration-configuration'
import { type ILinkConfiguration } from './link-configuration'
import { type IPhaseConfiguration } from './phase-configuration'
import { type IViewConfiguration } from './view-configuration'
import { type IThemeConfiguration } from './theme-configuration'
import { type IWorkflowConfiguration } from './workflow-configuration'
import { type IMapConfiguration } from './map-configuration'
import { type IMenuConfiguration } from './menu-configuration'
import { type IEventConfiguration } from './event-configuration'

interface IConfiguration {
  Version: string
  Language?: string,
  Menu?: IMenuConfiguration
  Theme?: IThemeConfiguration
  Display: IViewConfiguration[]
  Domain: {
    EntityTypes: IEntityConfiguration[]
    LinkTypes: ILinkConfiguration[]
    EventTypes: IEventConfiguration[]
  }
  Workflows?: IWorkflowConfiguration []
  Integrations?: {
    Search?: IQueryIntegration[]
    Save?: ISaveIntegration[]
    Import?: IImportConfiguration[]
  }
  MapConfiguration?: IMapConfiguration
  Open: string
  Save: string
  SaveImage: string
  TimeAnalysis?: {
    PhaseAnalysis: IPhaseConfiguration
  }
  Plugins: string[]
  Icons: Record<string, string>
}

export type {
  IConfiguration
}
