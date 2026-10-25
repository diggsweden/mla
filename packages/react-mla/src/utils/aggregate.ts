// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { EventPropertyAction } from '../interfaces/configuration/event-operations'

// Combines the values of the events of a link into one value
export function aggregate (action: EventPropertyAction, values: Array<string | number | boolean>, eventCount: number): string | number | undefined {
  switch (action) {
    case 'sum':
      return values.reduce<number>((sum, value) => sum + (value as number), 0)
    case 'average':
      return values.length === 0 ? undefined : values.reduce<number>((sum, value) => sum + (value as number), 0) / values.length
    case 'join': {
      // Every distinct text once, in the order they come
      const texts = [] as string[]
      values.forEach(value => {
        const text = value.toString()
        if (!texts.includes(text)) {
          texts.push(text)
        }
      })
      return texts.join(', ')
    }
    case 'count':
      return eventCount
  }

  return undefined
}
