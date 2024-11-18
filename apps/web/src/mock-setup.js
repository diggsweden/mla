// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import HttpRequestMock from 'http-request-mock'

import * as sokPerson from './SvarSokPerson.json'
import * as sokBolagEngagemang from './SvarSokBolagsEngagemang.json'
import * as sokOrganisation from './SvarSokOrganisation.json'
import * as sokKonton from './SvarSokKonton.json'
import * as test from './Testdata.json'

import Graph from 'graphology';
import { complete } from 'graphology-generators/classic';
import { clusters } from 'graphology-generators/random';
import { erdosRenyi } from 'graphology-generators/random';

// Social networks
import { girvanNewman } from 'graphology-generators/random';
// const graph = girvanNewman(Graph, {zOut: 4});

// "real" data
import florentineFamilies from 'graphology-generators/social/florentine-families';
import karateClub from 'graphology-generators/social/karate-club';

function generateUUID() {
  let d = new Date().getTime()
  let d2 = ((performance?.now && (performance.now() * 1000)) || 0)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 1
    if (d > 0) {
      r = (d + r) % 16 | 0
      d = Math.floor(d / 16)
    } else {
      r = (d2 + r) % 16 | 0
      d2 = Math.floor(d2 / 16)
    }

    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function mapGraphToResult(graph) {
  const result = {
    Entities: [],
    Links: []
  }

  graph.forEachNode(n => {
    result.Entities.push({
      Id: n,
      TypeId: "person",
      PosX: graph.getNodeAttribute(n, "x"),
      PosY: graph.getNodeAttribute(n, "y"),
      Properties: [
        {
          TypeId: "personE2",
          Value: graph.getNodeAttribute(n, "label")
        }
      ]
    })
  })

  graph.forEachEdge(e => {
    result.Links.push({
      Id: e,
      TypeId: "relation",
      FromEntityTypeId: "person",
      ToEntityTypeId: "person",
      FromEntityId: graph.source(e),
      ToEntityId: graph.target(e),
      Properties: []
    })
  })

  console.log(result)
  return result
}

export default function setupMockApi() {
  const mocker = HttpRequestMock.setup()

  mocker.post('https://fakeurl.testsystem.se/complete', (requestInfo) => {
    const graph = complete(Graph, 10);
    return mapGraphToResult(graph)
  })

  mocker.post('https://fakeurl.testsystem.se/clusters', (requestInfo) => {
    const graph = clusters(Graph, {
      order: 100,
      size: 1000,
      clusters: 5
    });
    return mapGraphToResult(graph)
  })

  mocker.post('https://fakeurl.testsystem.se/erdos', (requestInfo) => {
    const graph = erdosRenyi(Graph, { order: 10, probability: 0.5 });
    return mapGraphToResult(graph)
  })

  mocker.post('https://fakeurl.testsystem.se/girvanNewman', (requestInfo) => {
    const graph = girvanNewman(Graph, { zOut: 4 });
    return mapGraphToResult(graph)
  })

  mocker.post('https://fakeurl.testsystem.se/florentine', (requestInfo) => {
    const graph = florentineFamilies(Graph);
    return mapGraphToResult(graph)
  })

  mocker.post('https://fakeurl.testsystem.se/karate', (requestInfo) => {
    const graph = karateClub(Graph);
    return mapGraphToResult(graph)
  })

  mocker.post('https://fakeurl.testsystem.se/SokAdress', (requestInfo) => {
    if (requestInfo.body.Shape?.Point != null) {
      return {
        Entities: [{
          Id: generateUUID(),
          TypeId: 'ET4',
          SourceSystemId: 'Navet',
          Coordinates: {
            lat: requestInfo.body.Shape.Point.lat,
            lng: requestInfo.body.Shape.Point.lng
          },
          Properties: [
            {
              TypeId: 'ET4E1',
              Value: 'Mockgatan 1337'
            },
            {
              TypeId: 'ET4E3',
              Value: '413 28'
            },
            {
              TypeId: 'ET4E4',
              Value: 'Göteborg'
            }
          ]
        }],
        Links: []
      }
    }
    const param = requestInfo.body.Form?.Params.find(p => p.TypeId === 'ST1E1')
    if (param?.Value === '191212121212') {
      return sokPerson
    }
    return {
      Entities: [],
      Links: []
    }
  }, { delay: 750 })
  mocker.post('https://fakeurl.testsystem.se/SokPerson', (requestInfo) => {
    const param = requestInfo.body.Form?.Params.find(p => p.TypeId === 'ST1E1')
    if (param?.Value === '191212121212') {
      return sokPerson
    }
    return {
      Entities: [],
      Links: []
    }
  }, { delay: 750 })
  mocker.post('https://fakeurl.testsystem.se/TestData', () => {
    return test
  }, { delay: 750 })
  mocker.post('https://fakeurl.testsystem.se/SokOrganisation', (requestInfo) => {
    const param = requestInfo.body.Form?.Params.find(p => p.TypeId === 'organisationE1')
    if (param?.Value === '165128000162') {
      return sokOrganisation
    }
    return {
      Entities: [],
      Links: []
    }
  }, { delay: 750 })
  mocker.post('https://fakeurl.testsystem.se/SokBolagsEngagemang', (requestInfo) => {
    const param = requestInfo.body?.Entities?.find(e => e.Properties?.find(p => p.TypeId === 'personE1' && p.Value === '191212121212'))
    if (param != null) {
      return sokBolagEngagemang
    }
    return {
      Entities: [],
      Links: []
    }
  }, { delay: 750 })
  mocker.post('https://fakeurl.testsystem.se/SokKonton', (requestInfo) => {
    const param = requestInfo.body?.Entities.find(e => e.Properties?.find(p => p.TypeId === 'personE1' && p.Value === '191212121212'))
    if (param != null) {
      return sokKonton
    }
    return {
      Events: []
    }
  }, { delay: 750 })
}
