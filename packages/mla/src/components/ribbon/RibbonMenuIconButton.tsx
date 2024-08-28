// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import Icon from '../common/Icon'

interface RibbonMenuIconButtonProps {
  label: string
  title?: string
  icon: string
  disabled?: boolean
  active?: boolean
  onClick?: () => void
  color?: string
  children?: React.ReactNode
  className?: string
}

function RibbonMenuIconButton (props: RibbonMenuIconButtonProps) {
  return <button type='button' disabled={props.disabled} onClick={props.onClick} title={props.title} className={props.className + ' ' + (props.active ? 'border-blue-300 bg-blue-100 ' : 'border-transparent ') + 'h-5 m-px inline-flex flex-row flex-nowrap items-center py-0 px-1 border enabled:hover:bg-blue-100 enabled:hover:border-blue-400 disabled:opacity-50 disabled:cursor-default '}>
    <span className="flex justify-center items-center">
      <span className="h-4 w-4 max-h-4 max-w-4 leading-4"><Icon color={props.color} name={props.icon} className="text-primary flex justify-center items-center h-4 w-4 " /></span>
    </span>
    <span className="ml-1 whitespace-nowrap">{props.label}</span>
  </button>
}

export default RibbonMenuIconButton
