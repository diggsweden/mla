// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type * as L from 'leaflet'

// leaflet gives every layer an id, it is not part of the public types
export function leafletId (layer: L.Layer): string {
  return (layer as unknown as { _leaflet_id: number })._leaflet_id.toString()
}
