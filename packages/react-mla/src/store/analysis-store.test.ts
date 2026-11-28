// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import useAnalysisStore, { type AnalysisFile, presetSetup, readPanel } from './analysis-store'
import useMainStore from './main-store'
import { initServices } from '../test-utils/setup'
import { activity, at } from '../test-utils/analysis'

beforeAll(async () => {
  await initServices()
})

beforeEach(() => {
  useAnalysisStore.getState().load(undefined)
  useMainStore.setState({ entities: {}, links: {}, phaseEvents: [], dirty: false })
})

describe('the setup', () => {
  test('starts from the first preset of the configuration', () => {
    const setup = useAnalysisStore.getState().getSetup()
    expect(setup.Preset).toBe('Crime scripting')
    expect(setup.EntityTypeId).toBe('handelse')
    expect(setup.Groups.map(g => [g.Name, g.EntityTypeIds])).toEqual([
      ['Aktörer', ['person', 'organisation']],
      ['Rekvisita', ['fordon', 'konto']],
      ['Platser', ['adress']]
    ])
    expect(setup.NoteRows).toEqual(['Möjliggörande förhållanden', 'Hinder och misstag', 'Ingripandepunkter'])
    expect(setup.EmptyPhaseText).toBe('Kunskapslucka')
  })

  test('without a preset, has one group per type of entity except the activities', async () => {
    await initServices(config => {
      delete (config.TimeAnalysis as { PhaseAnalysis: { Presets?: unknown } }).PhaseAnalysis.Presets
    })
    const setup = presetSetup()
    expect(setup.Preset).toBe('')
    expect(setup.Groups.map(g => g.EntityTypeIds)).toEqual([['person'], ['organisation'], ['fordon'], ['adress'], ['konto']])
    expect(setup.NoteRows).toEqual([])
    await initServices()
  })

  test('becomes the user\'s own when it is changed, and marks the file as changed', () => {
    useAnalysisStore.getState().changeSetup({ NoteRows: ['Beslut'] })
    expect(useAnalysisStore.getState().getSetup().Preset).toBe('')
    expect(useAnalysisStore.getState().getSetup().NoteRows).toEqual(['Beslut'])
    expect(useMainStore.getState().dirty).toBe(true)
  })
})

describe('the project file', () => {
  test('gets nothing when the views have not been used, so that it is the same as before', () => {
    expect(useAnalysisStore.getState().serialize()).toBeUndefined()
    expect((JSON.parse(useMainStore.getState().save()) as { Analysis?: AnalysisFile }).Analysis).toBeUndefined()
  })

  test('keeps the setup, the choice, the notes and the settings', () => {
    const store = useAnalysisStore.getState()
    store.changeSetup({ NoteRows: ['Beslut'] })
    store.setChosen('phase', ['bperson', 'aperson'])
    store.setChosen('timeline', ['aperson'])
    store.setExcluded(['xhandelse'])
    store.setNote('p1', 'Beslut', 'Gripande')
    store.setPhase({ Title: 'Min analys', PhaseWidth: 400 })
    store.setTimeline({ LineText: 'role' })

    const json = useMainStore.getState().save()
    useAnalysisStore.getState().load(undefined)
    useAnalysisStore.getState().load((JSON.parse(json) as { Analysis?: AnalysisFile }).Analysis)

    const loaded = useAnalysisStore.getState()
    expect(loaded.getSetup().NoteRows).toEqual(['Beslut'])
    expect(loaded.phaseChosen).toEqual(['bperson', 'aperson'])
    expect(loaded.timelineChosen).toEqual(['aperson'])
    expect(loaded.excluded).toEqual(['xhandelse'])
    expect(loaded.notes).toEqual({ p1: { Beslut: 'Gripande' } })
    expect(loaded.phase.Title).toBe('Min analys')
    expect(loaded.phase.PhaseWidth).toBe(400)
    expect(loaded.phase.ShowRoles).toBe(true)
    expect(loaded.timeline.LineText).toBe('role')
  })

  test('with parts missing or wrong, gets the defaults for them', () => {
    // As a broken file would have it
    useAnalysisStore.getState().load(JSON.parse('{"Setup":{"Preset":"x"},"Phase":{"Chosen":"not a list"},"Notes":"wrong"}') as AnalysisFile)
    const s = useAnalysisStore.getState()
    expect(s.setup).toBeUndefined()
    expect(s.phaseChosen).toBeNull()
    expect(s.notes).toEqual({})
    expect(s.getSetup().Preset).toBe('Crime scripting')
  })
})

