// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

type PluginFunction = (...args: unknown[]) => unknown

// Plugins are scripts loaded by the configuration, they publish functions on window and the configuration refers to them by name
export function getPluginFunction (name: string): PluginFunction {
  const plugin = (window as unknown as Record<string, PluginFunction | undefined>)[name]
  if (typeof plugin !== 'function') {
    throw new Error(`The plugin function "${name}" is not loaded, check Plugins in the configuration`)
  }

  return plugin
}
