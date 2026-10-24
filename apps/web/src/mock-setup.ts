// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { delay, http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'

import sokPerson from './SvarSokPerson.json'
import sokBolagEngagemang from './SvarSokBolagsEngagemang.json'
import sokOrganisation from './SvarSokOrganisation.json'
import sokKonton from './SvarSokKonton.json'
import test from './Testdata.json'

interface IRequestProperty {
  TypeId: string
  Value?: unknown
}

interface IRequestBody {
  Shape?: { Point?: { lat: number, lng: number } }
  Form?: { Params?: IRequestProperty[] }
  Entities?: Array<{ Properties?: IRequestProperty[] }>
}

const PERSON_ID = '191212121212'
const ORGANISATION_ID = '165128000162'

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

const noEntities = { Entities: [], Links: [] }

function hasParam (body: IRequestBody, typeId: string, value: string) {
  return body.Form?.Params?.find(p => p.TypeId === typeId)?.Value === value
}

function hasPerson (body: IRequestBody) {
  return body.Entities?.some(e => e.Properties?.some(p => p.TypeId === 'personE1' && p.Value === PERSON_ID)) === true
}

// Every service answers after a short delay, to look like a real backend
function post (name: string, resolve: (body: IRequestBody) => object) {
  return http.post(`https://fakeurl.testsystem.se/${name}`, async ({ request }) => {
    const body = await request.json() as IRequestBody
    await delay(750)
    return HttpResponse.json(resolve(body))
  })
}

export default async function setupMockApi () {
  const worker = setupWorker(
    post('SokAdress', (body) => {
      const point = body.Shape?.Point
      if (point != null) {
        return {
          Entities: [{
            Id: generateUUID(),
            TypeId: 'ET4',
            SourceSystemId: 'Navet',
            Coordinates: {
              lat: point.lat,
              lng: point.lng
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
      return hasParam(body, 'ST1E1', PERSON_ID) ? sokPerson : noEntities
    }),
    post('SokPerson', (body) => hasParam(body, 'ST1E1', PERSON_ID) ? sokPerson : noEntities),
    post('TestData', () => test),
    post('SokOrganisation', (body) => hasParam(body, 'organisationE1', ORGANISATION_ID) ? sokOrganisation : noEntities),
    post('SokBolagsEngagemang', (body) => hasPerson(body) ? sokBolagEngagemang : noEntities),
    post('SokKonton', (body) => hasPerson(body) ? sokKonton : { Events: [] })
  )

  // The worker file is served from the app's base path, and requests to anything else (config, plugins) pass through
  await worker.start({
    serviceWorker: { url: './mockServiceWorker.js' },
    onUnhandledFrame: 'bypass',
    quiet: true
  })
}
