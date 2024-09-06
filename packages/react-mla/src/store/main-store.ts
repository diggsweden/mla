// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand'

import type { IEntity, IEvent, IEventLink, ILink, IPhaseEvent, ITimeSpan } from '../interfaces/data-models'
import { generateUUID, mergeContext } from '../utils/utils'
import useAppStore from './app-store'
import { type DataInterfaceEdges, type DataInterfaceNodes, type Edge, type Network, type Node } from 'vis-network'
import { DataSet } from 'vis-data'
import { produce } from 'immer'
import { internalAdd, internalRemove, internalUpdate } from './internal-actions'
import { assignLinks, computeLinks, filterEvents } from '../utils/event-utils'
import type { IEventFilter } from '../interfaces/configuration/event-operations'
import { DateTime } from 'luxon'
import { fixDate } from '../utils/date'
import { IGeoFeature } from '../interfaces/data-models/geo'

export type IntervalType = 'day' | 'week' | 'month' | 'custom'

type HistoryAction = 'ADD' | 'UPDATE' | 'REMOVE'
interface IChangeHistory {
  action: HistoryAction
  from: {
    entities: IEntity[]
    links: ILink[]
  }
  to: {
    entities: IEntity[]
    links: ILink[]
  }
}

export interface MainState {
  entities: Record<string, IEntity[]>
  links: Record<string, ILink[]>

  events: Record<string, IEvent>
  eventFilters: Record<string, IEventFilter[] | undefined>
  computedLinks: IEventLink[]

  phaseEvents: IPhaseEvent[]
  geoFeatures: IGeoFeature[]

  dirty: boolean

  currentDate: ITimeSpan
  interval: IntervalType
  minDate: DateTime
  maxDate: DateTime
  setInterval: (interval: IntervalType) => ITimeSpan
  setDate: (date: DateTime, isToDate?: boolean) => ITimeSpan
  setDateAndTime: (date: DateTime) => ITimeSpan
  setTimespan: (timespan: ITimeSpan) => ITimeSpan
  storePositions: () => void

  context: string
  setContext: (ctx: string) => void

  selectedEntities: () => IEntity[]
  selectedLinks: () => ILink[]
  selectedIds: string[]

  network: Network | undefined
  setNetwork: (network: Network | undefined) => void
  data: { nodes: DataInterfaceNodes, edges: DataInterfaceEdges }

  setEvent: (...events: IEvent[]) => void
  removeEvent: (...events: IEvent[]) => void
  updateComputedLinks: () => void
  setEventFilter: (filter: Record<string, IEventFilter[] | undefined>) => void

  getEntity: (entityId: string, internalId: string) => IEntity | undefined
  getCurrentEntity: (entityId: string, date?: DateTime) => IEntity | undefined
  getEntityHistory: (entityId: string) => IEntity[] | undefined

  addEntity: (...entities: IEntity[]) => void
  updateEntity: (...entity: IEntity[]) => void
  removeEntity: (...entity: IEntity[]) => void

  getLink: (linkId: string, internalId: string) => ILink | undefined
  getCurrentLink: (linkId: string, date?: DateTime) => ILink | undefined
  getLinkHistory: (linkId: string) => ILink[] | undefined

  addLink: (...links: ILink[]) => void
  updateLink: (...links: ILink[]) => void
  removeLink: (...links: ILink[]) => void

  setPhaseEvent: (event: IPhaseEvent) => void
  removePhaseEvent: (event: IPhaseEvent) => void

  setGeoFeature: (feature: IGeoFeature) => void
  removeGeoFeature: (feature: IGeoFeature) => void

  setSelected: (selectedIds: string[]) => void

  setDirty: (isDirty: boolean) => void
  save: () => string
  open: (json: string) => void

