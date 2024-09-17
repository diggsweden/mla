// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef, useState } from 'react'
import Icon from '../common/Icon'

interface RibbonMenuDropDownIconButtonProps {
  label: string
  title?: string
  icon: string
  disabled?: boolean
  color?: string
  children?: React.ReactNode
  className?: string
}

function RibbonMenuDropDownIconButton (props: RibbonMenuDropDownIconButtonProps) {
  const [open, setOpen] = useState(false)
  const ctxDropDownMenu = useRef<HTMLDivElement>(null)

  const handleOpen = () => {
    setOpen(!open)
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (!ctxDropDownMenu.current?.parentElement?.contains(e.target as HTMLElement)) {
      setOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  })

  const buttonClass = (open ? 'm-border-blue-300 m-bg-blue-100 ' : 'm-border-transparent ') + 'm-h-5 m-m-px m-inline-flex m-flex-row m-flex-nowrap m-py-0 m-px-1 m-border enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 disabled:m-opacity-50 disabled:m-cursor-default'
  return <div className="m-relative m-text-left m-h-5">
    <button type='button' disabled={props.disabled} onClick={handleOpen} title={props.title} className={props.className + ' ' + buttonClass}>
      <span className="m-flex m-justify-center m-items-center">
        <span className="m-h-4 m-w-4 m-max-h-4 m-max-w-4 m-leading-4"><Icon color={props.color} name={props.icon} className="m-text-primary m-flex m-justify-center m-items-center m-h-4 m-w-4 m-" /></span>
      </span>
      <span className="m-ml-1 m-inline-flex m-flex-row m-flex-nowrap m-whitespace-nowrap">{props.label}<Icon name='outlined_arrow_left' className="m-text-primary m-flex m-justify-center m-items-center m-h-4 m-w-4 -m-rotate-90" /></span>
    </button>
    {open
      ? (
        <div className="m-absolute m-bg-white m-text-sm m-z-50 m-shadow m-border m-border-gray-300" ref={ctxDropDownMenu}>
          { props.children }
        </div>
        )
      : null}
  </div>
}

export default RibbonMenuDropDownIconButton
