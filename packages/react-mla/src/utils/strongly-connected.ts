// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import {  type DataInterfaceEdges, type DataInterfaceNodes } from 'vis-network'
import { Dijkstra } from './djikstra';

export function StronglyConnected (nodes: DataInterfaceNodes, edges: DataInterfaceEdges): string[] {
  const result = new Map<string, number>()

  nodes.forEach(n1 => {
    nodes.forEach(n2 => {
      if (n1 != n2) {
        const path = Dijkstra(nodes, edges, n1.id!.toString(), n2.id!.toString())
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
    const edgeIds = [] as string[]
    edges.forEach(e => {
      if ((e.from == nodeIds[0] || e.from == nodeIds[1]) &&
        (e.to == nodeIds[0] || e.to == nodeIds[1])) {
        nodeIds.push(e.id!.toString())
      }
    })
  }

  return nodeIds
}
