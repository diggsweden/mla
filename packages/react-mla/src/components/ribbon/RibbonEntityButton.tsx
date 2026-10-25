// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type DragEvent, useEffect, useRef, useState } from 'react'
import Icon from '../common/Icon'
import { type IEntityConfiguration } from '../../interfaces/configuration'
import iconService from '../../services/iconService'
import viewService from '../../services/viewService'
import { endEntityDrag, startEntityDrag } from '../../utils/entity-drag'

interface Props {
  entity: IEntityConfiguration
  disabled?: boolean
  draggable?: boolean
  onClick?: () => void
  onDrop?: (x: number, y: number) => void
}

function RibbonEntityButton (props: Props) {
  const view = viewService.getView(props.entity.TypeId)
  const [isDragging, setIsDragging] = useState(false)
  const previewImage = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    async function getToken () {
      const png = await iconService.getPNG(view.Icon, view.Color)
      const image = new Image()
      image.onload = () => { previewImage.current = image }
      image.src = png
    }
    void getToken()
  }, [view])

  function onDragStart (event: DragEvent<HTMLButtonElement>) {
    const image = previewImage.current
    const rect = event.currentTarget.getBoundingClientRect()
    setIsDragging(true)
    startEntityDrag(
      event,
      (position) => {
        if (position != null && props.onDrop) {
          props.onDrop(position.x, position.y)
        }
      },
      image
        // Same placement as react-dnd: the cursor keeps its relative position in the button
        ? { image, x: (event.clientX - rect.left) / rect.width * image.width, y: (event.clientY - rect.top) / rect.height * image.height }
        : undefined
    )
  }

  function onDragEnd () {
    setIsDragging(false)
    endEntityDrag()
  }

  const dragPreview = (isDragging ? 'm:opacity-50' : 'm:opacity-100') + ' m:h-5 m:m-px m:inline-flex m:flex-row m:flex-nowrap m:items-center m:py-0 m:pl-0.5 m:pr-1 m:border m:border-transparent m:enabled:hover:bg-blue-100 m:enabled:hover:border-blue-400 m:disabled:opacity-50 disaled:m-cursor-default'
  if (props.draggable === false) {
    return <button
      type='button'
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.entity.Name}
      className={dragPreview}>
      <span className="m:flex m:justify-center m:items-center">
        <span className="m:leading-4"><Icon color={view.Color} name={view.Icon} className="m:h-5 m:w-5" /></span>
      </span>
      <span className="m:ml-1">{props.entity.Name}</span>
    </button>
  }

  return <button
    type='button'
    draggable
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    disabled={props.disabled}
    onClick={props.onClick}
    title={props.entity.Name}
    className={dragPreview}>
    <span className="m:flex m:justify-center m:items-center">
      <span className="m:leading-4"><Icon color={view.Color} name={view.Icon} className="m:h-5 m:w-5" /></span>
    </span>
    <span className="m:ml-1">{props.entity.Name}</span>
  </button>
}

export default RibbonEntityButton
