// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

/* eslint-disable @typescript-eslint/no-unused-vars */

import { create } from 'zustand'
import { type IEntity, type ILink } from '../interfaces/data-models'
import configService from '../services/configurationService'

interface WorkflowState {
  workflow?: string
  entities: IEntity[]
  links: ILink[]
  actions: IActionState[]
  running: boolean
  showDialog: boolean

  setWorkflow: (workflowId?: string) => void
  setActionRunning: (actionId: string) => void
  setActionCompleted: (actionId: string) => void
  setActionError: (actionId: string, errorMessage: string) => void
  addLinks: (links: ILink[]) => void
  addEntities: (entities: IEntity[]) => void
  setShowDialog: (show: boolean) => void
}

export interface IActionState {
  id: string
  running: boolean
  error?: string
  completed: boolean
}

const useWorkflowStore = create<WorkflowState>((set, get) => ({
  entities: [],
  links: [],
  actions: [],
  running: false,
  showDialog: false,
  setWorkflow: (workflowId?: string) => {
    set((state) => ({
      workflow: workflowId,
      entities: [],
      links: [],
      running: true,
      showDialog: false,
      actions: workflowId
        ? configService.getWorkflow(workflowId).Actions.map((a) => ({
          id: a.Id,
          running: false,
          completed: false
        } satisfies IActionState))
        : []
    }))
  },
  setActionRunning: (actionId: string) => {
    const actionIndex = get().actions.findIndex(x => x.id === actionId)
    const update = { ...get().actions[actionIndex], running: true }
    set((state) => ({
      actions: [
        ...state.actions.slice(0, actionIndex),
        update,
        ...state.actions.slice(actionIndex + 1)]
    }))
  },
  setActionCompleted: (actionId: string) => {
    const actionIndex = get().actions.findIndex(x => x.id === actionId)
    const update = { ...get().actions[actionIndex], completed: true, running: false }
    set((state) => ({
      running: state.actions.some(x => !x.completed),
      actions: [
        ...state.actions.slice(0, actionIndex),
        update,
        ...state.actions.slice(actionIndex + 1)]
    }))
  },
  setActionError: (actionId: string, errorMessage: string) => {
    const actionIndex = get().actions.findIndex(x => x.id === actionId)
    const update = { ...get().actions[actionIndex], error: errorMessage, running: false }
    set((state) => ({
      actions: [
        ...state.actions.slice(0, actionIndex),
        update,
        ...state.actions.slice(actionIndex + 1)]
    }))
  },
  setShowDialog: (show: boolean) => {
    set((state) => ({
      showDialog: show && state.workflow != null
    }))
  },
  addLinks: (links: ILink[]) => {
    set((state) => ({
      links: [...links, ...state.links]
    }))
  },
  addEntities: (entities: IEntity[]) => {
    set((state) => ({
      entities: [...entities, ...state.entities]
    }))
  }

}))

export default useWorkflowStore
