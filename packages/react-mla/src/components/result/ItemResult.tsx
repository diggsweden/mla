// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { IChartBase, IEntity, ILink } from '../../interfaces/data-models'
import { getId } from '../../utils/utils'
import Icon from '../common/Icon'
import configService from '../../services/configurationService'
import { type DragEvent, useState } from 'react'
import viewService from '../../services/viewService'
import useMainStore from '../../store/main-store'
import { positionGroup } from '../../utils/vis-data-utils'
import { endEntityDrag, startEntityDrag } from '../../utils/entity-drag'
import { useTranslation } from 'react-i18next'

interface Props {
  className?: string
  onClick: () => void
  item: IEntityGroup
}

interface InternalProps {
  className?: string
  item: IEntityGroup
  depth: number
}

export interface IEntityGroup {
  primary: IEntity
  entities: IEntityGroup[]
  links: ILink[]
}

function label (thing: IChartBase) {
  return thing.LabelShort == null || thing.LabelShort === '' ? viewService.getShortName(thing) : thing.LabelShort
}

// The icon and the color of an entity, as the chart shows it
function Badge (props: { entity: IEntity, size: number }) {
  const view = viewService.getView(props.entity.TypeId, props.entity.GlobalType)
  return (
    <span className="m:shrink-0 m:rounded-full m:bg-gray-100 m:flex m:items-center m:justify-center" style={{ width: props.size, height: props.size }}>
      <Icon name={view.Icon} color={props.entity.Color ?? view.Color} className="m:h-3.5 m:w-3.5" />
    </span>
  )
}

// What is related to an entity of the result: the label of the link, its direction and the entity, and what is related to that in turn
function Related (props: InternalProps) {
  const { t } = useTranslation()
  const { item } = props
  const link = item.links[0]
  const linkLabel = link != null ? (label(link) || t('linked')) : t('linked')
  const arrow = link?.Direction === 'TO' ? 'arrow_forward' : link?.Direction === 'FROM' ? 'arrow_back' : undefined
  return (
    <div className="m:ml-3.5 m:pl-2.5 m:border-l-2 m:border-gray-200">
      <div className="m:flex m:items-center m:gap-1.5 m:py-0.5 m:min-w-0">
        <span className="m:text-[11px] m:text-gray-600 m:whitespace-nowrap">{linkLabel}</span>
        {arrow && <Icon name={arrow} className="m:h-3.5 m:w-3.5 m:text-gray-500 m:shrink-0" />}
        <Badge entity={item.primary} size={20} />
        <span className="m:text-[12px] m:font-semibold m:truncate">{label(item.primary)}</span>
      </div>
      {item.entities.map(sub => <Related key={getId(sub.primary)} item={sub} depth={props.depth + 1} />)}
    </div>
  )
}

function ItemResult (props: Props) {
  const config = configService.getEntityConfiguration(props.item.primary.TypeId)
  const network = useMainStore(state => state.network)

  const [isDragging, setIsDragging] = useState(false)

  function onDragStart (event: DragEvent<HTMLDivElement>) {
    setIsDragging(true)
    startEntityDrag(event, (dropPosition) => {
      if (dropPosition != null && network != null) {
        const update = positionGroup(props.item.primary, props.item.entities.map(x => x.primary), dropPosition.x, dropPosition.y)
        props.item.primary.PosX = update[0].PosX
        props.item.primary.PosY = update[0].PosY

        for (let i = 1; i < update.length; i++) {
          props.item.entities[i - 1].primary.PosX = update[i].PosX
          props.item.entities[i - 1].primary.PosY = update[i].PosY
        }
      }

      add()
    })
  }

  function onDragEnd () {
    setIsDragging(false)
    endEntityDrag()
  }

  function add () {
    props.onClick()
  }

  const { t } = useTranslation()
  const canAdd = config != null && config.Internal !== true
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} title={t('drag to chart')}
      className={(props.className ?? '') + (isDragging ? ' m:opacity-50' : '') + ' m:flex m:flex-col m:gap-1.5 m:w-full m:box-border m:rounded-md m:border m:border-gray-300 m:bg-white m:p-2 m:cursor-grab'}>
      <div className="m:flex m:items-center m:gap-2 m:min-w-0">
        <Badge entity={props.item.primary} size={26} />
        <span className="m:flex m:flex-col m:min-w-0 m:flex-1">
          <span className="m:text-[13px] m:font-semibold m:truncate">{label(props.item.primary)}</span>
          {/* The link to what it was fetched for, such as a role, after the type */}
          <span className="m:text-[11px] m:text-gray-600 m:truncate">{configService.getTypeName(props.item.primary) + (props.item.links[0] != null ? ' · ' + (label(props.item.links[0]) || t('linked')) : '')}</span>
        </span>
        {canAdd &&
          <button type="button" aria-label={t('add to chart', { name: label(props.item.primary) })} title={t('add to chart', { name: label(props.item.primary) })} onClick={() => { add() }}
            className="m:w-[26px] m:h-[26px] m:shrink-0 m:rounded m:border m:border-blue-300 m:bg-blue-50 m:text-blue-700 m:text-[16px] m:font-semibold m:leading-none m:hover:bg-blue-100 m:cursor-pointer">+</button>
        }
      </div>
      {props.item.entities.map(sub => <Related key={getId(sub.primary)} item={sub} depth={1} />)}
    </div>
  )
}

export default ItemResult
