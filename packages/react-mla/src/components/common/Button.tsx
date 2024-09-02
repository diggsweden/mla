// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { MouseEventHandler } from "react";

interface Props<T> {
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  dataModalHide?: string
  type?: "primary" | "secondary"
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export function Button<T>(props: Props<T>) {
  switch(props.type) {
    case 'secondary':
      return <button type="button" data-modal-hide={props.dataModalHide} onClick={props.onClick} disabled={props.disabled} className={'m-bg-gray-200 enabled:hover:m-bg-gray-300 focus:m-ring-4 focus:m-ring-gray-300 m-font-medium m-rounded m-px-4 m-py-1 m-mr-2 m-my-2 disabled:m-opacity-50 ' + props.className }>
      { props.children }
    </button>
    case 'primary':
    default:
      return <button type="button" data-modal-hide={props.dataModalHide} onClick={props.onClick} disabled={props.disabled} className={'m-text-white m-bg-primary enabled:hover:m-bg-blue-800 focus:m-ring-4 focus:m-ring-blue-300 m-font-medium m-rounded m-px-4 m-py-1 m-mr-2 m-my-2 disabled:m-opacity-50 ' + props.className }>
        { props.children }
      </button>
  }
}
