// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

export interface InteractionOptions {
  multiselect: boolean
  dragView: boolean
  selectConnectedEdges: boolean
  navigationButtons: boolean
}


const interactionOptions: Record<string, InteractionOptions> = {
  reset: {
    multiselect: true,
    // The left button draws the selection rectangle instead, the view is moved with the right button
    dragView: false,
    selectConnectedEdges: false,
    navigationButtons: false
  }
}

export default interactionOptions
