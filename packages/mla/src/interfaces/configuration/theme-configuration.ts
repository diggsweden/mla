// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

interface IThemeConfiguration {
  Primary: string
  Secondary: string
  Icon: string
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
