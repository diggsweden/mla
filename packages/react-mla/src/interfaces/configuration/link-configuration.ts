// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type IChartThing, type ILinkRelationConfiguration, type IPropertyConfiguration } from './common-configuration'

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
