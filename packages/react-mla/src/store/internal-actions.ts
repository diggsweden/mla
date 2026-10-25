// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type WritableDraft, produce } from 'immer'
import type { DateTime } from 'luxon'
import type { IChartBase, IEntity, IHistory, ILink } from '../interfaces/data-models'
import type { IShape } from '../interfaces/data-models/shape'
import configService from '../services/configurationService'
import { generateUUID, getId, isLinked, mergeProps } from '../utils/utils'
import useMainStore, { type IChangeHistory, type MainState } from './main-store'
import { setPositions } from '../utils/vis-data-utils'
import viewService from '../services/viewService'
import { fixDate } from '../utils/date'
import i18n from 'i18next'

const MAX_HISTORY = 20

function updateProps (draft: WritableDraft<IChartBase>) {
  if (draft.InternalId == null) {
    draft.InternalId = generateUUID()
  }
  draft.DateFrom = fixDate(draft.DateFrom)
  draft.DateTo = fixDate(draft.DateTo)
  Object.assign(draft, viewService.getLabels(draft))
}

function hasDifferentLabel (b1: IChartBase, b2: IChartBase) {
  return b1.LabelShort !== b2.LabelShort || b1.LabelLong !== b2.LabelLong || b1.LabelChart !== b2.LabelChart
}

const sortByDate = (a: IHistory, b: IHistory) => ((a.DateFrom != null && b.DateFrom != null) ? a.DateFrom.diff(b.DateFrom).milliseconds : 0)

function sameDate (a?: DateTime, b?: DateTime) {
  return a === b || (a != null && b != null && a.equals(b))
}

// The time line of the chart has to show everything that has a date
interface DateRange {
  min: DateTime
  max: DateTime
}

function widen (range: DateRange, thing: IChartBase) {
  if (thing.DateFrom != null && thing.DateFrom < range.min) {
    range.min = thing.DateFrom.startOf('day')
  }

  if (thing.DateTo != null && thing.DateTo > range.max) {
    range.max = thing.DateTo.endOf('day')
  }
}

// Adds a new version of a thing. A version with the same id or the same dates is replaced, and keeps the properties it has that the new one lacks
function addVersion<T extends IChartBase> (existing: T[] | undefined, version: T, name: string): T[] {
  if (existing == null) {
    return [version]
  }

  const found = existing.find(x => x.InternalId === version.InternalId || (sameDate(x.DateFrom, version.DateFrom) && sameDate(x.DateTo, version.DateTo)))
  if (found === undefined) {
    return [...existing, version].sort(sortByDate)
  }

  console.warn(`There is already a ${name} with this id and date, overwriting`)
  const replacement = produce(version, draft => {
    draft.InternalId = found.InternalId
    draft.Properties = mergeProps(found.Properties, version.Properties)
    updateProps(draft)
  })
  return [replacement, ...existing.filter(x => x.InternalId !== replacement.InternalId)]
}

function replaceVersion<T extends IChartBase> (existing: T[], version: T): T[] {
  return [version, ...existing.filter(x => x.InternalId !== version.InternalId)].sort(sortByDate)
}

// A change replaces the changes that were undone, so that undo and redo follow the new changes
function pushHistory (draft: WritableDraft<MainState>, change: IChangeHistory) {
  draft.history.splice(0, draft.historyPosition)
  draft.history.unshift(change)
  draft.historyPosition = 0
  draft.canRedo = false
  draft.canUndo = true

  if (draft.history.length > MAX_HISTORY) {
    draft.history.length = MAX_HISTORY
  }
}

// A shape with an id that is already there replaces it
function mergeShapes (existing: IShape[], added: IShape[]): IShape[] {
  const replacements = new Map(added.map(s => [s.Id, s]))
  const known = new Set(existing.map(s => s.Id))
  return [
    ...existing.map(s => replacements.get(s.Id) ?? s),
    ...added.filter(s => !known.has(s.Id))
  ]
}

