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

  if (props.draggable === false) {
    return <button
      type='button'
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.entity.Name}
      className={(isDragging ? 'opacity-50' : 'opacity-100') + ' h-5 m-px inline-flex flex-row flex-nowrap items-center py-0 pl-0.5 pr-1 border border-transparent enabled:hover:bg-blue-100 enabled:hover:border-blue-400 disabled:opacity-50 disaled:cursor-default'}>
      <span className="flex justify-center items-center">
        <span className="leading-4"><Icon color={view.Color} name={view.Icon} className="h-5 w-5" /></span>
      </span>
      <span className="ml-1">{props.entity.Name}</span>
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
      className={(isDragging ? 'opacity-50' : 'opacity-100') + ' h-5 m-px inline-flex flex-row flex-nowrap items-center py-0 pl-0.5 pr-1 border border-transparent enabled:hover:bg-blue-100 enabled:hover:border-blue-400 disabled:opacity-50 disaled:cursor-default'}>
      <span className="flex justify-center items-center">
        <span className="leading-4"><Icon color={view.Color} name={view.Icon} className="h-5 w-5" /></span>
      </span>
      <span className="ml-1">{props.entity.Name}</span>
    </button>
  </>
}

export default RibbonEntityButton
