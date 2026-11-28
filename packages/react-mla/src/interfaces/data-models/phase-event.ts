// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { DateTime } from "luxon"

interface IPhaseEvent {
  Id: string
  Date: DateTime
  Description: string
  // The background of the phase, where it is shown. Without it the phase has the color of the theme
  Color?: string
}

export type {
  IPhaseEvent
}
