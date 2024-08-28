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
      className={(props.active ? 'border-blue-300 bg-blue-100 ' : 'border-transparent ') + 'min-w-[64px] m-1 mb-2 px-1 bb-1 text-base border enabled:hover:bg-blue-100 enabled:hover:border-blue-400 disabled:opacity-50 disabled:cursor-default'}
      onClick={props.onClick}
      title={props.title}
      disabled={props.disabled}
    >
      <Icon name={props.iconName} color={theme.Icon} className={('relative h-9 w-9 mb-1 m-auto ' + (props.iconClassName ?? ''))}></Icon>
      {props.label}
    </button>
  )
}

export default RibbonMenuButton
