// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

interface IThemeConfiguration {
  Primary: string
  Secondary: string
  Icon: string
  IconBorder?: boolean,
  CustomIconColorPicklist?: IColor[]
  CustomContourColorPicklist?: IColor[]
}

interface IColor {
  Name: string
  Color: string
}

export type {
  IColor
}

export type {
  IThemeConfiguration
}
