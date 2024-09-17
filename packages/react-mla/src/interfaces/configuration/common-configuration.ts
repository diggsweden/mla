// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2


type FieldType = 'String' | 'Date' | 'Number' | 'Select' | 'File' | 'Multiline' | 'Boolean'

interface IBaseThing {
  Name: string
  TypeId: string
  GlobalType?: string
  Properties: IPropertyConfiguration[]
}

interface IChartThing extends IBaseThing {
  Id: string
  Internal?: boolean
  MatchRules?: IMatchRule[]
  Attributes?: IAttribute[]
}

interface IBasePropertyConfiguration {
  GlobalType?: string
  TypeId: string
  Name: string
  Description: string
  FieldType: FieldType
}

interface IPropertyConfiguration extends IBasePropertyConfiguration {
  FieldOptions?: IPropertyValueSelect[]
  FieldValidation?: string
  Required?: boolean
}

interface IPropertyValueSelect {
  Name: string
  Value: string
}

interface ILinkRelationConfiguration {
  FromEntityTypeId: string
  ToEntityTypeId: string
}

interface IMatchRule {
  PropertyTypeId: string
  Regex?: string
}

interface IAttribute {
  PropertyTypeId: string
  Color?: string
  ShowName?: boolean
  ShowValue?: boolean
  Regex?: string
}

export type {
  IBasePropertyConfiguration,
  IPropertyConfiguration,
  IBaseThing,
  IChartThing,
  ILinkRelationConfiguration,
  FieldType,
  IMatchRule
}
