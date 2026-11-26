// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, test } from 'vitest'
import { findId } from './utils'
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
