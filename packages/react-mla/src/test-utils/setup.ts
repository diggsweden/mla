// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import '../i18n'
import * as defaultConfig from '../../../../tools/test/default.json'
import configService from '../services/configurationService'
import viewService from '../services/viewService'
import iconService from '../services/iconService'
import useAppStore from '../store/app-store'
import type { IEntity } from '../interfaces/data-models'

// Loads the test configuration into the services, as the app does when it starts. Changes can be made to the configuration first
export async function initServices (change?: (config: Record<string, unknown>) => void): Promise<void> {
  const config = JSON.parse(JSON.stringify(defaultConfig)) as Record<string, unknown>
  change?.(config)
  await configService.init(JSON.stringify(config))
  viewService.init()
  // The icons, which the buttons of the entity types draw
  iconService.init()
  useAppStore.getState().setView('default')
}

export function person (id: string, properties: Record<string, string> = {}, extra: Partial<IEntity> = {}): IEntity {
  return {
    Id: id,
    TypeId: 'person',
    // Given by the store when the entity is added
    InternalId: undefined as unknown as string,
    LabelShort: '',
    LabelLong: '',
    LabelChart: '',
    SourceSystemId: 'test',
    Properties: Object.entries(properties).map(([TypeId, Value]) => ({ TypeId, Value })),
    ...extra
  }
}
