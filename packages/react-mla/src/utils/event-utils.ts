// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { produce } from 'immer'
import type { IEventFilter, IEventTarget } from '../interfaces/configuration/event-operations'
import type { IBase, IEntity, IEvent, IEventLink, IProperty, ITimeSpan } from '../interfaces/data-models'
import configService from '../services/configurationService'
import viewService from '../services/viewService'
import { internalAdd } from '../store/internal-actions'
import { generateUUID, getInternalId } from './utils'
import { t } from 'i18next'

const get = (ent: IBase, property: string) => {
  const p = ent.Properties.find(p => p.TypeId === property)
  if (p) {
    return p.Value
  } else {
    return undefined
  }
}

const testIsLinked = (ev: IEvent) => {
  if (ev.LinkFrom == null || ev.LinkTo == null ||
    Object.keys(ev.LinkFrom).length === 0 || Object.keys(ev.LinkTo).length === 0) {
    return false
  }

  return true
}

const filter = (ev: IEvent, filters: IEventFilter[]) => {
  for (const f of filters) {
    const val = viewService.getPropertyValue(ev, f.PropertyTypeId)
    if (val == null) {
      return false
    }

    if (!val.toLocaleLowerCase().includes(f.Filter.toLocaleLowerCase())) {
      return false
    }
  }

  return true
}

export function filterEvents (filters: IEventFilter[], ...events: IEvent[]): IEvent[] {
  if (filters == null) {
    return events
  }

  return events.filter(ev => filter(ev, filters))
}

export function computeLinks (events: IEvent[], date: ITimeSpan | undefined): IEventLink[] {
  const res = [] as IEventLink[]

  const groups: Record<string, { Events: IEvent[], TypeId: string }> = {}
  let filteredEvents = events.filter(e => testIsLinked(e))
  if (date) {
    filteredEvents = filteredEvents.filter(e => date.DateFrom <= e.Date && date.DateTo >= e.Date)
  }

  for (const event of filteredEvents) {
    for (const k of Object.keys(event.LinkFrom)) {
      const ev = {
        TypeId: k,
        FromEntityId: event.LinkFrom[k].Id,
        FromEntityTypeId: event.LinkFrom[k].TypeId,
        ToEntityId: event.LinkTo[k].Id,
        ToEntityTypeId: event.LinkTo[k].TypeId
      }
      const key = [ev.TypeId, ev.FromEntityId, ev.FromEntityTypeId, ev.ToEntityId, ev.ToEntityTypeId].join('-')
      if (groups[key] == null) {
        groups[key] = { TypeId: k, Events: [] }
      }

      groups[key].Events.push(event)
    }
  }

  for (const key of Object.keys(groups)) {
    const gr = groups[key]
    const config = configService.getEventConfiguration(gr.Events[0].TypeId)

    if (config == null){
      continue;
    }

    const props = [] as IProperty[]
    const group = gr.Events
    const generate = config.Generate.find(c => c.TypeId === gr.TypeId)!
    for (const propConfig of generate.Properties) {
      let val = undefined as undefined | string | number

      switch (propConfig.Action) {
        case 'sum': {
          val = group.filter(e => get(e, propConfig.TargetPropertyTypeId) != null).reduce((prev, current) => {
            return prev + (get(current, propConfig.TargetPropertyTypeId) as number)
          }, 0)
          break
        }
        case 'average': {
          let count = 0
          val = group.filter(e => get(e, propConfig.TargetPropertyTypeId) != null).reduce((prev, current) => {
            count++
            return prev + (get(current, propConfig.TargetPropertyTypeId) as number)
          }, 0)
          val = val / count
          break
        }
        case 'join': {
          val = group.filter(e => get(e, propConfig.TargetPropertyTypeId) != null).reduce((prev, current) => {
            const text = get(current, propConfig.TargetPropertyTypeId)?.toString() ?? ''
            if (prev === '' || prev.includes(text)) {
              return text
            }
            return prev + ', ' + text
          }, '')
          break
        }
        case 'count': {
          val = group.length
          break
        }
      }

      props.push({
        TypeId: propConfig.TypeId,
        Value: val
      })
    }

    const link: IEventLink = {
      Id: key + generate.TypeId,
      TypeId: generate.TypeId,
      InternalId: getInternalId(),
      EventTypeId: config.TypeId,
      Events: group,
      LabelLong: '',
      LabelShort: '',
      LabelChart: '',
      SourceSystemId: t('calculated from events'),
      FromEntityId: group[0].LinkFrom[generate.TypeId].Id,
      ToEntityId: group[0].LinkTo[generate.TypeId].Id,
      FromEntityTypeId: group[0].LinkFrom[generate.TypeId].TypeId,
      ToEntityTypeId: group[0].LinkTo[generate.TypeId].TypeId,
      Properties: props,
      Direction: 'TO'
    }
    link.LabelLong = viewService.getLongName(link)
    link.LabelShort = viewService.getShortName(link)
    link.LabelChart = viewService.getChartName(link)
    res.push(link)
  }

  return res
}

