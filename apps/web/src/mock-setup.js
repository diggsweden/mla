// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

/* eslint-disable @typescript-eslint/no-unused-vars */
import HttpRequestMock from 'http-request-mock'

import * as sokPerson from './SvarSokPerson.json'
import * as sokBolagEngagemang from './SvarSokBolagsEngagemang.json'
import * as sokOrganisation from './SvarSokOrganisation.json'
import * as sokRelationer from './SvarSokRelation.json'
import * as sokKonton from './SvarSokKonton.json'

function generateUUID () {
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

export default function setupMockApi () {
  const mocker = HttpRequestMock.setup()

  mocker.post('https://fakeurl.skatteverket.se/SokAdress', (requestInfo) => {
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
  mocker.post('https://fakeurl.skatteverket.se/SokPerson', (requestInfo) => {
    const param = requestInfo.body.Form?.Params.find(p => p.TypeId === 'ST1E1')
    if (param?.Value === '191212121212') {
      return sokPerson
    }
    return {
      Entities: [],
      Links: []
    }
  }, { delay: 750 })
  mocker.post('https://fakeurl.skatteverket.se/TestData', () => {
    return sokPerson
  }, { delay: 750 })
  mocker.post('https://fakeurl.skatteverket.se/SokOrganisation', (requestInfo) => {
    const param = requestInfo.body.Form?.Params.find(p => p.TypeId === 'ET2E1')
    if (param?.Value === '16550101010101') {
      return sokOrganisation
    }
    return {
      Entities: [],
      Links: []
    }
  }, { delay: 750 })
  mocker.post('https://fakeurl.skatteverket.se/SokBolagsEngagemang', (requestInfo) => {
    const param = requestInfo.body?.Entities?.find(e => e.Properties?.find(p => p.TypeId === 'ET1E1' && p.Value === '1212121212'))
    if (param != null) {
      return sokBolagEngagemang
    }
    return {
      Entities: [],
      Links: []
    }
  }, { delay: 750 })
  mocker.post('https://fakeurl.skatteverket.se/SokRelation', (requestInfo) => {
    const param = (requestInfo.body?.Entities).find(e => e.Properties?.find(p => p.TypeId === 'ET1E1' && p.Value === '1212121212'))
    if (param != null) {
      return sokRelationer
    }
    return {
      Entities: [],
      Links: []
    }
  }, { delay: 750 })
  mocker.post('https://fakeurl.skatteverket.se/SokKonton', (requestInfo) => {
    const param =(requestInfo.body?.Entities).find(e => e.Properties?.find(p => p.TypeId === 'ET1E1' && p.Value === '1212121212'))
    if (param != null) {
      return sokKonton
    }
    return {
      Events: []
    }
  }, { delay: 750 })
}
