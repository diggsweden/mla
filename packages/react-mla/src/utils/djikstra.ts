// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

//  1  function Dijkstra(Graph, source):
//  2
//  3      for each vertex v in Graph.Vertices:
//  4          dist[v] ← INFINITY
//  5          prev[v] ← UNDEFINED
//  6          add v to Q
//  7      dist[source] ← 0
//  8
//  9      while Q is not empty:
// 10          u ← vertex in Q with min dist[u]
// S ← empty sequence
// 2  u ← target
// 3  if prev[u] is defined or u = source:          // Do something only if the vertex is reachable
// 4      while u is defined:                       // Construct the shortest path with a stack S
// 5          insert u at the beginning of S        // Push the vertex onto the stack
// 6          u ← prev[u]

// 11          remove u from Q
// 12
// 13          for each neighbor v of u still in Q:
// 14              alt ← dist[u] + Graph.Edges(u, v)
// 15              if alt < dist[v]:
// 16                  dist[v] ← alt
// 17                  prev[v] ← u
// 18
// 19      return dist[], prev[]

import { type DataInterfaceEdges, type DataInterfaceNodes, type Edge, type Node } from 'vis-network'

// Returns the path as an array of ids for nodes and edges
export function Dijkstra (nodes: DataInterfaceNodes, edges: DataInterfaceEdges, fromId: string, toId: string): string[] {
  const S = [] as string[]
  const dist: Record<string, number> = {}
  const prev: Record<string, Node | undefined> = {}
  let Q = [] as Node[]
  const edge = [] as Edge[]

  edges.getDataSet().forEach(e => edge.push(e))
  nodes.getDataSet().forEach(e => {
    dist[e.id!] = Number.POSITIVE_INFINITY
    prev[e.id!] = undefined
    Q.push(e)
  })
  dist[fromId] = 0

  while (Q.length > 0) {
    const u = Q.reduce((acc, current) => dist[current.id!] < dist[acc.id!] ? current : acc)
    if (u.id === toId) {
      if (prev[u.id] ?? u.id === fromId) {
        let x = u as Node | undefined
        while (x != null) {
          S.push(x.id!.toString())
          x = prev[x.id!]
        }
      }
      break
    }

    Q = Q.filter(x => x.id !== u.id)
    const neighbor = edge.filter(e => e.from === u.id || e.to === u.id).map(e => nodes.get((e.from === u.id ? e.to : e.from)!)!)
    for (const v of neighbor) {
      const alt = dist[u.id!] + 1
      if (alt < dist[v.id]) {
        dist[v.id] = alt
        prev[v.id] = u
      }
    }
  }

  return S
}
