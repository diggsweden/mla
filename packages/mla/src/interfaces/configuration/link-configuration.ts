// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type IChartThing, type IPropertyConfiguration, type ILinkRelationConfiguration } from './common-configuration'

interface ILinkConfiguration extends IChartThing {
  TypeId: string
  Name: string
  Description: string
  AllowedRelations: ILinkRelationConfiguration[]
  Properties: IPropertyConfiguration[]
}

export type {
  ILinkConfiguration
}
