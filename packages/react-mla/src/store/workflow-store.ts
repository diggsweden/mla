// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { create } from 'zustand'
import { type IEntity, type ILink } from '../interfaces/data-models'
import configService from '../services/configurationService'

interface WorkflowState {
  workflow?: string
  entities: IEntity[]
  links: ILink[]
  actions: IActionState[]
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

const useWorkflowStore = create<WorkflowState>((set) => {
  const updateAction = (actionId: string, update: Partial<IActionState>) => {
    set((state) => {
      return { actions: state.actions.map(a => a.id === actionId ? { ...a, ...update } : a) }
    })
  }

  return {
    entities: [],
    links: [],
    actions: [],
    showDialog: false,
    setWorkflow: (workflowId?: string) => {
      set(() => ({
        workflow: workflowId,
        entities: [],
        links: [],
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
    setActionRunning: (actionId: string) => { updateAction(actionId, { running: true }) },
    setActionCompleted: (actionId: string) => { updateAction(actionId, { completed: true, running: false }) },
    setActionError: (actionId: string, errorMessage: string) => { updateAction(actionId, { error: errorMessage, running: false }) },
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
  }
})

export default useWorkflowStore
