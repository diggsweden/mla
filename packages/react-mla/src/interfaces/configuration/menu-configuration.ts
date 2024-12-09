// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

interface IMenuConfiguration {
  Archive?: IArchiveMenuConfiguration
  Start?: IStartMenuConfiguration
  Search?: ISearchMenuConfiguration
  Analysis?: IAnalysisMenuConfiguration
  Draw?: IDrawMenuConfiguration
}

interface IArchiveMenuConfiguration {
  Show?: boolean
  Import?: boolean
}

interface IStartMenuConfiguration {
  Create?: boolean
  Undo?: boolean
  Tools?: boolean
  ViewAll?: boolean
}

interface ISearchMenuConfiguration {
  Show?: boolean
}

interface IAnalysisMenuConfiguration {
  SnaPreview?: boolean
  CommunityPreview?: boolean
}

interface IDrawMenuConfiguration {
  Show?: boolean
}

export type {
  IMenuConfiguration,
  IStartMenuConfiguration,
  IArchiveMenuConfiguration,
  ISearchMenuConfiguration
}
