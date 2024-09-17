// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import {  type DataInterfaceEdges, type DataInterfaceNodes } from 'vis-network'
import { Dijkstra } from './djikstra';

export function StronglyConnected (nodes: DataInterfaceNodes, edges: DataInterfaceEdges): string[] {
  const result = new Map<string, number>()
  const visited = new Map<string, boolean>()

  nodes.forEach(n1 => {
    nodes.forEach(n2 => {
      const id1 = n1.id!.toString()
      const id2 = n2.id!.toString()
      if (id1 != id2 && !visited.has(id1 + id2)) {
        visited.set(id1+id2, true)
        visited.set(id2+id1, true)
        const path = Dijkstra(nodes, edges, id1, id2)
        path.forEach(r => {
          if (result.has(r)) {
            result.set(r, result.get(r)! + 1)
          } else {
            result.set(r, 0);
          }
        });
      }
    });
  });

  const max = [...result.entries()].reduce(
    (accumulator, element) => {
      return element[1] > accumulator[1] ? element : accumulator;
    },
  );

  const nodeIds = [...result.keys()].filter(x => result.get(x) === max[1])
  if (nodeIds.length == 2) {
    edges.forEach(e => {
      if ((e.from == nodeIds[0] || e.from == nodeIds[1]) &&
        (e.to == nodeIds[0] || e.to == nodeIds[1])) {
        nodeIds.push(e.id!.toString())
      }
    })
  }

  return nodeIds
}
