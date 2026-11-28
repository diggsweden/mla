// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { create } from 'zustand'
import configService from '../services/configurationService'
import useMainStore from './main-store'

// The analysis views that are shown instead of the chart
export type AnalysisView = 'timeline' | 'phase'
export type LineText = 'title' | 'role' | 'none'

export interface AnalysisGroup {
  Id: string
  Name: string
  EntityTypeIds: string[]
}

// What the views are built on, and how the phase analysis is set up. It starts from a preset of the configuration
export interface AnalysisSetup {
  // The name of the preset it was made from, or '' when the user has changed it
  Preset: string
  EntityTypeId: string
  LinkTypeId?: string
  LinkPropertyId?: string
  Groups: AnalysisGroup[]
  NoteRows: string[]
  PhaseLabel?: string
  EmptyPhaseText?: string
}

// What a view is built on: the type of entity that is an activity, the type of link to the ones that take part, and the property of that link that is the role
export interface AnalysisSource {
  EntityTypeId: string
  LinkTypeId?: string
  LinkPropertyId?: string
}

// The days a view covers, as yyyy-MM-dd. Without them it covers the days of all its activities
export interface Period {
  From?: string
  To?: string
}

export interface TimelineSettings extends Period {
  Title: string
  // The time line's own basis, or the one of the configuration while it has not been changed
  Source?: AnalysisSource
  ShowPhases: boolean
  ShowDate: boolean
  ShowTicks: boolean
  ShowArrows: boolean
  LineText: LineText
  DayWidth: number
  LongLabel: boolean
}

export interface PhaseSettings extends Period {
  Title: string
  DateDiff: boolean
  ShowRoles: boolean
  ShowEmpty: boolean
  PhaseWidth: number
  LongLabel: boolean
}

// What is kept in the project file. Every part is optional, so that a file without it, or with only some of it, can be read
export interface AnalysisFile {
  Setup?: Partial<AnalysisSetup>
  Timeline?: { Chosen?: string[] | null, Excluded?: string[], Settings?: Partial<TimelineSettings> }
  Phase?: { Chosen?: string[] | null, Settings?: Partial<PhaseSettings> }
  // The notes of each phase, by the id of the phase and the name of the row
  Notes?: Record<string, Record<string, string>>
}

const DEFAULT_TIMELINE: TimelineSettings = {
  Title: '',
  ShowPhases: true,
  ShowDate: true,
  ShowTicks: true,
  ShowArrows: true,
  LineText: 'title',
  DayWidth: 170,
  LongLabel: false
}

const DEFAULT_PHASE: PhaseSettings = {
  Title: '',
  DateDiff: false,
  ShowRoles: true,
  ShowEmpty: true,
  PhaseWidth: 300,
  LongLabel: false
}

// The settings are kept per view, so that opening them in one view does not open them in the other
const PANEL_KEYS = { selection: 'mla.analysis.selectionOpen', settings: (view: AnalysisView) => 'mla.analysis.settingsOpen.' + view }

// Whether a panel is open is the user's own choice on this computer, not part of the analysis. Until it is made, the panel is as given
export function readPanel (key: string, open: boolean): boolean {
  try {
    const stored = window.localStorage.getItem(key)
    return stored == null ? open : stored === 'true'
  } catch {
    return open
  }
}

function writePanel (key: string, open: boolean) {
  try {
    window.localStorage.setItem(key, String(open))
  } catch {
    // The choice is then only kept until the page is closed
  }
}

// The period of a view in a file, where only a day written as yyyy-MM-dd is kept
function period (settings?: Partial<Period>): Period {
  const day = (value: unknown) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined)
  return { From: day(settings?.From), To: day(settings?.To) }
}

// The setup of a preset of the configuration, or of the configuration without presets: one group per type of entity
export function presetSetup (presetName?: string): AnalysisSetup {
  const config = configService.getConfiguration()
  const phase = config.TimeAnalysis?.PhaseAnalysis
  const entityTypes = config.Domain.EntityTypes
  const activityTypeId = phase?.EntityTypeId ?? entityTypes[0]?.TypeId ?? ''
  const preset = phase?.Presets?.find(p => p.Name === presetName) ?? (presetName == null ? phase?.Presets?.[0] : undefined)

  const groups = preset?.Groups != null
    ? preset.Groups.map((g, i) => ({ Id: 'g' + (i + 1), Name: g.Name, EntityTypeIds: [...g.EntityTypeIds] }))
    : entityTypes.filter(t => t.TypeId !== activityTypeId && t.Internal !== true).map((t, i) => ({ Id: 'g' + (i + 1), Name: t.Name ?? t.TypeId, EntityTypeIds: [t.TypeId] }))

  return {
    Preset: preset?.Name ?? '',
    EntityTypeId: activityTypeId,
    LinkTypeId: phase?.LinkTypeId,
    LinkPropertyId: phase?.LinkPropertyId,
    Groups: groups,
    NoteRows: [...(preset?.NoteRows ?? [])],
    PhaseLabel: preset?.Labels?.Phase,
    EmptyPhaseText: preset?.Labels?.EmptyPhase
  }
}

interface AnalysisState {
  view?: AnalysisView
  setup?: AnalysisSetup
  // The chosen entities in their order, or null when nothing has been chosen yet: then all that take part are shown
  timelineChosen: string[] | null
  phaseChosen: string[] | null
  // The activities that are left out of the time line
  excluded: string[]
  notes: Record<string, Record<string, string>>
  timeline: TimelineSettings
  phase: PhaseSettings
  selectionOpen: boolean
  settingsOpen: Record<AnalysisView, boolean>

