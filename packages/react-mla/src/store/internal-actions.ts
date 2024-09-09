// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

/* eslint-disable @typescript-eslint/no-unused-vars */

import { WritableDraft, produce } from 'immer'
import type { IChartBase, IEntity, IHistory, ILink } from '../interfaces/data-models'
import configService from '../services/configurationService'
import { generateUUID, getId, isLinked, mergeProps } from '../utils/utils'
import useMainStore from './main-store'
import { setPositions } from '../utils/vis-data-utils'
import viewService from '../services/viewService'
import { fixDate } from '../utils/date'

function updateProps(draft: WritableDraft<IChartBase>) {
  if (draft.InternalId == null) {
    draft.InternalId = generateUUID()
  }
  draft.DateFrom = fixDate(draft.DateFrom)
  draft.DateTo = fixDate(draft.DateTo)
  draft.LabelShort = viewService.getShortName(draft)
  draft.LabelLong = viewService.getLongName(draft)
  draft.LabelChart = viewService.getChartName(draft)
}

function hasDifferentLabel(b1: IChartBase, b2: IChartBase) {
  return b1.LabelShort !== b2.LabelShort || b1.LabelLong !== b2.LabelLong || b1.LabelChart !== b2.LabelChart
}

export const internalAdd = (addHistory: boolean, entities: IEntity[], links: ILink[], setSelected = false) => {
  const updateEntities: IEntity[] = []
  const updateLinks: ILink[] = []
  useMainStore.setState(state => {
    let min = state.minDate
    let max = state.maxDate

    const stateUpEntities = produce(state.entities, stateDraft => {
      const n = state.network
      if (n != null && entities.some(e => e.PosX == null || e.PosY == null)) {
        entities = setPositions(n, entities, links)
      }

      for (let entity of entities) {
        const config = configService.getEntityConfiguration(entity.TypeId, entity.SemanticType)
        if (config == null) {
          console.error("Could not map, skipping", entity)
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

          // Align semantic type
          draft.TypeId = config.TypeId
        })

        if (entity.DateFrom != null && entity.DateFrom < min) {
          min = entity.DateFrom!.startOf("day")
        }

        if (entity.DateTo != null && entity.DateTo > max) {
          max = entity.DateTo!.endOf("day")
        }

        if (addHistory) {
          updateEntities.push(entity)
        }

        let update = [] as IEntity[]
        const existing = stateDraft[getId(entity)]
        if (existing == null) {
          update = [entity]
        } else {
          const found = existing.find(x => x.InternalId === entity.InternalId || (x.DateFrom === entity.DateFrom && x.DateTo === entity.DateTo))
          if (found !== undefined) {
            console.warn('Det finns redan en Entity med detta id och datum, data skrivs över')
            const updateEntity = produce(entity, draft => {
              draft.InternalId = found.InternalId
              draft.Properties = mergeProps(found.Properties, entity.Properties)
              updateProps(draft)
            })
            update = [updateEntity, ...existing.filter(x => x.InternalId !== updateEntity.InternalId)]
          } else {
            update = [...existing, entity].sort((a, b) => sortByDate(a, b))
          }
        }

        stateDraft[getId(entity)] = update
      }
    })

    const stateUpLinks = produce(state.links, stateDraft => {
      for (let link of links) {
        const config = configService.getLinkConfiguration(link.TypeId, link.SemanticType)
        if (config == null) {
          console.error("Could not map, skipping", link)
          continue
        }

        if (config.Internal === true) {
          return
        }

        link = produce(link, draft => {
          updateProps(draft)

          // Align semantic type
          draft.TypeId = config.TypeId
        })

        if (link.DateFrom != null && link.DateFrom < min) {
          min = link.DateFrom!.startOf("day")
        }

        if (link.DateTo != null && link.DateTo> max) {
          max = link.DateTo!.endOf("day")
        }

        if (addHistory) {
          updateLinks.push(link)
        }

        let update = [] as ILink[]
        const existing = stateDraft[getId(link)]
        if (existing == null) {
          update = [link]
        } else {
          const found = existing.find(x => x.InternalId === link.InternalId || (x.DateFrom === link.DateFrom && x.DateTo === link.DateTo))
          if (found !== undefined) {
            console.warn('Det finns redan en länk med detta id och datum, data skrivs över')
            const updateLink = produce(link, draft => {
              draft.InternalId = found.InternalId
              draft.Properties = mergeProps(found.Properties, link.Properties)
              updateProps(draft)
            })
            update = [updateLink, ...existing.filter(x => updateLink.InternalId !== x.InternalId)]
          } else {
            update = [...existing, link].sort((a, b) => sortByDate(a, b))
          }
        }

        stateDraft[getId(link)] = update
      }
    })

    return produce(state, draft => {
      if (addHistory) {
        draft.history.unshift({
          action: 'ADD',
          from: {
            entities: [],
            links: []
          },
          to: {
            entities: updateEntities,
            links: updateLinks
          }
        })
        draft.historyPosition = 0
        draft.canRedo = false
        draft.canUndo = true

        if (draft.history.length > 20) {
          draft.history.length = 20
        }
      }

      draft.dirty = true
      draft.entities = stateUpEntities
      draft.links = stateUpLinks
      draft.selectedIds = setSelected ? [...entities, ...links].map(x => getId(x)): draft.selectedIds

      draft.minDate = min
      draft.maxDate = max
    })
  })

  if (addHistory) {
    console.debug('[history-add]', useMainStore.getState().history)
  }
}

