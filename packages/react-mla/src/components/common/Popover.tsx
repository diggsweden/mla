// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'

interface Props {
  show: boolean
  hide: (e: React.MouseEvent) => void
  x?: number
  y?: number
  backgroundClass?: string
  menuClass?: string
  children: ReactNode
}

function Popover (props: Props) {
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const ctxMenu = useRef<HTMLDivElement>(null)

  const { x, y, hide } = { ...props }

  useLayoutEffect(() => {
    if (ctxMenu.current && x != null && y != null) {
      if ((x + ctxMenu.current.clientWidth) > window.innerWidth) {
        setLeft(-ctxMenu.current.clientWidth)
      } else {
        setLeft(0)
      }

      if ((y + ctxMenu.current.clientHeight) > window.innerHeight) {
        setTop(-ctxMenu.current.clientHeight)
      } else {
        setTop(0)
      }
    } else {
      setLeft(0)
      setTop(0)
    }
  }, [ctxMenu, x, y])

  if (!props.show || x == null || y == null) {
    return null
  }

  return (
    <div className={props.backgroundClass + ' m-fixed m-top-0 m-right-0 m-w-screen m-h-screen m-z-40'} onClick={hide} onContextMenu={(e) => { e.preventDefault(); hide(e) }}>
      <div ref={ctxMenu} className="m-absolute m-z-50" style={{ left: x + left, top: y + top }} onClick={(e) => { e.stopPropagation() }}>
        <div className={ props.menuClass + ' m-bg-white border m-border-gray-300 m-rounded-lg m-flex m-flex-col m-text-base m-py-4 m-px-2 m-text-gray-500 m-shadow-lg' }>
          { props.children }
        </div>
      </div>
    </div>
  )
}

export default Popover
