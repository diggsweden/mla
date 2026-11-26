// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { describe, expect, test } from 'vitest'
import { getContextValue, mergeContext, setContextValue } from './context'

describe('the context', () => {
  test('a value is read back as it was set', () => {
    const ctx = setContextValue('title:Case 12,fileId:7', 'filename', 'report.json')
    expect(getContextValue(ctx, 'filename')).toBe('report.json')
    expect(getContextValue(ctx, 'title')).toBe('Case 12')
  })

  test('a value can contain colons', () => {
    expect(getContextValue('url:http://x', 'url')).toBe('http://x')
  })

  test('a value with a comma is read back as it was set, and the other values are kept', () => {
    const ctx = setContextValue('title:Case 12,fileId:7', 'filename', 'Report, version 2')
    expect(getContextValue(ctx, 'filename')).toBe('Report, version 2')
    expect(getContextValue(ctx, 'title')).toBe('Case 12')
    expect(getContextValue(ctx, 'fileId')).toBe('7')
    expect(getContextValue(ctx, ' version 2')).toBeUndefined()
  })

  test('a value with a comma survives a merge', () => {
    const ctx = mergeContext(setContextValue('', 'filename', 'a,b'), 'fileId:7')
    expect(getContextValue(ctx, 'filename')).toBe('a,b')
    expect(getContextValue(ctx, 'fileId')).toBe('7')
  })
})