  open: (view: AnalysisView) => void
  close: () => void
  getSetup: () => AnalysisSetup
  getTimelineSource: () => AnalysisSource
  // A change of the setup makes it the user's own
  changeSetup: (patch: Partial<AnalysisSetup>) => void
  applyPreset: (name: string) => void
  setChosen: (view: AnalysisView, keys: string[]) => void
  setExcluded: (keys: string[]) => void
  setNote: (phaseId: string, row: string, text: string) => void
  setTimeline: (patch: Partial<TimelineSettings>) => void
  setPhase: (patch: Partial<PhaseSettings>) => void
  setSelectionOpen: (open: boolean) => void
  // Opens or closes the settings of the view that is shown
  setSettingsOpen: (open: boolean) => void
  serialize: () => AnalysisFile | undefined
  load: (file?: AnalysisFile) => void
}

const markDirty = () => { useMainStore.getState().setDirty(true) }

const useAnalysisStore = create<AnalysisState>((set, get) => ({
  view: undefined,
  setup: undefined,
  timelineChosen: null,
  phaseChosen: null,
  excluded: [],
  notes: {},
  timeline: { ...DEFAULT_TIMELINE },
  phase: { ...DEFAULT_PHASE },
  selectionOpen: readPanel(PANEL_KEYS.selection, true),
  // The settings are set once and the document is read many times, so it gets the room
  settingsOpen: { timeline: readPanel(PANEL_KEYS.settings('timeline'), false), phase: readPanel(PANEL_KEYS.settings('phase'), false) },

  open: (view) => { set({ view }) },
  close: () => { set({ view: undefined }) },
  getSetup: () => get().setup ?? presetSetup(),
  getTimelineSource: () => {
    const source = get().timeline.Source
    if (source != null) {
      return source
    }
    const { EntityTypeId, LinkTypeId, LinkPropertyId } = presetSetup()
    return { EntityTypeId, LinkTypeId, LinkPropertyId }
  },
  changeSetup: (patch) => {
    set({ setup: { ...get().getSetup(), ...patch, Preset: '' } })
    markDirty()
  },
  applyPreset: (name) => {
    set({ setup: presetSetup(name) })
    markDirty()
  },
  setChosen: (view, keys) => {
    set(view === 'timeline' ? { timelineChosen: keys } : { phaseChosen: keys })
    markDirty()
  },
  setExcluded: (keys) => {
    set({ excluded: keys })
    markDirty()
  },
  setNote: (phaseId, row, text) => {
    const notes = get().notes
    set({ notes: { ...notes, [phaseId]: { ...notes[phaseId], [row]: text } } })
    markDirty()
  },
  setTimeline: (patch) => {
    set({ timeline: { ...get().timeline, ...patch } })
    markDirty()
  },
  setPhase: (patch) => {
    set({ phase: { ...get().phase, ...patch } })
    markDirty()
  },
  setSelectionOpen: (open) => {
    writePanel(PANEL_KEYS.selection, open)
    set({ selectionOpen: open })
  },
  setSettingsOpen: (open) => {
    const view = get().view
    if (view == null) return
    writePanel(PANEL_KEYS.settings(view), open)
    set({ settingsOpen: { ...get().settingsOpen, [view]: open } })
  },

  // Nothing is written when the views have not been used, so that such a file is the same as before
  serialize: () => {
    const s = get()
    const untouched = s.setup == null && s.timelineChosen == null && s.phaseChosen == null && s.excluded.length === 0 &&
      Object.keys(s.notes).length === 0 &&
      JSON.stringify(s.timeline) === JSON.stringify(DEFAULT_TIMELINE) && JSON.stringify(s.phase) === JSON.stringify(DEFAULT_PHASE)
    if (untouched) {
      return undefined
    }

    return {
      Setup: s.setup,
      Timeline: { Chosen: s.timelineChosen, Excluded: s.excluded, Settings: s.timeline },
      Phase: { Chosen: s.phaseChosen, Settings: s.phase },
      Notes: s.notes
    }
  },

  // A file from before the views, or one with parts missing or wrong, gets the defaults for what it lacks
  load: (file) => {
    const list = (value: unknown): string[] | null => (Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : null)
    const setup = file?.Setup != null && typeof file.Setup === 'object' && typeof file.Setup.EntityTypeId === 'string'
      ? { ...presetSetup(), ...file.Setup, Groups: Array.isArray(file.Setup.Groups) ? file.Setup.Groups : presetSetup().Groups, NoteRows: list(file.Setup.NoteRows) ?? [] }
      : undefined
    const notes = file?.Notes != null && typeof file.Notes === 'object' ? file.Notes : {}

    set({
      setup,
      timelineChosen: list(file?.Timeline?.Chosen),
      phaseChosen: list(file?.Phase?.Chosen),
      excluded: list(file?.Timeline?.Excluded) ?? [],
      notes,
      timeline: {
        ...DEFAULT_TIMELINE,
        ...(file?.Timeline?.Settings ?? {}),
        Source: typeof file?.Timeline?.Settings?.Source?.EntityTypeId === 'string' ? file.Timeline.Settings.Source : undefined,
        ...period(file?.Timeline?.Settings)
      },
      phase: { ...DEFAULT_PHASE, ...(file?.Phase?.Settings ?? {}), ...period(file?.Phase?.Settings) }
    })
  }
}))

export default useAnalysisStore
