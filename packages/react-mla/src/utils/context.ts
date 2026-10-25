// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

// The context is a list of key:value pairs separated by commas, for example "title:Case 12,fileId:7".
// The value can contain colons, only the first one separates the key.
function parse (ctx: string): Array<[string, string]> {
  return ctx.split(',')
    .filter(entry => entry !== '')
    .map(entry => {
      const at = entry.indexOf(':')
      return at === -1 ? [entry, ''] : [entry.slice(0, at), entry.slice(at + 1)]
    })
}

function stringify (entries: Array<[string, string]>): string {
  return entries.map(([key, value]) => key + ':' + value).join(',')
}

export function getContextValue (ctx: string, key: string): string | undefined {
  return parse(ctx).find(([k]) => k === key)?.[1]
}

export function setContextValue (ctx: string, key: string, value?: string): string {
  const entries = parse(ctx).filter(([k]) => k !== key)
  if (value != null) {
    entries.push([key, value])
  }
  return stringify(entries)
}

// The values of ctxb replace the ones of ctxa
export function mergeContext (ctxa: string, ctxb: string): string {
  const merged = new Map<string, string>([...parse(ctxa), ...parse(ctxb)])
  return stringify([...merged])
}