export function assignLinks (events: IEvent[], entities: IEntity[]): IEvent[] {
  const res = [] as IEvent[]
  const entitiesToadd = [] as IEntity[]

  for (let ev of events) {
    if (!testIsLinked(ev)) {
      const config = configService.getEventConfiguration(ev.TypeId)
      if (config == null) {
        continue
      }

      ev = produce(ev, draft => {
        draft.LinkFrom = {}
        draft.LinkTo = {}

        for (const gen of config.Generate) {
          if (draft.LinkFrom[gen.TypeId] == null) {
            for (const target of gen.LinkFrom) {
              const from = findEntity(ev, target, [...entities, ...entitiesToadd])
              if (from != null) {
                draft.LinkFrom[gen.TypeId] = from
                break
              }
            }
          }

          if (draft.LinkFrom[gen.TypeId] == null) {
            const ent = createEntity(draft, gen.LinkFrom[0])
            if (ent) {
              draft.LinkFrom[gen.TypeId] = ent
              entitiesToadd.push(ent)
            }
          }

          if (draft.LinkTo[gen.TypeId] == null) {
            for (const target of gen.LinkTo) {
              const to = findEntity(ev, target, [...entities, ...entitiesToadd])
              if (to != null) {
                draft.LinkTo[gen.TypeId] = to
                break
              }
            }
          }

          if (draft.LinkTo[gen.TypeId] == null) {
            const ent = createEntity(draft, gen.LinkTo[0])
            if (ent) {
              draft.LinkTo[gen.TypeId] = ent
              entitiesToadd.push(ent)
            }
          }
        }
      })
    }

    res.push(ev)
  }

  if (entitiesToadd.length > 0) {
    internalAdd(false, entitiesToadd, [])
  }

  return res
}

function findEntity (event: IEvent, target: IEventTarget, entities: IEntity[]): IEntity | undefined {
  for (const entity of entities) {
    if (target.TypeId === entity.TypeId) {
      if (target.EntityPropertyTypeId != null) {
        const val = get(event, target.PropertyTypeId)
        if (val != null && val === get(entity, target.EntityPropertyTypeId)) {
          return entity
        }
      } else {
        if (get(event, target.PropertyTypeId) === entity.Id) {
          return entity
        }
      }
    }
  }

  return undefined
}

function createEntity (event: IEvent, target: IEventTarget): IEntity | null {
  const ent: IEntity = {
    Id: generateUUID(),
    InternalId: getInternalId(),
    TypeId: target.TypeId,
    LabelLong: '',
    LabelShort: '',
    LabelChart: '',
    SourceSystemId: t('calculated from events'),
    Properties: []
  }

  ent.LabelLong = viewService.getLongName(ent)
  ent.LabelShort = viewService.getShortName(ent)
  ent.LabelChart = viewService.getChartName(ent)

  if (target.EntityPropertyTypeId != null) {
    const value = get(event, target.PropertyTypeId)
    if (value == null) {
      return null
    }
    ent.Properties.push({
      TypeId: target.EntityPropertyTypeId,
      Value: get(event, target.PropertyTypeId)
    })
  } else {
    ent.Id = get(event, target.PropertyTypeId)?.toString() ?? 'calculated-from-event'
  }

  return ent
}
