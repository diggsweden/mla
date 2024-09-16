// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

interface IProperty {
  TypeId: string
  GlobalType?: string
  Value?: string | boolean | number
}

export type {
  IProperty
}
