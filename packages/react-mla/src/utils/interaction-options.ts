// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

export interface InteractionOptions {
  multiselect: boolean
  selectConnectedEdges: boolean
  navigationButtons: boolean
}


const interactionOptions: Record<string, InteractionOptions> = {
  reset: {
    multiselect: true,
    selectConnectedEdges: false,
    navigationButtons: false
  }
}

export default interactionOptions
