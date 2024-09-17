// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { DateTime } from "luxon"

interface IPhaseEvent {
  Id: string
  Date: DateTime
  Description: string
}

export type {
  IPhaseEvent
}