export const internalUpdate = (addHistory: boolean, entities: IEntity[], links: ILink[]) => {
  useMainStore.setState(state => {
    let min = state.minDate
    let max = state.maxDate

    const stateUpEntities = produce(state.entities, stateDraft => {
      for (let entity of entities) {
        entity = produce(entity, draft => {
          draft.SourceSystemId = 'Modifierad'
          updateProps(draft)
        })
        const existing = stateDraft[getId(entity)]
        stateDraft[getId(entity)] = [entity, ...existing.filter(x => x.InternalId !== entity.InternalId)].sort((a, b) => sortByDate(a, b))

        if (entity.DateFrom != null && entity.DateFrom < min) {
          min = entity.DateFrom!.startOf("day")
        }

        if (entity.DateTo != null && entity.DateTo > max) {
          max = entity.DateTo!.endOf("day")
        }
      }
    })

    const stateUpLinks = produce(state.links, stateDraft => {
      for (let link of links) {
        link = produce(link, draft => {
          draft.SourceSystemId = 'Modifierad'
          updateProps(draft)
        })
        const existing = stateDraft[getId(link)]
        stateDraft[getId(link)] = [link, ...existing.filter(x => x.InternalId !== link.InternalId)].sort((a, b) => sortByDate(a, b))

        if (link.DateFrom != null && link.DateFrom < min) {
          min = link.DateFrom!.startOf("day")
        }

        if (link.DateTo != null && link.DateTo > max) {
          max = link.DateTo!.endOf("day")
        }
      }
    })

    return produce(state, draft => {
      if (addHistory) {
        const restoreE = entities.map(e => {
          return produce(draft.entities[getId(e)].find(x => x.InternalId === e.InternalId), draft => undefined)!
        })
        const restoreL = links.map(e => {
          return produce(draft.links[getId(e)].find(x => x.InternalId === e.InternalId), draft => undefined)!
        })

        for (let s = 0; s < draft.historyPosition; s++) {
          draft.history.shift()
        }

        draft.history.unshift({
          action: 'UPDATE',
          from: {
            entities: restoreE,
            links: restoreL
          },
          to: {
            entities,
            links
          }
        })
        draft.historyPosition = 0
        draft.canRedo = false
        draft.canUndo = true

        if (draft.history.length > 20) {
          draft.history.length = 20
        }
      }

      draft.dirty = true
      draft.entities = stateUpEntities
      draft.links = stateUpLinks

      draft.minDate = min
      draft.maxDate = max
    })
  })

  if (addHistory) {
    console.debug('[history-update]', useMainStore.getState().history)
  }
}

export const internalRemove = (addHistory: boolean, entities: IEntity[], links: ILink[]) => {
  useMainStore.setState(state => {
    return produce(state, draft => {
      if (addHistory) {
        draft.history.unshift({
          action: 'REMOVE',
          from: {
            entities,
            links
          },
          to: {
            entities: [],
            links: []
          }
        })
        draft.historyPosition = 0
        draft.canRedo = false
        draft.canUndo = true

        if (draft.history.length > 20) {
          draft.history.length = 20
        }
      }

      for (const entity of entities) {
        let selected = draft.selectedIds

        const existing = draft.entities[getId(entity)] ?? []
        const update = existing.filter(x => x.InternalId !== entity.InternalId)

        if (update.length === 0) {
          const copy = { ...draft.entities }
          delete copy[getId(entity)]
          selected = selected.filter(s => s !== getId(entity))

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
    })
  })

  if (addHistory) {
    console.debug('[history-remove]', useMainStore.getState().history)
  }
}

export const internalUpdateLabels = () => {
  useMainStore.setState(state => {
    const stateUpEntities = produce(state.entities, stateDraft => {
      for (const entity of Object.values(state.entities).flat()) {
        const update = produce(entity, draft => {
          updateProps(draft)
        })

        if (hasDifferentLabel(update, entity)) {
          const existing = stateDraft[getId(entity)]
          stateDraft[getId(entity)] = [update, ...existing.filter(x => x.InternalId !== entity.InternalId)].sort((a, b) => sortByDate(a, b))
        }
      }
    })

    const stateUpLinks = produce(state.links, stateDraft => {
      for (const link of Object.values(state.links).flat()) {
        const update = produce(link, draft => {
          updateProps(draft)
        })

        if (hasDifferentLabel(update, link)) {
          const existing = stateDraft[getId(link)]
          stateDraft[getId(link)] = [update, ...existing.filter(x => x.InternalId !== link.InternalId)].sort((a, b) => sortByDate(a, b))
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

const sortByDate = (a: IHistory, b: IHistory) => ((a.DateFrom != null && b.DateFrom != null) ? a.DateFrom.diff(b.DateFrom).milliseconds : 0)
