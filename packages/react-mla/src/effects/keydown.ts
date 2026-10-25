// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type RefObject, useEffect } from 'react'

// Calls the callback when one of the keys is pressed in the element, except when typing in an input
export default function useKeyDown (callback: () => void, ref: RefObject<HTMLElement | null>, keys: string[], requireControl?: boolean) {
  useEffect(() => {
    const element = ref.current
    if (element == null) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const wasAnyKeyPressed = keys.some((key) => event.key === key || event.code === key)
      if (wasAnyKeyPressed && (!requireControl || event.ctrlKey) && (event.target as HTMLElement | null)?.tagName !== 'INPUT') {
        event.preventDefault()
        event.stopPropagation()
        callback()
      }
    }

    element.addEventListener('keydown', onKeyDown)
    return () => {
      element.removeEventListener('keydown', onKeyDown)
    }
  }, [callback, keys, ref, requireControl])
}
