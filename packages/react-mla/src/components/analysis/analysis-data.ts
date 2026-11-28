// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { DateTime } from 'luxon'
import type { IChartBase, IEntity, ILink, IPhaseEvent } from '../../interfaces/data-models'
import type { IViewConfiguration } from '../../interfaces/configuration/view-configuration'
import configService from '../../services/configurationService'
import viewService from '../../services/viewService'
import { getId } from '../../utils/utils'

// The direction of a relation between an activity and an actor: from = the actor to the activity, to = the activity to the actor
export type RelationDirection = 'from' | 'to' | 'both' | 'none'

export interface Relation {
  actorKey: string
  role: string
  direction: RelationDirection
}

export interface Activity {
  key: string
  entity: IEntity
  // The number of the activity, the same in every view: the activities in order of time
  n: number
  date: DateTime
  color: string
  title: string
  description: string
  relations: Relation[]
}

// An activity without a date: it can not be placed in time, but who takes part in it can still be chosen
export type UndatedActivity = Omit<Activity, 'n' | 'date'>

export interface Actor {
  key: string
  entity: IEntity
  name: string
  longName: string
  typeName: string
  icon: string
  iconColor: string
}

export interface Phase {
  id: string
  name: string
  // The color the user has given the phase
  color?: string
  from: DateTime
  // The start of the next phase, when there is one
  until?: DateTime
}

export interface AnalysisSource {
  // The type of entity that is an activity, the type of link from it to the actors, and the property of that link that is the role
  activityTypeId: string
  linkTypeId?: string
  rolePropertyId?: string
}

// The color of a thing as the chart shows it: its own color, else the color of a rule, else the color of its type
export function colorOf (thing: IChartBase, viewConfiguration: IViewConfiguration): string {
  return thing.Color ?? viewService.getRule(thing, viewConfiguration)?.Color ?? viewService.getView(thing.TypeId, thing.GlobalType).Color ?? viewService.getTheme().Icon
}

function directionOf (link: ILink, activityIsFrom: boolean): RelationDirection {
  switch (link.Direction) {
    case 'TO': return activityIsFrom ? 'to' : 'from'
    case 'FROM': return activityIsFrom ? 'from' : 'to'
    case 'BOTH': return 'both'
    default: return 'none'
  }
}

function roleOf (link: ILink, rolePropertyId?: string): string {
  if (rolePropertyId) {
    const value = link.Properties.find(p => p.TypeId === rolePropertyId)?.Value
    if (value != null && value !== '') {
      return value.toString()
    }
  }

  return ''
}

function activityLinks (links: Record<string, ILink[]>, source: AnalysisSource): ILink[] {
  return Object.values(links).map(versions => versions[0]).filter(l => l != null && (source.linkTypeId == null || l.TypeId === source.linkTypeId))
}

// The relations of an activity to the entities that take part. Relations to entities that are not in the chart are left out
function relationsOf (key: string, links: ILink[], entities: Record<string, IEntity[]>, source: AnalysisSource): Relation[] {
  const relations: Relation[] = []
  for (const link of links) {
    const fromKey = link.FromEntityId + link.FromEntityTypeId
    const toKey = link.ToEntityId + link.ToEntityTypeId
    const activityIsFrom = fromKey === key
    if (!activityIsFrom && toKey !== key) {
      continue
    }

    const actorKey = activityIsFrom ? toKey : fromKey
    if (actorKey === key || entities[actorKey] == null) {
      continue
    }

    relations.push({ actorKey, role: roleOf(link, source.rolePropertyId), direction: directionOf(link, activityIsFrom) })
  }
  return relations
}

function activityEntities (entities: Record<string, IEntity[]>, source: AnalysisSource): IEntity[] {
  return Object.values(entities).map(versions => versions[0]).filter(e => e != null && e.TypeId === source.activityTypeId)
}

// The activities with a date, with their relations to the entities that take part
export function getActivities (entities: Record<string, IEntity[]>, links: Record<string, ILink[]>, source: AnalysisSource, viewConfiguration: IViewConfiguration): Activity[] {
  const allLinks = activityLinks(links, source)
  const result = activityEntities(entities, source)
    .filter(e => (e.DateFrom ?? e.DateTo) != null)
    .map(entity => {
      const key = getId(entity)
      return {
        key,
        entity,
        n: 0,
        date: (entity.DateFrom ?? entity.DateTo)!,
        color: colorOf(entity, viewConfiguration),
        title: entity.LabelLong,
        description: entity.LabelShort !== entity.LabelLong ? entity.LabelShort : '',
        relations: relationsOf(key, allLinks, entities, source)
      }
    })

  result.sort((a, b) => a.date.toMillis() - b.date.toMillis() || a.key.localeCompare(b.key))
  result.forEach((a, i) => { a.n = i + 1 })
  return result
}

