// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type IEntityConfiguration } from '../interfaces/configuration'
import { type IEntity } from '../interfaces/data-models'
import { generateUUID } from './utils'

// A new entity of the type, made by the user, without any values yet. It is placed where it is given a position
export function newEntity (type: IEntityConfiguration, position?: { x: number, y: number }): IEntity {
  return {
    Id: generateUUID(),
    InternalId: generateUUID(),
    TypeId: type.TypeId,
    GlobalType: type.GlobalType,
    LabelLong: '',
    LabelShort: '',
    LabelChart: '',
    SourceSystemId: 'Egenskapad',
    Properties: [],
    ...(position != null ? { PosX: position.x, PosY: position.y } : {})
  }
}