  history: IChangeHistory[]
  historyPosition: number
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

const useMainStore = create<MainState>((set, get) => ({
  entities: {},
  links: {},
  computedLinks: [],
  events: {},
  eventFilters: {},
  phaseEvents: [],
  geoFeatures: [],
  dirty: false,

  interval: 'day',
  currentDate: {
    DateFrom: DateTime.now().startOf("day"),
    DateTo:DateTime.now().endOf("day")
  },
  maxDate: DateTime.now().startOf("day").plus( { months: 6 }),
  minDate: DateTime.now().startOf("day").minus( { months: 6 }),

  data: {
    nodes: new DataSet<Node, 'id'>(),
    edges: new DataSet<Edge, 'id'>()
  },
  network: undefined,
  setNetwork: (network: Network | undefined) => {
    set((state) => ({
      network
    }))
  },

  setInterval: (interval: IntervalType) => {
    let result = get().currentDate

    set((state) => {
      let fromDate = state.currentDate.DateFrom
      let toDate = state.currentDate.DateTo
      switch (interval) {
        case 'day': 
          fromDate = fromDate.startOf("day")
          toDate = fromDate.endOf("day")
          break
        case 'week':
          fromDate = fromDate.startOf("week")
          toDate = fromDate.endOf("week")
          break
        case 'month':
          fromDate = fromDate.startOf("month")
          toDate = fromDate.endOf("month")
          break
      }

      result = {
        DateFrom: fromDate,
        DateTo: toDate
      }

      return ({
        interval,
        currentDate: result,
        computedLinks: computeLinks(Object.values(state.events), result)
      })
    })

    get().updateComputedLinks()
    return result
  },
  setDate: (date: DateTime, isToDate = false) => {
    let result = get().currentDate
    if (!isToDate) {
      date = date.startOf("day")
    } else {
      date = date.endOf("day")
    }
    set((state) => {
      const diff = state.currentDate.DateTo.diff(state.currentDate.DateFrom)
      if (!isToDate) {
        const toDate =  date.plus(diff)
        result = {
          DateFrom: date,
          DateTo: toDate.endOf("day")
        }
      } else {
        const fromDate = date.minus(diff)
        result = {
          DateFrom: fromDate.startOf("day"),
          DateTo: date
        }
      }
      return ({
        currentDate: result,
        computedLinks: computeLinks(Object.values(state.events), result)
      })
    })

    get().updateComputedLinks()
    return result
  },
  setDateAndTime: (date: DateTime) => {
    let result = get().currentDate
    set((state) => {
      const diff = state.currentDate.DateTo.diff(state.currentDate.DateFrom)
      const toDate = date.plus(diff)
      result = {
        DateFrom: date,
        DateTo: toDate
      }
      return ({
        currentDate: result,
        computedLinks: computeLinks(Object.values(state.events), result)
      })
    })

    get().updateComputedLinks()
    return result
  },
  setTimespan: (time: ITimeSpan) => {
    const result = {
      DateFrom: time.DateFrom.startOf("day"),
      DateTo: time.DateTo.endOf("day")
    }

    set((state) => ({
      currentDate: result,
      interval: 'custom',
      computedLinks: computeLinks(Object.values(state.events), result)
    }))

    get().updateComputedLinks()
    return result
  },
  storePositions: () => {
    const { network, data, entities } = get()
    const update = [] as IEntity[]
    if (network) {
      network.storePositions()
      data.nodes.getDataSet().forEach(n => {
        n.fixed = true
        if (n.id == null) {
          return
        }
        const id = n.id
        for (const e of entities[id]) {
          if (e.PosX !== n.x || e.PosY !== n.y) {
            update.push(produce(e, draft => {
              draft.PosX = n.x
              draft.PosY = n.y
            }))
          }
        }
      })
    }

    internalUpdate(true, update, [])
  },
  getEntity: (entityId: string, internalId: string): IEntity | undefined => {
    const existing = get().entities[entityId]
    if (existing == null) {
      return undefined
    }

    return existing.find(x => x.InternalId === internalId)
  },
  getCurrentEntity: (entityId: string, date?: DateTime): IEntity | undefined => {
    const existing = get().entities[entityId]
    if (existing == null) {
      return undefined
    }

    try {
      let found = existing[0]
      date = date ?? get().currentDate.DateFrom
      for (const f of existing) {
        if (f.DateFrom ? f.DateFrom > date : true) {
          break
        }
        found = f
      }

      return found
    } catch (e) {
      console.error(e, existing)
    }

    return undefined
  },
  getEntityHistory: (entityId: string): IEntity[] => {
    return get().entities[entityId]
  },
  addEntity: (...entities: IEntity[]) => {
    internalAdd(true, entities, [], true)
  },
  updateEntity: (...entities: IEntity[]) => {
    internalUpdate(true, entities, [])
  },
  removeEntity: (...entities: IEntity[]) => {
    internalRemove(true, entities, [])
  },
  getLink: (linkId: string, internalId: string): ILink | undefined => {
    const existing = get().links[linkId]
    if (existing == null || existing.length === 0) {
      return undefined
    }

    return existing.find(x => x.InternalId === internalId)
  },
  getCurrentLink: (linkId: string, date?: DateTime): ILink | undefined => {
    const existing = get().links[linkId]
    if (existing == null || existing.length === 0) {
      return undefined
    }

    try {
      date = date ?? get().currentDate.DateFrom
      let found = existing[0]
      for (const f of existing) {
        if (f.DateFrom ? f.DateFrom > date : true) {
          break
        }
        found = f
      }

      return found
    } catch (e) {
      console.error(e, existing)
    }

    return undefined
  },
  getLinkHistory: (linkId: string): ILink[] => {
    return get().links[linkId]
  },
  addLink: (...links: ILink[]) => {
    internalAdd(true, [], links, true)
  },
  updateLink: (...links: ILink[]) => {
    internalUpdate(true, [], links)
  },
  removeLink: (...links: ILink[]) => {
    internalRemove(true, [], links)
  },

  setEvent: (...events: IEvent[]) => {
    set((state) => {
      let minDate = state.minDate
      let maxDate = state.maxDate
      const update = produce(state.events, eventsDraft => {
        events = assignLinks(events, Object.values(state.entities).flat())
        events.forEach(e => {
          const draft = produce(e, eDraft => {
            eDraft.Date = fixDate(e.Date)!
            if (e.Id == null || e.Id === '') {
              eDraft.Id = generateUUID()
            }
          })
          
          if (draft.Date < state.minDate) {
            minDate = draft.Date
          }

          if (draft.Date > state.maxDate) {
            maxDate = draft.Date
          }

          eventsDraft[draft.Id] = draft
        })
      })

      return ({
        dirty: true,
        events: update,
        minDate,
        maxDate
      })
    })

    get().updateComputedLinks()
  },
  removeEvent: (...events: IEvent[]) => {
    set((state) => {
      const update = produce(state.events, draft => {
        events.forEach(e => {
          delete draft[e.Id]
        })
      })

      return ({
        dirty: true,
        events: update
      })
    })

    get().updateComputedLinks()
  },
  setEventFilter: (filter: Record<string, IEventFilter[] | undefined>) => {
    set((state) => ({
      eventFilters: filter
    }))
    get().updateComputedLinks()
  },
  updateComputedLinks: () => {
    const historyMode = useAppStore.getState().historyMode
    set((state) => {
      const filtered = [] as IEvent[]
      Object.values(state.events).forEach(ev => {
        if (state.eventFilters[ev.TypeId] != null) {
          filtered.push(...filterEvents(state.eventFilters[ev.TypeId]!, ev))
        } else {
          filtered.push(ev)
        }
      })
      return ({
        computedLinks: computeLinks(filtered, historyMode ? state.currentDate : undefined)
      })
    })
  },

  selectedEntities: () => get().selectedIds.map(id => get().getCurrentEntity(id)).filter(e => e !== undefined) as IEntity[],
  selectedLinks: () => get().selectedIds.map(id => get().getCurrentLink(id)).filter(l => l !== undefined) as ILink[],
  selectedIds: [],
  setSelected: (selectedIds: string[]) => {
    useAppStore.getState().setSelectedGeoFeature(undefined)

    set((state) => ({
      selectedIds
    }))
  },

  setPhaseEvent: (event: IPhaseEvent) => {
    set((state) => {
      let update = state.phaseEvents.filter(e => e.Id !== event.Id)
      if (event.Description && event.Description.length > 0) {
        const ev = produce(event, draft => {
          draft.Date = fixDate(event.Date)!
        })
        update = [ev, ...update].sort((a, b) => (a.Date.diff(b.Date).milliseconds))
      }

      return ({
        dirty: true,
        phaseEvents: update
      })
    })
  },
  removePhaseEvent: (event: IPhaseEvent) => {
    set((state) => ({
      dirty: true,
      phaseEvents: state.phaseEvents.filter(e => e.Id !== event.Id)
    }))
  },
  setGeoFeature: (feature: IGeoFeature) => {
    set((state) => ({
      geoFeatures: [feature, ...state.geoFeatures.filter(x => x.Id != feature.Id)],
      dirty: true
    }))
  },
  removeGeoFeature(feature: IGeoFeature) {
    set((state) => ({
      geoFeatures: state.geoFeatures.filter(x => x.Id != feature.Id),
      dirty: true
    }))
  },

  save: () => {
    set((state) => ({
      dirty: false
    }))

    const file = {
      Entities: Object.values(get().entities).flat(),
      Links: Object.values(get().links).flat(),
      Events: Object.values(get().events),
      PhaseEvents: Object.values(get().phaseEvents),
      GeoFeatures: Object.values(get().geoFeatures),
      context: get().context
    }

    const json = JSON.stringify(file)
    return json
  },
  open: (json: string) => {
    const parsed = JSON.parse(json) as { Entities: IEntity[], Links: ILink[], PhaseEvents: IPhaseEvent[], Events: IPhaseEvent[] | IEvent[], GeoFeatures: IGeoFeature[], context: string }

    internalAdd(false, parsed.Entities, parsed.Links)

    if (parsed.Events) {
      // Handle old files where phaseEvents was event
      if (parsed.Events.some(e => (e as IPhaseEvent).Description != null)) {
        parsed.PhaseEvents = parsed.Events as IPhaseEvent[]
      } else {
        get().setEvent(...parsed.Events as IEvent[])
      }
    }

    if (parsed.PhaseEvents) {
      parsed.PhaseEvents.forEach(f => {
        get().setPhaseEvent({
          Id: f.Id,
          Description: f.Description,
          Date: f.Date
        })
      })
    }

    if (parsed.GeoFeatures) {
      parsed.GeoFeatures.forEach(f => {
        get().setGeoFeature(f)
      })
    }

    set((state) => ({
      context: parsed.context ? mergeContext(parsed.context, state.context) : state.context
    }))

    useAppStore.getState().setTab('Start')
  },
  setDirty: (isDirty: boolean) => {
    set((state) => ({
      dirty: isDirty
    }))
  },

  context: '',
  setContext: (ctx: string) => {
    set((state) => ({
      context: ctx
    }))
  },

  history: [],
  historyPosition: 0,
  canUndo: false,
  canRedo: false,
  undo: () => {
    if (get().canUndo) {
      const history = get().history[get().historyPosition]
      const nextIdx = get().historyPosition + 1

      switch (history.action) {
        case 'ADD':
          internalRemove(false, history.to.entities, history.to.links)
          break
        case 'UPDATE':
          internalUpdate(false, history.from.entities, history.from.links)
          break
        case 'REMOVE':
          internalAdd(false, history.from.entities, history.from.links)
          break
      }

      set((state) => ({
        canUndo: nextIdx < state.history.length,
        canRedo: true,
        historyPosition: nextIdx
      }))
    }
  },
  redo: () => {
    const history = get().history[get().historyPosition - 1]
    const nextIdx = get().historyPosition - 1

    switch (history.action) {
      case 'ADD':
        internalAdd(false, history.to.entities, history.to.links)
        break
      case 'UPDATE':
        internalUpdate(false, history.to.entities, history.to.links)
        break
      case 'REMOVE':
        internalRemove(false, history.from.entities, history.from.links)
        break
    }

    set((state) => ({
      canRedo: nextIdx > 0,
      canUndo: true,
      historyPosition: nextIdx
    }))
  }
}))

export default useMainStore
