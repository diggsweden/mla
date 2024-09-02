// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type RefObject, useEffect } from 'react'

export const useKeyDown = (callback: () => void, ref: RefObject<HTMLElement | null>, keys: string[], requireControl?: boolean) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const wasAnyKeyPressed = keys.some((key) => event.key === key || event.code === key)
      if (wasAnyKeyPressed && (!requireControl || event.ctrlKey) && (event.target as any)?.tagName !== 'INPUT') {
        event.preventDefault()
        event.stopPropagation()
        callback()
      }
    }

    const element = ref.current
    if (element != null) {
      const element = ref.current ?? document
      const ev = (e: any) => { onKeyDown(e as KeyboardEvent) }
      element.addEventListener('keydown', ev)
      return () => {
        element.removeEventListener('keydown', ev)
      }
    }

    return
  }, [callback, keys, ref, requireControl])
}

export default useKeyDown
