// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

interface IViewConfiguration {
  Id: string
  Name: string
  ShowLinks?: boolean
  GroupNodes?: boolean
  Rules?: IRuleConfiguration[]
  Show: IBaseViewConfiguration[]
}

interface IRuleConfiguration {
  TypeId: string
  PropertyTypeId: string
  Equals: string
  Icon: string
  Color: string
}

interface IBaseViewConfiguration {
  TypeId: string
  LabelShort: string
  LabelLong?: string
  LabelChart?: string
  Show?: boolean
  Icon: string
  Color: string
  Level?: number
}

export type {
  IViewConfiguration,
  IRuleConfiguration,
  IBaseViewConfiguration
}