export const updateSelected = (selectedIds?: string[]) => {
  useMainStore.setState(state => {
    const ids = selectedIds ?? state.selectedIds
    return {
      selectedIds: ids,
      selectedEntities: ids.map(id => state.getCurrentEntity(id)).filter((e): e is IEntity => e !== undefined),
      selectedLinks: ids.map(id => state.getCurrentLink(id)).filter((l): l is ILink => l !== undefined)
    }
  })
}

export const internalAdd = (addHistory: boolean, entities: IEntity[], links: ILink[], setSelected = false, shapes: IShape[] = []) => {
  const addedEntities: IEntity[] = []
  const addedLinks: ILink[] = []
  useMainStore.setState(state => {
    const range: DateRange = { min: state.minDate, max: state.maxDate }

    const stateUpEntities = produce(state.entities, stateDraft => {
      const n = state.network
      if (n != null && entities.some(e => e.PosX == null || e.PosY == null)) {
        entities = setPositions(n, entities, links)
      }

      for (let entity of entities) {
        const config = configService.getEntityConfiguration(entity.TypeId, entity.GlobalType)
        if (config == null) {
          console.error('Could not map, skipping', entity)
          continue
        }

        if (config.Internal === true) {
          continue
        }

        entity = produce(entity, draft => {
          updateProps(draft)

          // Show on map
          if (entity.Coordinates) {
            draft.ShowOnMap = true
          }

          // Align global type
          draft.TypeId = config.TypeId
        })

        widen(range, entity)
        addedEntities.push(entity)
        stateDraft[getId(entity)] = addVersion(stateDraft[getId(entity)], entity, 'entity')
      }
    })

    const stateUpLinks = produce(state.links, stateDraft => {
      for (let link of links) {
        const config = configService.getLinkConfiguration(link.TypeId, link.GlobalType)
        if (config == null) {
          console.error('Could not map, skipping', link)
          continue
        }

        if (config.Internal === true) {
          continue
        }

        link = produce(link, draft => {
          updateProps(draft)

          // Align global type
          draft.TypeId = config.TypeId
        })

        widen(range, link)
        addedLinks.push(link)
        stateDraft[getId(link)] = addVersion(stateDraft[getId(link)], link, 'link')
      }
    })

    return produce(state, draft => {
      if (addHistory) {
        pushHistory(draft, {
          action: 'ADD',
          from: { entities: [], links: [], shapes: [] },
          to: { entities: addedEntities, links: addedLinks, shapes }
        })
      }

      draft.dirty = true
      draft.entities = stateUpEntities
      draft.links = stateUpLinks
      draft.selectedIds = setSelected ? [...entities, ...links].map(x => getId(x)) : draft.selectedIds
      if (shapes.length > 0) {
        draft.shapes = mergeShapes(draft.shapes, shapes)
        if (setSelected) {
          draft.selectedShapeIds = shapes.map(x => x.Id)
        }
      }

      draft.minDate = range.min
      draft.maxDate = range.max
    })
  })

  updateSelected()
}

export const internalUpdate = (addHistory: boolean, entities: IEntity[], links: ILink[], shapes: IShape[] = []) => {
  useMainStore.setState(state => {
    const range: DateRange = { min: state.minDate, max: state.maxDate }

    const stateUpEntities = produce(state.entities, stateDraft => {
      for (let entity of entities) {
        entity = produce(entity, draft => {
          draft.SourceSystemId = i18n.t('modified')
          updateProps(draft)
        })
        stateDraft[getId(entity)] = replaceVersion(stateDraft[getId(entity)], entity)
        widen(range, entity)
      }
    })

    const stateUpLinks = produce(state.links, stateDraft => {
      for (let link of links) {
        link = produce(link, draft => {
          draft.SourceSystemId = i18n.t('modified')
          updateProps(draft)
        })
        stateDraft[getId(link)] = replaceVersion(stateDraft[getId(link)], link)
        widen(range, link)
      }
    })

    return produce(state, draft => {
      if (addHistory) {
        // What is changed is kept, to be able to go back
        const restoreE = entities.map(e => {
          return produce(draft.entities[getId(e)].find(x => x.InternalId === e.InternalId), () => undefined)!
        })
        const restoreL = links.map(e => {
          return produce(draft.links[getId(e)].find(x => x.InternalId === e.InternalId), () => undefined)!
        })

        const restoreS = shapes.map(x => draft.shapes.find(y => y.Id === x.Id)).filter((x): x is WritableDraft<IShape> => x !== undefined).map(x => ({ ...x }))

        pushHistory(draft, {
          action: 'UPDATE',
          from: { entities: restoreE, links: restoreL, shapes: restoreS },
          to: { entities, links, shapes }
        })
      }

      draft.dirty = true
      draft.entities = stateUpEntities
      draft.links = stateUpLinks
      if (shapes.length > 0) {
        draft.shapes = mergeShapes(draft.shapes, shapes)
      }

      draft.minDate = range.min
      draft.maxDate = range.max
    })
  })

  updateSelected()
}

