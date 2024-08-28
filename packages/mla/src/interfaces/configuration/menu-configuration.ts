// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

interface IMenuConfiguration {
  Start?: IStartMenuConfiguration
  Archive?: IArchiveMenuConfiguration
  Search?: ISearchMenuConfiguration
}

interface IStartMenuConfiguration {
  Create?: boolean
  Undo?: boolean
  Tools?: boolean
  ViewAll?: boolean
}

interface IArchiveMenuConfiguration {
  Show?: boolean
  Import?: boolean
}
interface ISearchMenuConfiguration {
  Show?: boolean
}

export type {
  IMenuConfiguration,
  IStartMenuConfiguration,
  IArchiveMenuConfiguration,
  ISearchMenuConfiguration
}
