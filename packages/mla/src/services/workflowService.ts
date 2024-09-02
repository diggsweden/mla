// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type IChangeLayout, type IDelay, type IQueryAction, type IWorkflowConfiguration } from '../interfaces/configuration/workflow-configuration'
import useAppStore from '../store/app-store'
import configService from './configurationService'
import queryService from './queryService'
import useWorkflowStore from '../store/workflow-store'
import { delay } from '../utils/utils'
import { internalAdd } from '../store/internal-actions'
import { freeze } from 'immer'

class WorkflowService {
  private progress_handle?: number

  public async Execute (id: string): Promise<void> {
    const workflowStore = useWorkflowStore.getState()
    const workflow = configService.getWorkflow(id)
    workflowStore.setWorkflow(id)
    this.UpdateDialog(workflow)
    for (const action of workflow.Actions) {
      workflowStore.setActionRunning(action.Id)
      try {
        switch (action.ActionType) {
          case 'RunQuery':
            await this.RunQuery(action.ActionParameters as IQueryAction)
            break
          case 'Add':
            await this.Add()
            break
          case 'ChangeLayout':
            this.ChangeLayout(action.ActionParameters as IChangeLayout)
            break
          case 'Delay':
            await delay((action.ActionParameters as IDelay).ms)
            break
          case 'CloseDialog':
            this.Close()
            break
        }
      } catch (e: any) {
        workflowStore.setActionError(action.Id, e.message as string)
        return
      } finally {
        workflowStore.setActionCompleted(action.Id)
      }
    }
  }

  private UpdateDialog (config: IWorkflowConfiguration): void {
    if (this.progress_handle) {
      window.clearTimeout(this.progress_handle)
    }
    const showProgress = config.ShowProgress ?? true
    if (showProgress === true || showProgress === 0) {
      useWorkflowStore.getState().setShowDialog(true)
    } else if (showProgress !== false && showProgress > 0) {
      this.progress_handle = window.setTimeout(() => { useWorkflowStore.getState().setShowDialog(true) }, showProgress)
    }
  }

  private async RunQuery (queryParameter: IQueryAction): Promise<void> {
    const result = await queryService.QueryEntities(queryParameter.QueryId, [])

    if (result.Entities) {
      useWorkflowStore.getState().addEntities(result.Entities)
    }

    if (result.Links) {
      useWorkflowStore.getState().addLinks(result.Links)
    }
  }

  private async Add (): Promise<void> {
    internalAdd(false, useWorkflowStore.getState().entities, useWorkflowStore.getState().links)
    await delay(100)
  }

  private ChangeLayout (queryParameter: IChangeLayout): void {
    const layoutId = queryParameter.LayoutId
    useAppStore.getState().setLayout(layoutId)
  }

  private Close (): void {
    useWorkflowStore.getState().setShowDialog(false)
  }
}

const workflowService = freeze(new WorkflowService())

export default workflowService
