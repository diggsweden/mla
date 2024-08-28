// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { DateTime } from 'luxon'
import type { IQueryIntegration, IMatchRule, IEntityTypeConfiguration } from '../interfaces/configuration'
import type { IProperty, IChartBase, IEntity, IHistory, ILink, IBase } from '../interfaces/data-models'

function getId (thing?: IBase): string {
  if (thing) {
    return thing.Id + thing.TypeId
  }

  return ''
}

function generateUUID (): string {
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

function randomNumber (min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function arrayDistinct<T> (a1: T[]): T[] {
  return a1.filter((value, index, array) => array.indexOf(value) === index)
}

function filterEntityIntegrations (integrations: IQueryIntegration[], selectedTypes: string[]): IQueryIntegration[] {
  const configFulfilled = (selectedTypes: string[], config: IEntityTypeConfiguration): boolean => {
    const count = selectedTypes.filter(x => x === config.TypeId).length
    if (count < config.Min) {
      return false
    }

    if (config.Max != null && count > config.Max) {
      return false
    }

    return true
  }

  const isAvailable = (integration: IQueryIntegration, selectedTypes: string[]): boolean => {
    if (integration.Parameters.EntityTypes == null) {
      return false
    }

    if (integration.Parameters.EntityConfiguration === 'OR') {
      return integration.Parameters.EntityTypes.some(c => configFulfilled(selectedTypes, c))
    } else {
      return !(integration.Parameters.EntityTypes.some(c => !configFulfilled(selectedTypes, c)))
    }
  }

  return integrations.filter(t => isAvailable(t, selectedTypes))
}

// Does all elements in a1 exist in a2
function isSubSetOf<T> (a1: T[], a2: T[]): boolean {
  const superSet: Record<string, number> = {}
  for (const i of a2) {
    const e = i + typeof i
    superSet[e] = 1
  }

  for (const i of a1) {
    const e = i + typeof i
    if (!superSet[e]) {
      return false
    }
  }

  return true
}

// Does a1 and a2 contain the same elements, regardless of order
function areArraysEqualSets<T> (a1: T[], a2: T[]): boolean {
  const superSet: Record<string, number> = {}
  for (const i of a1) {
    const e = i + typeof i
    superSet[e] = 1
  }

  for (const i of a2) {
    const e = i + typeof i
    if (!superSet[e]) {
      return false
    }
    superSet[e] = 2
  }

  for (const e in superSet) {
    if (superSet[e] === 1) {
      return false
    }
  }

  return true
}

function isLinked (e: IEntity, l: ILink): boolean {
  return isLinkedId(e.Id, e.TypeId, l)
}

function isLinkedId (id: string, typeId: string, l: ILink): boolean {
  return (id === l.FromEntityId && typeId === l.FromEntityTypeId) ||
        (id === l.ToEntityId && typeId === l.ToEntityTypeId)
}

function compareWildcard (a: string, b: string): boolean {
  return a === b || a === '*' || b === '*'
}

function getContextValue (ctx: string, key: string): string | undefined {
  const ctxname = ctx.split(',').map(c => c.split(':')).find(c => c[0] === key)
  return ctxname ? ctxname[1] : undefined
}

function setContextValue (ctx: string, key: string, value?: string): string {
  const ctxname = ctx.split(',').filter(s => !s.startsWith(key))
  if (value != null) {
    ctxname.push(key + ':' + value)
  }
  return ctxname.join(',')
}

function mergeContext (ctxa: string, ctxb: string): string {
  const update: Record<string, string> = {}

  ctxa.split(',').map(c => c.split(':')).forEach(c => {
    update[c[0]] = c[1]
  })
  ctxb.split(',').map(c => c.split(':')).forEach(c => {
    update[c[0]] = c[1]
  })

  const list = Object.keys(update).map(k => k + ':' + update[k])
  return list.join(',')
}

function findId (thing: IChartBase, config: IMatchRule[], things: IChartBase[]): string | undefined {
  for (const conf of config) {
    for (const test of things.filter(t => t.TypeId === thing.TypeId)) {
      let a = thing.Properties.find(x => x.TypeId === conf.PropertyTypeId)?.Value ?? ''
      let b = test.Properties.find(x => x.TypeId === conf.PropertyTypeId)?.Value ?? ''

      if (conf.Regex != null) {
        const regex = new RegExp(conf.Regex)
        a = getText(a.toString(), regex)
        b = getText(b.toString(), regex)
      }

      if (a === b) {
        return test.Id
      }
    }
  }

  return undefined
}

function getText (str: string, regex: RegExp): string {
  const res = str.match(regex)
  if (res != null && res.length > 0) {
    if (res.length > 1) {
      return res.splice(1).join('')
    } else {
      return res[0]
    }
  }
  return str
}

async function blobToBase64 (blob: Blob): Promise<string> {
  return await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => { resolve(reader.result as string) }
    reader.readAsDataURL(blob)
  })
}

async function canvasToBlob (canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => { blob != null ? resolve(blob) : reject(new Error('Failed to convert canvas')) })
  })
}

async function delay (ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

function compareDates (a: IHistory, b: IHistory): boolean {
  return a.DateFrom == b.DateFrom && a.DateTo == b.DateTo
}

function hasDate (a: IHistory, from?: DateTime, to?: DateTime): boolean {
  return a.DateFrom == from && a.DateTo == to
}

function toDashedCase (camelCase: string): string {
  return camelCase.replace(
    /([a-z0-9])([A-Z])/g,
    (_, a: string, b: string) => `${a}-${b.toLowerCase()}`
  )
}

function toCamelCase (dashedCase: string): string {
  return dashedCase.replace(/[-:]([a-z])/g, (_, b: string) => `${b.toUpperCase()}`)
}

function mergeProps (oldProps: IProperty[], newProps: IProperty[]): IProperty[] {
  const result = [...newProps] as IProperty[]
  oldProps.forEach(p => {
    if (!result.some(o => o.TypeId === p.TypeId)) {
      result.push(p)
    }
  })
  return result
}

function find (thing: IHistory, things: IChartBase[]): IChartBase | undefined {
  return things.find(x => compareDates(x, thing))
}

export {
  areArraysEqualSets,
  arrayDistinct,
  blobToBase64,
  canvasToBlob,
  compareDates,
  compareWildcard,
  delay,
  filterEntityIntegrations,
  find,
  findId,
  generateUUID,
  getContextValue,
  getId,
  hasDate,
  isLinked,
  isLinkedId,
  isSubSetOf,
  mergeContext,
  mergeProps,
  randomNumber,
  setContextValue,
  toCamelCase,
  toDashedCase,
}
