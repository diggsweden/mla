// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, describe, expect, test, vi } from 'vitest'
import { Network } from 'vis-network'
import { alignArrowEnds } from './vis-arrow-ends'

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

// Draws two entities with a relation that points to the second one, and gives where the line was drawn to in the first frame
async function draw (fix: boolean) {
  const container = document.createElement('div')
  container.style.width = '400px'
  container.style.height = '300px'
  document.body.appendChild(container)
  const ends: number[] = []
  vi.spyOn(CanvasRenderingContext2D.prototype, 'lineTo').mockImplementation((x) => { ends.push(x) })

  const network = new Network(container, {
    nodes: [{ id: 1, x: -100, y: 0, shape: 'dot', size: 10 }, { id: 2, x: 100, y: 0, shape: 'dot', size: 10 }],
    edges: [{ id: 'a', from: 1, to: 2, arrows: 'to' }]
  }, { physics: false, edges: { arrowStrikethrough: false, smooth: false } })
  if (fix) {
    alignArrowEnds(network)
  }
  network.redraw()
  await new Promise(resolve => setTimeout(resolve, 50))
  network.destroy()
  // The line is the first thing that is drawn
  return ends[0]
}

describe('the line of a relation with an arrow', () => {
  test('ends where the arrow starts, also in the first frame after it was changed', async () => {
    // The second entity has its edge at 90, and the arrow is about 18 long
    expect(await draw(true)).toBeLessThan(80)
  })

  test('is drawn into the entity by vis-network without the fix', async () => {
    expect(await draw(false)).toBeGreaterThan(90)
  })
})
