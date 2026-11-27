// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { ILinkConfiguration } from '../../interfaces/configuration'
import type { Direction, IEntity, ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import { compareWildcard, generateUUID } from '../../utils/utils'

// Which way a relation points, seen from the two entities as the user gave them: to the second, to the first, both or none
export type LinkDirection = 'end' | 'start' | 'both' | 'none'

// The name of an entity as the chart shows it, on one line, without the tags of the chart such as <b>
export function nameOf (entity: IEntity): string {
  return entity.LabelChart.split('\n')[0].replace(/<[^>]*>/g, '').trim() || entity.LabelShort || configService.getTypeName(entity)
}

// Whether a type of relation can be between two entities, in one direction or the other
export function allows (type: ILinkConfiguration, a: IEntity, b: IEntity): boolean {
  return type.AllowedRelations.some(r => compareWildcard(r.FromEntityTypeId, a.TypeId) && compareWildcard(r.ToEntityTypeId, b.TypeId)) ||
    type.AllowedRelations.some(r => compareWildcard(r.ToEntityTypeId, a.TypeId) && compareWildcard(r.FromEntityTypeId, b.TypeId))
}

// The direction of a link that points the way chosen
export function directionOf (link: ILink, first: IEntity, second: IEntity, direction: LinkDirection): Direction {
  if (direction === 'both') return 'BOTH'
  if (direction === 'none') return 'NONE'
  const target = direction === 'end' ? second : first
  return link.ToEntityId === target.Id && link.ToEntityTypeId === target.TypeId ? 'TO' : 'FROM'
}

// A new link of a type between two entities. Its start and end are as the type of relation has them, and it points the way chosen
export function buildLink (first: IEntity, second: IEntity, type: ILinkConfiguration, direction: LinkDirection): ILink {
  const reversed = type.AllowedRelations.some(r => compareWildcard(r.FromEntityTypeId, second.TypeId) && compareWildcard(r.ToEntityTypeId, first.TypeId))
  const from = reversed ? second : first
  const to = reversed ? first : second
  const link: ILink = {
    Id: generateUUID(),
    InternalId: generateUUID(),
    TypeId: type.TypeId,
    GlobalType: type.GlobalType,
    LabelLong: '',
    LabelShort: '',
    LabelChart: '',
    SourceSystemId: 'Egenskapad',
    FromEntityId: from.Id,
    FromEntityTypeId: from.TypeId,
    ToEntityId: to.Id,
    ToEntityTypeId: to.TypeId,
    Direction: 'NONE',
    Properties: []
  }
  return { ...link, Direction: directionOf(link, first, second, direction) }
}

// How a relation pointed before it could be chosen: both ways between two of a kind, else to the end the type of relation has
export function defaultDirection (first: IEntity, second: IEntity, type: ILinkConfiguration): LinkDirection {
  if (first.TypeId === second.TypeId) return 'both'
  const link = buildLink(first, second, type, 'end')
  return link.Direction === 'TO' ? 'end' : 'start'
}
