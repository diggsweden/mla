// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { IPropertyConfiguration } from '../interfaces/configuration'
import type { IChartBase } from '../interfaces/data-models'

// The description of a field, shown below it, when it says more than the name of the field does
export function helpOf (name: string, description?: string): string | undefined {
  const text = description?.trim()
  if (!text) return undefined
  const plain = (value: string) => value.toLowerCase().replace(/[^a-zåäöæø0-9]/g, '')
  return plain(text) === plain(name) ? undefined : text
}

type Value = string | number | boolean | undefined | null

// A value as text, as the user knows it: the name of a choice, yes or no, and nothing as empty
export function displayValue (config: IPropertyConfiguration, value: Value, yes: string, no: string): string {
  if (value == null || value === '') return ''
  if (config.FieldType === 'Boolean') return value === true || value === 'true' ? yes : no
  if (config.FieldType === 'Select') return config.FieldOptions?.find(o => o.Value === String(value))?.Name ?? String(value)
  return String(value)
}

const valueOf = (thing: IChartBase, config: IPropertyConfiguration): Value =>
  thing.Properties.find(p => p.TypeId === config.TypeId && (p.GlobalType ?? '') === (config.GlobalType ?? ''))?.Value ??
  thing.Properties.find(p => p.TypeId === config.TypeId)?.Value

// The fields whose values differ between two versions, with the value before and after
export function changesBetween (before: IChartBase, after: IChartBase, configs: IPropertyConfiguration[], yes: string, no: string): Array<{ config: IPropertyConfiguration, before: string, after: string }> {
  return configs
    .map(config => ({ config, before: displayValue(config, valueOf(before, config), yes, no), after: displayValue(config, valueOf(after, config), yes, no) }))
    .filter(c => c.before !== c.after)
}
