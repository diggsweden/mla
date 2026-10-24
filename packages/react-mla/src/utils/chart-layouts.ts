// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

export interface ChartLayout {
  randomSeed: number
  hierarchical: false | { direction: string, sortMethod: string, nodeSpacing: number }
}


const chartLayouts: Record<string, ChartLayout> = {
  reset: {
    randomSeed: 1,
    hierarchical: false
  },
  Dynamic: {
    randomSeed: 1,
    hierarchical: false
  },
  UD: {
    randomSeed: 1,
    hierarchical: {
      direction: 'UD',
      sortMethod: 'directed',
      nodeSpacing: 250
    }
  },
  DU: {
    randomSeed: 1,
    hierarchical: {
      direction: 'DU',
      sortMethod: 'directed',
      nodeSpacing: 250
    }
  },
  LR: {
    randomSeed: 1,
    hierarchical: {
      direction: 'LR',
      sortMethod: 'hubsize',
      nodeSpacing: 250
    }
  },
  RL: {
    randomSeed: 1,
    hierarchical: {
      direction: 'RL',
      sortMethod: 'hubsize',
      nodeSpacing: 250
    }
  },
  NAV: {
    randomSeed: 1,
    hierarchical: false
  }

}

export default chartLayouts
