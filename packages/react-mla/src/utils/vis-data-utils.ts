// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { Direction, IChartBase, IEntity, ILink, ITimeSpan } from '../interfaces/data-models'
import { getId, isLinked, randomNumber } from './utils'
import viewService, { IIcon } from '../services/viewService'
import { Edge, Network, Node, Position } from 'vis-network'
import { IBaseViewConfiguration, IViewConfiguration, } from '../interfaces/configuration/view-configuration'
import configService from '../services/configurationService'
import { Interval } from 'luxon'
import { produce } from 'immer'

export function setPositions (n: Network, entities: IEntity[], links: ILink[]): IEntity[] {
  const getLinked = (entity: IEntity): IEntity[] => {
    return links.filter(l => isLinked(entity, l))
      .map(l => entities.find(e => e.Id !== entity.Id && isLinked(e, l))).filter(e => e !== undefined) as IEntity[]
  }

  const pos = n.getPositions()
  const positioned = [] as IEntity[]
  const positions = Object.values(pos)
  const clusters = [] as IEntity[][]
  let i = 0
  const existingOnChart = entities.filter(x => pos[getId(x)] != null)

  for (const ent of existingOnChart) {
    clusters[i] = []
    clusters[i].push(produce(ent, draft => {
      draft.PosX = pos[getId(ent)].x
      draft.PosY = pos[getId(ent)].y
    }))
    entities = entities.filter(e => e.Id !== ent.Id)
    i++
  }
  i = 0
  for (const ent of existingOnChart) {
    const linked = getLinked(ent)
    linked.forEach(l => {
      clusters[i].push(l)
      entities = entities.filter(e => e.Id !== l.Id)
    })
    i++
  }

  while (entities.length > 0) {
    const ent = entities[0]
    clusters[i] = []
    clusters[i].push(ent)
    entities = entities.filter(e => e.Id !== ent.Id)
    const linked = getLinked(ent)
    linked.forEach(l => {
      clusters[i].push(l)
      entities = entities.filter(e => e.Id !== l.Id)
    })
    i++
  }

  let minx = 0
  let maxx = 0
  let miny = 0
  let maxy = 0

  Object.values(pos).forEach(p => {
    minx = Math.min(minx, p.x)
    maxx = Math.max(maxx, p.x)
    miny = Math.min(miny, p.y)
    maxy = Math.min(maxy, p.y)
  })

  const MIN = 230
  clusters.forEach(c => {
    let x = 0
    let y = 0

    if (c[0].PosX != null || c[0].PosY != null) {
      x = c[0].PosX!
      y = c[0].PosY!
    } else {
      // Generate a random position
      let dist = closestDistance(positions, x, y)
      let count = 0
      while (positions.length > 0 && dist < MIN && count < 10) {
        const newx = randomNumber(minx - MIN * 1.5, maxx + MIN * 1.5)
        const newy = randomNumber(miny - MIN * 1.5, maxy + MIN * 1.5)
        const newdist = closestDistance(positions, newx, newy)

        if ((dist < MIN && newdist > dist) || (newdist < dist && newdist > MIN)) {
          x = newx
          y = newy
          dist = newdist
        }
        count++
      }
    }

    const update = positionGroup(c[0], c.splice(1), x, y)
    update.forEach(u => {
      positions.push({
        x: u.PosX ?? 0,
        y: u.PosY ?? 0
      })
    })

    positioned.push(...update)
  })

  return positioned
}

function closestDistance (positions: Position[], x: number, y: number): number {
  let dist = Number.MAX_VALUE
  positions.forEach(p => {
    const a = p.x - x
    const b = p.y - y

    const c = Math.hypot(a, b)
    dist = Math.min(dist, c)
  })

  return dist
}

export function positionGroup (entity: IEntity, linked: IEntity[], x: number, y: number): IEntity[] {
  const res = [] as IEntity[]
  res.push(produce(entity, draft => {
    if (entity.PosX == null || entity.PosY == null) {
      draft.PosX = x
      draft.PosY = y
    }
  }))
  const distance = 200
  if (linked.filter(l => l.PosX == null || l.PosY == null).length > 0) {
    const diff = (2 * Math.PI) / linked.length
    let rad = Math.PI / 4
    linked.forEach(e => {
      res.push(produce(e, draft => {
        draft.PosX = x + (Math.cos(rad) * distance)
        draft.PosY = y + (Math.sin(rad) * distance)
      }))
      rad += diff
    })
  }

  res.push(...linked.filter(l => l.PosX != null && l.PosY != null))

  return res
}