// The activities without a date, such as one that has just been made in the chart
export function getUndatedActivities (entities: Record<string, IEntity[]>, links: Record<string, ILink[]>, source: AnalysisSource, viewConfiguration: IViewConfiguration): UndatedActivity[] {
  const allLinks = activityLinks(links, source)
  return activityEntities(entities, source)
    .filter(e => (e.DateFrom ?? e.DateTo) == null)
    .map(entity => {
      const key = getId(entity)
      return {
        key,
        entity,
        color: colorOf(entity, viewConfiguration),
        title: entity.LabelLong,
        description: entity.LabelShort !== entity.LabelLong ? entity.LabelShort : '',
        relations: relationsOf(key, allLinks, entities, source)
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'sv'))
}

// The links between an activity and an entity in the chart that are of another type than the chosen one, and so are not counted
export function countOtherLinks (entities: Record<string, IEntity[]>, links: Record<string, ILink[]>, source: AnalysisSource): number {
  if (source.linkTypeId == null) {
    return 0
  }

  const activityKeys = new Set(activityEntities(entities, source).map(e => getId(e)))
  return Object.values(links).map(versions => versions[0]).filter(link => {
    if (link == null || link.TypeId === source.linkTypeId) {
      return false
    }
    const fromKey = link.FromEntityId + link.FromEntityTypeId
    const toKey = link.ToEntityId + link.ToEntityTypeId
    return (activityKeys.has(fromKey) && entities[toKey] != null) || (activityKeys.has(toKey) && entities[fromKey] != null)
  }).length
}

export function getActor (entity: IEntity, viewConfiguration: IViewConfiguration): Actor {
  const view = viewService.getView(entity.TypeId, entity.GlobalType)
  const rule = viewService.getRule(entity, viewConfiguration)
  return {
    key: getId(entity),
    entity,
    name: entity.LabelShort,
    longName: entity.LabelLong,
    typeName: configService.getTypeName(entity),
    icon: rule?.Icon ?? view.Icon,
    iconColor: entity.Color ?? rule?.Color ?? view.Color ?? viewService.getTheme().Icon
  }
}

// The entities that take part in the activities, in the order they first take part
export function getActorKeys (activities: Array<{ relations: Relation[] }>): string[] {
  const keys: string[] = []
  for (const activity of activities) {
    for (const relation of activity.relations) {
      if (!keys.includes(relation.actorKey)) {
        keys.push(relation.actorKey)
      }
    }
  }
  return keys
}

// The phases in order of time; each lasts until the next one starts
export function getPhases (phaseEvents: IPhaseEvent[]): Phase[] {
  const sorted = [...phaseEvents].sort((a, b) => a.Date.toMillis() - b.Date.toMillis())
  return sorted.map((p, i) => ({ id: p.Id, name: p.Description, color: p.Color, from: p.Date, until: sorted[i + 1]?.Date }))
}

// The first and the last moment of the days a view covers: the period the user chose, or else all dates,
// from the first phase or activity, whichever comes first, to the start of the last phase or the last activity, whichever comes last.
// Either is undefined when there is nothing to take it from
export function periodOf (from: string | undefined, to: string | undefined, activities: Activity[], phases: Phase[] = []): { first?: DateTime, last?: DateTime } {
  const day = (value?: string) => (value ? DateTime.fromISO(value) : undefined)
  const dates = [...activities.map(a => a.date), ...phases.map(p => p.from)].map(d => d.toLocal())
  const earliest = dates.length > 0 ? DateTime.min(...dates) : undefined
  const latest = dates.length > 0 ? DateTime.max(...dates) : undefined
  return {
    first: (day(from) ?? earliest)?.startOf('day'),
    last: (day(to) ?? latest)?.endOf('day')
  }
}

// The activities from the first day of a period to the end of its last. A period without a start or an end is open there
export function inPeriod (activities: Activity[], from?: string, to?: string): Activity[] {
  const first = from ? DateTime.fromISO(from).startOf('day') : undefined
  const last = to ? DateTime.fromISO(to).endOf('day') : undefined
  return activities.filter(a => (first == null || a.date >= first) && (last == null || a.date <= last))
}

// The phases that lie wholly outside a period, which a view of that period can not show
export function phasesOutside (phases: Phase[], first?: DateTime, last?: DateTime): Phase[] {
  return phases.filter(p => (last != null && p.from > last) || (first != null && p.until != null && p.until <= first))
}

// The phase an activity is in, or -1 when it is before the first phase
export function phaseIndexOf (activity: Activity, phases: Phase[]): number {
  let index = -1
  phases.forEach((p, i) => {
    if (activity.date >= p.from) {
      index = i
    }
  })
  return index
}