export const internalRemove = (addHistory: boolean, entities: IEntity[], links: ILink[], shapes: IShape[] = []) => {
  useMainStore.setState(state => {
    return produce(state, draft => {
      if (addHistory) {
        pushHistory(draft, {
          action: 'REMOVE',
          from: { entities, links, shapes },
          to: { entities: [], links: [], shapes: [] }
        })
      }

      for (const entity of entities) {
        let selected = draft.selectedIds

        const existing = draft.entities[getId(entity)] ?? []
        const update = existing.filter(x => x.InternalId !== entity.InternalId)

        if (update.length === 0) {
          const copy = { ...draft.entities }
          delete copy[getId(entity)]
          selected = selected.filter(s => s !== getId(entity))

          // The links of an entity that is gone are removed with it
          const copyLinks = { ...draft.links }

          for (const link of Object.values(draft.links).map(l => l[0])) {
            if (isLinked(entity, link)) {
              copyLinks[getId(link)].forEach(remove => {
                if (addHistory && !draft.history[0].from.links.some(l => l.InternalId === remove.InternalId)) {
                  draft.history[0].from.links.push(remove)
                }
              })

              delete copyLinks[getId(link)]
              selected = selected.filter(s => s !== getId(link))
            }
          }

          draft.selectedIds = selected
          draft.dirty = true
          draft.entities = copy
          draft.links = copyLinks
        } else {
          draft.dirty = true
          draft.entities = { ...draft.entities, [getId(entity)]: update }
        }
      }

      for (const link of links) {
        const existing = draft.links[getId(link)] ?? []
        const update = existing.filter(x => x.InternalId !== link.InternalId)

        if (update.length === 0) {
          draft.selectedIds = draft.selectedIds.filter(s => s !== getId(link))
          delete draft.links[getId(link)]
        } else {
          draft.links = { ...draft.links, [getId(link)]: update }
        }

        draft.dirty = true
      }

      if (shapes.length > 0) {
        const removed = new Set(shapes.map(x => x.Id))
        draft.shapes = draft.shapes.filter(x => !removed.has(x.Id))
        draft.selectedShapeIds = draft.selectedShapeIds.filter(x => !removed.has(x))
        draft.dirty = true
      }
    })
  })

  updateSelected()
}

export const internalUpdateLabels = () => {
  useMainStore.setState(state => {
    const stateUpEntities = produce(state.entities, stateDraft => {
      for (const entity of Object.values(state.entities).flat()) {
        const update = produce(entity, draft => {
          updateProps(draft)
        })

        if (hasDifferentLabel(update, entity)) {
          stateDraft[getId(entity)] = replaceVersion(stateDraft[getId(entity)], update)
        }
      }
    })

    const stateUpLinks = produce(state.links, stateDraft => {
      for (const link of Object.values(state.links).flat()) {
        const update = produce(link, draft => {
          updateProps(draft)
        })

        if (hasDifferentLabel(update, link)) {
          stateDraft[getId(link)] = replaceVersion(stateDraft[getId(link)], update)
        }
      }
    })

    const stateUpComputedLinks = state.computedLinks.map(l => {
      return produce(l, draft => {
        updateProps(draft)
      })
    })

    return produce(state, draft => {
      draft.entities = stateUpEntities
      draft.links = stateUpLinks
      draft.computedLinks = stateUpComputedLinks
    })
  })
}