export function isSelected (thing: IChartBase, selected: string[]): boolean {
  return selected.some(s => s === getId(thing))
}

export function isActive (thing: IChartBase, time: ITimeSpan): boolean {
  const interval = Interval.fromDateTimes(time.DateFrom, time.DateTo)

  if (thing.DateFrom == null && thing.DateTo == null) {
    return true
  }

  if (thing.DateFrom == null && thing.DateTo != null) {
    return interval.contains(thing.DateTo)
  } 

  if (thing.DateTo == null && thing.DateFrom != null) {
    return interval.contains(thing.DateFrom)
  }

  if (thing.DateFrom != null && thing.DateTo != null) {
    const interval2 = Interval.fromDateTimes(thing.DateFrom!, thing.DateTo!)
    return interval.intersection(interval2) != null
  }

  return false
}

export function mapToNode (entity: IEntity, icon: IIcon | undefined, selected: boolean, active: boolean, historyMode: boolean, config: IViewConfiguration, view: IBaseViewConfiguration): Node {
  const usingLevels = config.Show.some(x => x.Level != null)

  const level = view.Level ?? (usingLevels ? 0 : undefined)
  let label = entity.LabelChart

  const attributes = viewService.getAttributes(entity)
  if (attributes.length > 0) {
    label += '\n' + attributes.map((a) => `<code>${a.text}</code>`).join('\n')
  }

  return {
    id: getId(entity),
    label,
    title: entity.LabelLong,
    image: icon,
    size: 40,
    shape: icon === undefined ? undefined : 'image',
    x: entity.PosX,
    y: entity.PosY,
    fixed: (entity.PosX ?? entity.PosY) != null,
    level,
    hidden: !(selected || (view.Show ?? true)),
    opacity: !historyMode || active ? 1 : 0.3
  }
}

export function mapToEdge (link: ILink, selected: boolean, active: boolean, historyMode: boolean, linkCount: number, view: IBaseViewConfiguration): Edge {
  let label = link.LabelShort
  if (label === configService.getTypeName(link)) {
    label = ''
  }

  const mapDirection = (Direction: Direction): string => {
    switch (Direction) {
      case 'FROM': return 'from'
      case 'TO': return 'to'
      case 'BOTH': return 'to, from'
      default: return ''
    }
  }

  return {
    id: getId(link),
    from: link.FromEntityId + link.FromEntityTypeId,
    to: link.ToEntityId + link.ToEntityTypeId,
    label: !historyMode || active ? label : ' ',
    arrows: mapDirection(link.Direction),
    length: 300,
    hidden: !(selected || (active && historyMode) || ((view.Show ?? true) && !historyMode)),
    dashes: getDashes(link),
    smooth: linkCount > 1
      ? {
          enabled: true,
          type: 'dynamic',
          roundness: 0.5
        }
      : {
          enabled: false,
          type: '',
          roundness: 0
        },
    color: {
      color: link.MarkColor ? link.MarkColor : link.Color ?? view.Color ?? '#848484',
      highlight: link.MarkColor ? link.MarkColor : link.Color ?? view.Color ?? '#848484'
    },
    width: link.MarkColor ? 3 : 1
  }
}

export function getDashes (link: ILink): boolean | number[] {
  switch (link.Style) {
    case 'DASHED': return true
    case 'DOTTED': return [2, 5]
    default: return false
  }
}

export function getLinks (fromId: string, fromType: string, toId: string, toType: string, links: ILink[]): ILink[] {
  return links.filter(link =>
    ((link.FromEntityId === fromId && link.FromEntityTypeId === fromType) && (link.ToEntityId === toId && link.ToEntityTypeId === toType)) ||
    ((link.FromEntityId === toId && link.FromEntityTypeId === toType) && (link.ToEntityId === fromId && link.ToEntityTypeId === fromType))
  )
}

export function getLinkCount (link: ILink, links: ILink[]): number {
  return getLinks(link.FromEntityId, link.FromEntityTypeId, link.ToEntityId, link.ToEntityTypeId, links).length
}
