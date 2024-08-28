// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

interface IWorkflowConfiguration {
  Id: string
  Name: string
  ShowProgress: boolean | number | undefined
  Actions: IAction[]
}

export interface IAction {
  Id: string
  Description: string
  Name: string
  ActionType: 'RunQuery' | 'Add' | 'ChangeLayout' | 'CloseDialog' | 'Delay'
  ActionParameters: IQueryAction | IQueryAdd | IChangeLayout | IDelay
  Icon: string | undefined
}

interface IQueryAction {
  QueryId: string
  InputType?: 'Chart' | 'Selection' | 'Workflow'
}

interface IQueryAdd {
  Filters: string[]
}

interface IChangeLayout {
  LayoutId: string
}

interface IDelay {
  ms: number
}

export type {
  IWorkflowConfiguration,
  IQueryAction,
  IChangeLayout,
  IDelay
}
