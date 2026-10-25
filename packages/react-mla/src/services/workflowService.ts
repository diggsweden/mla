// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type IChangeLayout, type IDelay, type IQueryAction, type IWorkflowConfiguration } from '../interfaces/configuration/workflow-configuration'
import useAppStore from '../store/app-store'
import configService from './configurationService'
import queryService from './queryService'
import useWorkflowStore from '../store/workflow-store'
import { delay } from '../utils/utils'
import { internalAdd } from '../store/internal-actions'

class WorkflowService {
  private progressHandle?: number

  public async execute (id: string): Promise<void> {
    const workflowStore = useWorkflowStore.getState()
    const workflow = configService.getWorkflow(id)
    workflowStore.setWorkflow(id)
    this.updateDialog(workflow)
    for (const action of workflow.Actions) {
      workflowStore.setActionRunning(action.Id)
      try {
        switch (action.ActionType) {
          case 'RunQuery':
            await this.runQuery(action.ActionParameters as IQueryAction)
            break
          case 'Add':
            await this.add()
            break
          case 'ChangeLayout':
            this.changeLayout(action.ActionParameters as IChangeLayout)
            break
          case 'Delay':
            await delay((action.ActionParameters as IDelay).ms)
            break
          case 'CloseDialog':
            this.close()
            break
        }
      } catch (e) {
        workflowStore.setActionError(action.Id, e instanceof Error ? e.message : String(e))
        return
      } finally {
        workflowStore.setActionCompleted(action.Id)
      }
    }
  }

  private updateDialog (config: IWorkflowConfiguration): void {
    if (this.progressHandle) {
      window.clearTimeout(this.progressHandle)
    }
    const showProgress = config.ShowProgress ?? true
    if (showProgress === true || showProgress === 0) {
      useWorkflowStore.getState().setShowDialog(true)
    } else if (showProgress !== false && showProgress > 0) {
      this.progressHandle = window.setTimeout(() => { useWorkflowStore.getState().setShowDialog(true) }, showProgress)
    }
  }

  private async runQuery (queryParameter: IQueryAction): Promise<void> {
    const result = await queryService.queryEntities(queryParameter.QueryId, [])

    if (result.Entities) {
      useWorkflowStore.getState().addEntities(result.Entities)
    }

    if (result.Links) {
      useWorkflowStore.getState().addLinks(result.Links)
    }
  }

  private async add (): Promise<void> {
    internalAdd(false, useWorkflowStore.getState().entities, useWorkflowStore.getState().links)
    await delay(100)
  }

  private changeLayout (queryParameter: IChangeLayout): void {
    useAppStore.getState().setLayout(queryParameter.LayoutId)
  }

  private close (): void {
    useWorkflowStore.getState().setShowDialog(false)
  }
}

const workflowService = new WorkflowService()

export default workflowService
