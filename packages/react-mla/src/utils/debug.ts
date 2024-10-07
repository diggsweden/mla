// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type EffectCallback, useEffect, useRef } from 'react'

const usePrevious = (value: any, initialValue: any) => {
  const ref = useRef(initialValue)
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export const useEffectDebugger = (effectHook: EffectCallback, dependencies: React.DependencyList, dependencyNames = []) => {
  const previousDeps = usePrevious(dependencies, [])

  const changedDeps: any = dependencies.reduce((accum: any, dependency, index) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index
      return {
        ...accum,
        [keyName]: {
          before: previousDeps[index],
          after: dependency
        }
      }
    }

    return accum
  }, {})

  if (Object.keys(changedDeps).length) {
    console.debug('[use-effect-debugger] ', changedDeps)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps 
  useEffect(effectHook, dependencies)
}
