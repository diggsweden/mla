// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { beforeAll, describe, expect, test } from 'vitest'
import i18n from 'i18next'
import type { IQueryIntegration } from '../interfaces/configuration'
import { initServices, person } from '../test-utils/setup'
import { endsOf, neighboursOf, serviceChoices } from './chart-actions'
import type { ILink } from '../interfaces/data-models'

beforeAll(async () => {
  await initServices()
})

const service = (Id: string, EntityTypes: Array<{ TypeId: string, Min: number, Max?: number }>, EntityConfiguration?: 'AND' | 'OR') =>
  ({ Id, Name: Id, Description: '', Parameters: { EntityTypes, EntityConfiguration } }) as unknown as IQueryIntegration

const persons = (n: number) => Array.from({ length: n }, (_, i) => person('p' + i))
const company = person('c', {}, { TypeId: 'organisation' })

// Up to three persons, a person or a company one at a time, and companies
const services = [
  service('engagements', [{ TypeId: 'person', Min: 1, Max: 3 }]),
  service('accounts', [{ TypeId: 'organisation', Min: 1, Max: 1 }, { TypeId: 'person', Min: 1, Max: 1 }], 'OR'),
  service('officers', [{ TypeId: 'organisation', Min: 1 }])
]
const choices = (selected: ReturnType<typeof persons>) => serviceChoices(services, selected, i18n.t.bind(i18n) as never)
  .map(c => [c.service.Id, c.count, c.reason])

describe('the services of the menu', () => {
  test('are those that take a type that is selected, with how many of the selected they are sent', () => {
    expect(choices(persons(1))).toEqual([['engagements', 1, undefined], ['accounts', 1, undefined]])
    expect(choices([...persons(2), company])).toEqual([
      ['engagements', 2, undefined],
      ['accounts', 3, 'One of Bolag or Person at a time'],
      ['officers', 1, undefined]
    ])
  })

  test('that cannot be used say why, by the number of a type they take', () => {
    expect(choices(persons(2))).toContainEqual(['accounts', 2, 'At most 1 Person'])
    expect(choices(persons(4))).toContainEqual(['engagements', 4, 'At most 3 Person'])
  })
})

describe('what is selected from the menu', () => {
  const edges = [
    { id: 'l1', from: 'a', to: 'b' },
    { id: 'l2', from: 'b', to: 'c' },
    { id: 'l3', from: 'a', to: 'd', hidden: true }
  ]

  test('as neighbours is the entities linked to the selected ones, and the relations to them, but not hidden ones', () => {
    expect(neighboursOf(['a'], edges).sort()).toEqual(['a', 'b', 'l1'])
    expect(neighboursOf(['b'], edges).sort()).toEqual(['a', 'b', 'c', 'l1', 'l2'])
  })

  test('as the ends of relations is the entities they are between, once each', () => {
    const link = (from: string, to: string) => ({ FromEntityId: from, FromEntityTypeId: 'person', ToEntityId: to, ToEntityTypeId: 'person' }) as ILink
    expect(endsOf([link('a', 'b'), link('b', 'c')])).toEqual(['aperson', 'bperson', 'cperson'])
  })
})
