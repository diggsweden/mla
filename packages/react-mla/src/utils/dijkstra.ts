// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type DataInterfaceEdges } from 'vis-network'

// All edges have the same length, so the shortest path is the one with the fewest edges, found by a breadth first search.
// Returns the ids of the nodes on the path, from toId back to fromId, or an empty list when they are not connected.
export function shortestPath (edges: DataInterfaceEdges, fromId: string, toId: string): string[] {
  const neighbors = new Map<string, string[]>()
  const connect = (a: string, b: string) => {
    neighbors.set(a, [...(neighbors.get(a) ?? []), b])
  }
  edges.forEach(e => {
    if (e.from != null && e.to != null) {
      connect(e.from.toString(), e.to.toString())
      connect(e.to.toString(), e.from.toString())
    }
  })

  const previous = new Map<string, string | undefined>([[fromId, undefined]])
  const queue = [fromId]
  while (queue.length > 0 && !previous.has(toId)) {
    const current = queue.shift()!
    for (const next of neighbors.get(current) ?? []) {
      if (!previous.has(next)) {
        previous.set(next, current)
        queue.push(next)
      }
    }
  }

  const path = [] as string[]
  if (previous.has(toId)) {
    for (let id: string | undefined = toId; id !== undefined; id = previous.get(id)) {
      path.push(id)
    }
  }

  return path
}
