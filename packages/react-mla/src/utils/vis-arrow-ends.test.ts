// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, describe, expect, test, vi } from 'vitest'
import { Network } from 'vis-network'
import { alignArrowEnds, drawArrowsWithLines } from './vis-arrow-ends'

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

// Draws two entities that are only their names, with a relation that points to the second, and gives what was drawn, in order:
// a fill is the head of the arrow, a text is a name
async function drawOrder (fix: boolean) {
  const container = document.createElement('div')
  container.style.width = '400px'
  container.style.height = '300px'
  document.body.appendChild(container)
  const drawn: string[] = []
  vi.spyOn(CanvasRenderingContext2D.prototype, 'fill').mockImplementation(() => { drawn.push('arrow') })
  vi.spyOn(CanvasRenderingContext2D.prototype, 'fillText').mockImplementation(() => { drawn.push('name') })

  const network = new Network(container, {
    nodes: [{ id: 1, x: -100, y: 0, shape: 'text', label: 'Anna' }, { id: 2, x: 100, y: 0, shape: 'text', label: 'Bo' }],
    edges: [{ id: 'a', from: 1, to: 2, arrows: 'to' }]
  }, { physics: false, edges: { arrowStrikethrough: false, smooth: false } })
  if (fix) {
    drawArrowsWithLines(network)
  }
  network.redraw()
  await new Promise(resolve => setTimeout(resolve, 50))
  network.destroy()
  return drawn
}

describe('the head of an arrow', () => {
  test('is drawn with its line, under the names of the entities', async () => {
    // Each frame draws the arrow, then the two names
    const drawn = await drawOrder(true)
    expect(drawn.join(',')).toMatch(/^arrow,name,name(,arrow,name,name)*$/)
  })

  test('is drawn over the names by vis-network without the fix', async () => {
    const drawn = await drawOrder(false)
    expect(drawn.join(',')).toMatch(/^name,name,arrow(,name,name,arrow)*$/)
  })
})
