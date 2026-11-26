// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { beforeAll, describe, expect, test } from 'vitest'
import workflowService from './workflowService'
import useWorkflowStore from '../store/workflow-store'
import { initServices } from '../test-utils/setup'
import { delay } from '../utils/utils'

beforeAll(async () => {
  await initServices(config => {
    config.Workflows = [{
      Id: 'quick',
      Name: 'Quick',
      // The progress is shown if the workflow takes longer than this
      ShowProgress: 100,
      Actions: [
        { Id: 'wait', Name: 'Wait', Description: '', ActionType: 'Delay', ActionParameters: { ms: 10 } },
        { Id: 'close', Name: 'Close', Description: '', ActionType: 'CloseDialog', ActionParameters: {} }
      ]
    }]
  })
})

describe('the progress dialog of a workflow', () => {
  test('is not shown when the workflow is done before the delay', async () => {
    await workflowService.execute('quick')
    expect(useWorkflowStore.getState().showDialog).toBe(false)

    await delay(200)
    expect(useWorkflowStore.getState().showDialog).toBe(false)
  })
})
