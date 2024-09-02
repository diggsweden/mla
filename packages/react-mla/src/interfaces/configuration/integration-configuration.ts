// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type IPropertyConfiguration } from './common-configuration'

interface IQueryIntegration {
  Id: string
  Name: string
  Description: string
  Parameters: IParameterConfiguration
  Url?: string
  Icon?: string
  InTransform?: string
  OutTransform?: string
  RequestFunction?: string
}

interface IParameterConfiguration {
  Form?: IFormConfiguration
  EntityConfiguration?: 'AND' | 'OR'
  EntityTypes?: IEntityTypeConfiguration[]
  GeoData?: boolean
}

interface IEntityTypeConfiguration {
  TypeId: string
  Min: number
  Max?: number
}

interface IFormConfiguration {
  Fields: IPropertyConfiguration[]
}

interface ISaveIntegration {
  Id: string
  Name: string
  Description: string
  Url: string
}

interface IImportConfiguration {
  Id: string
  Name: string
  Description: string
  Icon: string
  TransformFunction?: string
}

export type {
  IQueryIntegration,
  ISaveIntegration,
  IImportConfiguration,
  IEntityTypeConfiguration
}
