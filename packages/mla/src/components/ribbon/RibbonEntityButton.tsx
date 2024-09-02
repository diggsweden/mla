// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useState } from 'react'
import Icon from '../common/Icon'
import { DragPreviewImage, useDrag } from 'react-dnd'
import { type IEntityConfiguration } from '../../interfaces/configuration'
import iconService from '../../services/iconService'
import viewService from '../../services/viewService'

interface Props {
  entity: IEntityConfiguration
  disabled?: boolean
  draggable?: boolean
  onClick?: () => void
  onDrop?: (x: number, y: number) => void
}

function RibbonEntityButton (props: Props) {
  const view = viewService.getView(props.entity.TypeId)
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'entity',
      end: (item, monitor) => {
        if (monitor.didDrop() && props.onDrop) {
          const dropPosition: { x: number, y: number } = monitor.getDropResult()!
          props.onDrop(dropPosition.x, dropPosition.y)
        }
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    }),
    []
  )
  const [icon, setIcon] = useState('')
  useEffect(() => {
    async function getToken () {
      const png = await iconService.getPNG(view.Icon, view.Color)
      setIcon(png)
    }
    void getToken()
  }, [view])

  const dragPreview = (isDragging ? 'm-opacity-50' : 'm-opacity-100') + ' m-h-5 m-m-px m-inline-flex m-flex-row m-flex-nowrap m-items-center m-py-0 m-pl-0.5 m-pr-1 m-border m-border-transparent enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 disabled:m-opacity-50 disaled:m-cursor-default'
  if (props.draggable === false) {
    return <button
      type='button'
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.entity.Name}
      className={dragPreview}>
      <span className="m-flex m-justify-center m-items-center">
        <span className="m-leading-4"><Icon color={view.Color} name={view.Icon} className="m-h-5 m-w-5" /></span>
      </span>
      <span className="m-ml-1">{props.entity.Name}</span>
    </button>
  }

  return <>
    <DragPreviewImage connect={preview} src={icon} />
    <button
      ref={drag}
      type='button'
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.entity.Name}
      className={dragPreview}>
      <span className="m-flex m-justify-center m-items-center">
        <span className="m-leading-4"><Icon color={view.Color} name={view.Icon} className="m-h-5 m-w-5" /></span>
      </span>
      <span className="m-ml-1">{props.entity.Name}</span>
    </button>
  </>
}

export default RibbonEntityButton
