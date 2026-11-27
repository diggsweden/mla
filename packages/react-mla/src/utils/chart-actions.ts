// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { produce } from 'immer'
import type { IEntityTypeConfiguration, IQueryIntegration } from '../interfaces/configuration'
import type { IEntity, ILink, LinkDashStyle } from '../interfaces/data-models'
import configService from '../services/configurationService'
import useMainStore from '../store/main-store'
import { filterEntityIntegrations, getId } from './utils'

// What is done to the selected entities and relations, from the ribbon and from the menu of the chart

// The color of the icons of the entities and of the lines of the relations, or the color of the view when it is reset
export function setIconColor (entities: IEntity[], links: ILink[], color: string | undefined) {
  const { updateEntity, updateLink } = useMainStore.getState()
  updateEntity(...entities.map(e => produce(e, draft => { draft.Color = color })))
  updateLink(...links.map(e => produce(e, draft => { draft.Color = color })))
}

// A ring of the color around the entities, and the relations marked with it
export function setContourColor (entities: IEntity[], links: ILink[], color: string | undefined) {
  const { updateEntity, updateLink } = useMainStore.getState()
  updateEntity(...entities.map(e => produce(e, draft => {
    draft.MarkColor = color
    draft.MarkIcon = color !== undefined ? 'outlined_circle' : undefined
  })))
  updateLink(...links.map(e => produce(e, draft => { draft.MarkColor = color })))
}

export function setLinkStyle (links: ILink[], style: LinkDashStyle | undefined) {
  useMainStore.getState().updateLink(...links.map(e => produce(e, draft => { draft.Style = style })))
}

// Shows or hides the entities on the map, in all their versions. Only those with a position can be on it
export function setShownOnMap (entities: IEntity[], show: boolean) {
  const state = useMainStore.getState()
  const change = [] as IEntity[]
  for (const list of entities.map(e => state.entities[getId(e)] ?? [])) {
    for (const e of list) {
      if (e.Coordinates && e.ShowOnMap !== show) {
        change.push(produce(e, draft => { draft.ShowOnMap = show }))
      }
    }
  }
  state.updateEntity(...change)
}

// Adds all entities of the type to the selection
export function selectType (typeId: string) {
  const state = useMainStore.getState()
  const ids = Object.values(state.entities).filter(e => e[0].TypeId === typeId).map(e => getId(e[0]))
  state.setSelected([...new Set([...state.selectedIds, ...ids])])
}

interface ChartEdge { id?: string | number, from?: string | number, to?: string | number, hidden?: boolean }

// The entities next to the selected ones in the chart, and the relations to them, as ids in the chart. Hidden ones are left out
export function neighboursOf (ids: string[], edges: ChartEdge[]): string[] {
  const selected = new Set(ids)
  const result = new Set<string>()
  for (const edge of edges) {
    if (edge.hidden === true || edge.id == null || edge.from == null || edge.to == null) continue
    const from = String(edge.from)
    const to = String(edge.to)
    if (selected.has(from) || selected.has(to)) {
      result.add(String(edge.id))
      result.add(from)
      result.add(to)
    }
  }
  return [...result]
}

// The entities at the ends of the relations, as ids in the chart
export function endsOf (links: ILink[]): string[] {
  return [...new Set(links.flatMap(l => [l.FromEntityId + l.FromEntityTypeId, l.ToEntityId + l.ToEntityTypeId]))]
}

// A service that fetches from the selected entities: how many of them it is sent, and why it cannot be used when it cannot
export interface ServiceChoice {
  service: IQueryIntegration
  count: number
  reason?: string
}

type Translate = (key: string, options?: Record<string, unknown>) => string

// The services that take any of the types of the selected entities. Those that cannot be used with what is selected say why,
// by the number of each type they take, and for those that take one type or another, that it is one of them at a time
export function serviceChoices (services: IQueryIntegration[], entities: IEntity[], t: Translate): ServiceChoice[] {
  const types = entities.map(e => e.TypeId)
  const typeName = (typeId: string) => configService.getEntityConfiguration(typeId)?.Name ?? typeId
  const countOf = (typeId: string) => types.filter(x => x === typeId).length
  const wrongCount = (c: IEntityTypeConfiguration): string | undefined => {
    const count = countOf(c.TypeId)
    if (count < c.Min) return t('service at least', { count: c.Min, type: typeName(c.TypeId) })
    if (c.Max != null && count > c.Max) return t('service at most', { count: c.Max, type: typeName(c.TypeId) })
    return undefined
  }

  const result = [] as ServiceChoice[]
  for (const service of services) {
    const taken = service.Parameters.EntityTypes
    if (taken == null) continue
    const count = types.filter(x => taken.some(c => c.TypeId === x)).length
    if (count === 0) continue
    if (filterEntityIntegrations([service], types).length > 0) {
      result.push({ service, count })
      continue
    }
    let reason: string | undefined
    if (service.Parameters.EntityConfiguration === 'OR') {
      const present = taken.filter(c => countOf(c.TypeId) > 0)
      reason = present.length > 1
        ? t('service one type', { types: present.map(c => typeName(c.TypeId)).join(t('types or')) })
        : wrongCount(present[0])
    } else {
      reason = taken.map(wrongCount).find(r => r != null)
    }
    result.push({ service, count, reason: reason ?? t('service not for selection') })
  }
  return result
}
