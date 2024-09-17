// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

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
  return <button type='button' disabled={props.disabled} onClick={props.onClick} title={props.title} className={props.className + ' ' + (props.active ? 'm-border-blue-300 m-bg-blue-100 ' : 'm-border-transparent ') + 'm-h-5 m-m-px m-inline-flex m-flex-row m-flex-nowrap m-items-center m-py-0 m-px-1 m-border enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 disabled:m-opacity-50 disabled:m-cursor-default '}>
    <span className="m-flex m-justify-center m-items-center">
      <span className="m-h-4 m-w-4 m-max-h-4 m-max-w-4 m-leading-4"><Icon color={props.color} name={props.icon} className="m-text-primary m-flex m-justify-center m-items-center m-h-4 m-w-4 m-" /></span>
    </span>
    <span className="m-ml-1 m-whitespace-nowrap">{props.label}</span>
  </button>
}

export default RibbonMenuIconButton
