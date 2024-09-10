// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

interface IProperty {
  TypeId: string
  GlobalType?: string
  Value?: string | boolean | number
}

export type {
  IProperty
}
