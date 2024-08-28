// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { DateTime } from "luxon"

interface IHistory {
  DateFrom?: DateTime
  DateTo?: DateTime
}

export type {
  IHistory
}
