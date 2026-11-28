// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

// A group of rows in the phase analysis, such as Aktörer, Rekvisita or Platser
interface IPhaseGroupConfiguration {
  Name: string
  EntityTypeIds: string[]
}

// A setup that the user can start from, such as Crime scripting. Everything in it can be changed in the view
interface IPhasePresetConfiguration {
  Name: string
  Labels?: {
    // The heading of the phases, such as Akt
    Phase?: string
    // The text of a phase without activities, such as Kunskapslucka
    EmptyPhase?: string
  }
  Groups?: IPhaseGroupConfiguration[]
  // Rows of notes under the activities of each phase, such as Ingripandepunkter
  NoteRows?: string[]
}

// Phases that are added together with Lägg till fas
interface IPhaseTemplateConfiguration {
  Name: string
  Phases: string[]
}

interface IPhaseConfiguration {
  // The type of entity that is an activity
  EntityTypeId: string
  // The type of link from an activity to the ones that take part in it
  LinkTypeId?: string
  // The property of that link that tells the role
  LinkPropertyId?: string
  Presets?: IPhasePresetConfiguration[]
  PhaseTemplates?: IPhaseTemplateConfiguration[]
}

export type {
  IPhaseConfiguration,
  IPhaseGroupConfiguration,
  IPhasePresetConfiguration,
  IPhaseTemplateConfiguration
}
