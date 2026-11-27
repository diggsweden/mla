// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { afterEach, describe, expect, test, vi } from 'vitest'
import { Network } from 'vis-network'
import { LABEL_MARGIN, alignLabelBackgrounds } from './vis-label-background'

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

// Draws a node with a label of two lines that is moved up as the chart moves them, and gives where the background and the lines were drawn
async function draw () {
  const container = document.createElement('div')
  container.style.width = '400px'
  container.style.height = '300px'
  document.body.appendChild(container)
  const rects: number[][] = []
  const texts: number[] = []
  vi.spyOn(CanvasRenderingContext2D.prototype, 'fillRect').mockImplementation((x, y, w, h) => { rects.push([x, y, w, h]) })
  vi.spyOn(CanvasRenderingContext2D.prototype, 'fillText').mockImplementation((_text, _x, y) => { texts.push(y) })

  const network = new Network(container, { nodes: [{ id: 1, label: 'Utlandsbetalning\n2025-02-12 16:00', shape: 'dot' }], edges: [] }, {
    physics: false,
    nodes: { font: { multi: 'html', background: 'white', strokeWidth: 0, vadjust: -10 } }
  })
  alignLabelBackgrounds(network)
  network.redraw()
  await new Promise(resolve => setTimeout(resolve, 50))
  network.destroy()
  return { rects, texts }
}

describe('the background of a label', () => {
  test('is where its text is, also when the text is moved up and has more than one line', async () => {
    const { rects, texts } = await draw()
    const [, top, , height] = rects.at(-1)!
    const lines = texts.slice(-2)
    expect(lines).toHaveLength(2)
    // The first line starts at the top of the background, below its margin, and the last one is inside it.
    // Without the fix the background was 10 pixels below the text
    expect(lines[0] - top).toBeGreaterThanOrEqual(LABEL_MARGIN.top)
    expect(lines[0] - top).toBeLessThan(LABEL_MARGIN.top + 2)
    expect(lines[1]).toBeLessThan(top + height)
  })
})
