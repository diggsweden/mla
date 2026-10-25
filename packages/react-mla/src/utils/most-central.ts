// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type DataInterfaceEdges, type DataInterfaceNodes } from 'vis-network'
import { shortestPath } from './dijkstra'

// Finds the nodes that most of the shortest paths between two nodes go through. When there are two,
// the edge between them is included. Returns an empty list when no nodes are connected.
export function findMostCentral (nodes: DataInterfaceNodes, edges: DataInterfaceEdges): string[] {
  const count = new Map<string, number>()
  const visited = new Set<string>()

  nodes.forEach(n1 => {
    nodes.forEach(n2 => {
      const id1 = n1.id!.toString()
      const id2 = n2.id!.toString()
      if (id1 !== id2 && !visited.has(id1 + id2)) {
        visited.add(id1 + id2)
        visited.add(id2 + id1)
        shortestPath(edges, id1, id2).forEach(id => {
          count.set(id, (count.get(id) ?? 0) + 1)
        })
      }
    })
  })

  const max = Math.max(0, ...count.values())
  const nodeIds = [...count.keys()].filter(id => count.get(id) === max)
  if (nodeIds.length === 2) {
    edges.forEach(e => {
      if (nodeIds.includes(e.from!.toString()) && nodeIds.includes(e.to!.toString())) {
        nodeIds.push(e.id!.toString())
      }
    })
  }

  return nodeIds
}
