// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useRef, useState, useEffect } from 'react'
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

  return <div className='relative text-left h-5'>
    <button type='button' disabled={props.disabled} onClick={handleOpen} title={props.title} className={props.className + ' ' + (open ? 'border-blue-300 bg-blue-100 ' : 'border-transparent ') + 'h-5 m-px inline-flex flex-row flex-nowrap py-0 px-1 border enabled:hover:bg-blue-100 enabled:hover:border-blue-400 disabled:opacity-50 disabled:cursor-default '}>
      <span className="flex justify-center items-center">
        <span className="h-4 w-4 max-h-4 max-w-4 leading-4"><Icon color={props.color} name={props.icon} className="text-primary flex justify-center items-center h-4 w-4 " /></span>
      </span>
      <span className="ml-1 inline-flex flex-row flex-nowrap whitespace-nowrap">{props.label}<Icon name='outlined_arrow_left' className="text-primary flex justify-center items-center h-4 w-4 -rotate-90" /></span>
    </button>
    {open
      ? (
        <div className="absolute bg-white text-sm z-50 shadow border border-gray-300" ref={ctxDropDownMenu}>
          { props.children }
        </div>
        )
      : null}
  </div>
}

export default RibbonMenuDropDownIconButton
