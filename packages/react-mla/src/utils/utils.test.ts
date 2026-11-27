// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, test } from 'vitest'
import { filterEntityIntegrations, findId } from './utils'
import type { IQueryIntegration } from '../interfaces/configuration'
import { person } from '../test-utils/setup'

const rules = [{ PropertyTypeId: 'personE1', Regex: '(\\d+)[-]?(\\d+)' }]

describe('findId', () => {
  test('finds the entity with the same value, also when it is written differently', () => {
    const existing = [person('a', { personE1: '19800101-1234' })]
    expect(findId(person('b', { personE1: '198001011234' }), rules, existing)).toBe('a')
  })

  test('does not find an entity when the values differ', () => {
    const existing = [person('a', { personE1: '19800101-1234' })]
    expect(findId(person('b', { personE1: '19900101-1234' }), rules, existing)).toBeUndefined()
  })

  test('does not match two entities that both lack the property', () => {
    const existing = [person('a', { personE2: 'Anna' })]
    expect(findId(person('b', { personE2: 'Bertil' }), rules, existing)).toBeUndefined()
  })

  test('does not match when only one of them has the property', () => {
    const existing = [person('a', { personE1: '' })]
    expect(findId(person('b', {}), rules, existing)).toBeUndefined()
  })
})

describe('a service that takes one type or another', () => {
  // As Konton in the demo: one company or one person
  const accounts: IQueryIntegration = {
    Id: 'accounts', Name: 'Accounts', Description: '',
    Parameters: { EntityConfiguration: 'OR', EntityTypes: [{ TypeId: 'organisation', Min: 1, Max: 1 }, { TypeId: 'person', Min: 1, Max: 1 }] }
  }
  const available = (...types: string[]) => filterEntityIntegrations([accounts], types).length === 1

  test('can be used with one of the types in a number it takes', () => {
    expect(available('person')).toBe(true)
    expect(available('organisation')).toBe(true)
    // Other types are not sent to it, and do not matter
    expect(available('person', 'adress', 'fordon')).toBe(true)
  })

  test('can not be used when a type it takes is selected in a number it does not take, or when more than one of its types is', () => {
    expect(available('person', 'person')).toBe(false)
    expect(available('person', 'person', 'organisation')).toBe(false)
    // Or means exactly one of them
    expect(available('person', 'organisation')).toBe(false)
    expect(available('adress')).toBe(false)
  })
})

