// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { IQueryResponse } from '../../services/queryService'
import type { IEvent } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import { generateUUID } from '../../utils/utils'

export interface EventGroup {
  GroupId: string
  TypeId: string
  Name: string
  Events: IEvent[]
}

// The events of a result, by type and sorted by date. A type with very many events is split into groups of at most 10000
export function buildEventGroups (result: IQueryResponse): EventGroup[] {
  const res = [] as EventGroup[]
  if (result.Events) {
    result.Events.sort((a, b) => a.Date.diff(b.Date).milliseconds)

    const grouped = result.Events.reduce<Record<string, IEvent[]>>(
      (result, currentValue) => {
        (result[currentValue.TypeId] = result[currentValue.TypeId] || []).push(currentValue)
        if (result[currentValue.TypeId].length >= 10000) {
          result[generateUUID()] = result[currentValue.TypeId]
          result[currentValue.TypeId] = []
        }
        return result
      }, {})

    // A type with a multiple of 10000 events is left with an empty list when the last group is split off
    Object.keys(grouped).filter(t => grouped[t].length > 0).forEach(t => {
      const typeId = grouped[t][0].TypeId
      const config = configService.getEventConfiguration(typeId)
      res.push({
        GroupId: t,
        TypeId: typeId,
        Name: config?.Name ?? typeId,
        Events: grouped[t]
      })
    })
  }

  res.sort((a, b) => a.Events[0].Date.diff(b.Events[0].Date).milliseconds)
  return res
}
