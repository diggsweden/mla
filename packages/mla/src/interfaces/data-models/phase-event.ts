// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { DateTime } from "luxon"

interface IPhaseEvent {
  Id: string
  Date: DateTime
  Description: string
}

export type {
  IPhaseEvent
}
