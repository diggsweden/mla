// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import Icon from '../common/Icon'
import viewService from '../../services/viewService'

interface RibbonMenuButtonProps {
  label: string
  title?: string
  iconName: string
  disabled?: boolean
  active?: boolean
  visible?: boolean
  iconClassName?: string
  onClick: (e: any) => void
  children?: React.ReactNode
}

function RibbonMenuButton (props: RibbonMenuButtonProps) {
  const theme = viewService.getTheme()

  if (props.visible === false) {
    return null
  }

  return (
    <button
      className={(props.active ? 'm-border-blue-300 m-bg-blue-100 ' : 'm-border-transparent ') + 'm-min-w-[64px] m-m-1 m-mb-2 m-px-1 m-bb-1 m-text-base m-border enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 disabled:m-opacity-50 disabled:m-cursor-default'}
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
    >
      <Icon name={props.iconName} color={theme.Icon} className={('m-relative m-h-9 m-w-9 m-mb-1 m-m-auto ' + (props.iconClassName ?? ''))}></Icon>
      {props.label}
    </button>
  )
}

export default RibbonMenuButton
