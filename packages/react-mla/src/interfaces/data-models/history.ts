// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { DateTime } from "luxon"

interface IHistory {
  DateFrom?: DateTime
  DateTo?: DateTime
}

export type {
  IHistory
}