describe('opening a project file', () => {
  test('from before the views still works, and keeps the setup there is', () => {
    useAnalysisStore.getState().setPhase({ Title: 'Pågående' })
    const old = {
      Entities: [activity('a', 'Samtal', at('2024-05-01T10:00'))],
      Links: [],
      Events: [],
      PhaseEvents: [{ Id: 'p1', Description: 'Planering', Date: '2024-05-01T00:00:00.000+02:00' }],
      GeoFeatures: [],
      context: ''
    }
    useMainStore.getState().open(JSON.stringify(old))
    expect(Object.keys(useMainStore.getState().entities)).toEqual(['ahandelse'])
    expect(useMainStore.getState().phaseEvents.map(p => p.Description)).toEqual(['Planering'])
    expect(useAnalysisStore.getState().phase.Title).toBe('Pågående')
  })

  test('of the oldest kind, with the phases among the events, still works', () => {
    const oldest = {
      Entities: [],
      Links: [],
      Events: [{ Id: 'p1', Description: 'Planering', Date: '2024-05-01T00:00:00.000+02:00' }],
      context: ''
    }
    useMainStore.getState().open(JSON.stringify(oldest))
    expect(useMainStore.getState().phaseEvents.map(p => p.Description)).toEqual(['Planering'])
  })

  test('with the views in it, brings them back', () => {
    const file = {
      Entities: [],
      Links: [],
      Analysis: { Phase: { Chosen: ['annaperson'], Settings: { Title: 'Sparad' } }, Notes: { p1: { Ingripandepunkter: 'Larm' } } },
      context: ''
    }
    useMainStore.getState().open(JSON.stringify(file))
    expect(useAnalysisStore.getState().phaseChosen).toEqual(['annaperson'])
    expect(useAnalysisStore.getState().phase.Title).toBe('Sparad')
    expect(useAnalysisStore.getState().notes).toEqual({ p1: { Ingripandepunkter: 'Larm' } })
  })
})

describe('the basis of each view', () => {
  test('is the configuration\'s for the time line until it is changed', () => {
    expect(useAnalysisStore.getState().getTimelineSource()).toEqual({ EntityTypeId: 'handelse', LinkTypeId: 'LT6', LinkPropertyId: 'LT6E1' })
  })

  test('of the phase analysis does not change the time line, and the other way round', () => {
    useAnalysisStore.getState().changeSetup({ LinkTypeId: 'relation', LinkPropertyId: undefined })
    expect(useAnalysisStore.getState().getTimelineSource().LinkTypeId).toBe('LT6')

    useAnalysisStore.getState().setTimeline({ Source: { EntityTypeId: 'handelse' } })
    expect(useAnalysisStore.getState().getTimelineSource().LinkTypeId).toBeUndefined()
    expect(useAnalysisStore.getState().getSetup().LinkTypeId).toBe('relation')
  })

  test('of the time line is kept in the project file', () => {
    useAnalysisStore.getState().setTimeline({ Source: { EntityTypeId: 'handelse', LinkTypeId: 'relation' } })
    const json = useMainStore.getState().save()
    useAnalysisStore.getState().load(undefined)
    useAnalysisStore.getState().load((JSON.parse(json) as { Analysis?: AnalysisFile }).Analysis)
    expect(useAnalysisStore.getState().getTimelineSource()).toEqual({ EntityTypeId: 'handelse', LinkTypeId: 'relation' })
  })
})

describe('whether a panel is open', () => {
  test('is as given until the user has chosen, and then as the user chose on this computer', () => {
    const key = 'mla.analysis.test'
    window.localStorage.removeItem(key)
    expect(readPanel(key, false)).toBe(false)
    expect(readPanel(key, true)).toBe(true)
    window.localStorage.setItem(key, 'true')
    expect(readPanel(key, false)).toBe(true)
    window.localStorage.setItem(key, 'false')
    expect(readPanel(key, true)).toBe(false)
    window.localStorage.removeItem(key)
  })
})

describe('the period of each view', () => {
  test('is kept in the file, and only a day written as yyyy-MM-dd is read', () => {
    useAnalysisStore.getState().load(undefined)
    useAnalysisStore.getState().setTimeline({ From: '2024-05-01', To: '2024-05-03' })
    useAnalysisStore.getState().setPhase({ From: '2024-05-02' })
    const file = JSON.parse(JSON.stringify(useAnalysisStore.getState().serialize())) as AnalysisFile
    useAnalysisStore.getState().load(undefined)
    useAnalysisStore.getState().load(file)
    expect([useAnalysisStore.getState().timeline.From, useAnalysisStore.getState().timeline.To]).toEqual(['2024-05-01', '2024-05-03'])
    expect([useAnalysisStore.getState().phase.From, useAnalysisStore.getState().phase.To]).toEqual(['2024-05-02', undefined])

    useAnalysisStore.getState().load({ Timeline: { Settings: { From: 'igår', To: 42 as unknown as string } } })
    expect([useAnalysisStore.getState().timeline.From, useAnalysisStore.getState().timeline.To]).toEqual([undefined, undefined])
  })
})

describe('the settings panel', () => {
  test('is opened and closed for the view that is shown, not for the other', () => {
    useAnalysisStore.setState({ settingsOpen: { timeline: false, phase: false } })
    useAnalysisStore.getState().open('phase')
    useAnalysisStore.getState().setSettingsOpen(true)
    expect(useAnalysisStore.getState().settingsOpen).toEqual({ timeline: false, phase: true })
    expect(window.localStorage.getItem('mla.analysis.settingsOpen.phase')).toBe('true')
    useAnalysisStore.getState().open('timeline')
    expect(useAnalysisStore.getState().settingsOpen.timeline).toBe(false)
    window.localStorage.removeItem('mla.analysis.settingsOpen.phase')
    useAnalysisStore.getState().close()
  })
})
