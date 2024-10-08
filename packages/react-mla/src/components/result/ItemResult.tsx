// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { IChartBase, IEntity, ILink } from '../../interfaces/data-models'
import Icon from '../common/Icon'
import configService from '../../services/configurationService'
import { useDrag } from 'react-dnd'
import viewService from '../../services/viewService'
import useMainStore from '../../store/main-store'
import { positionGroup } from '../../utils/vis-data-utils'
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

function InternalResult (props: InternalProps) {
  const { t } = useTranslation() 
  const { item } = props
  const view = viewService.getView(props.item.primary.TypeId)

  function getLabel (thing: IChartBase) {
    if (thing.LabelShort == null || thing.LabelShort === '') {
      return viewService.getShortName(thing)
    } else {
      return thing.LabelShort
    }
  }

  function getLinkLabel (link: ILink) {
    const label = getLabel(link)
    if (label.length === 0) {
      return t('linked')
    }

    return label
  }

  function getLinkDirectionIcon (link: ILink): JSX.Element | null {
    switch (link.Direction) {
      case 'TO': return <Icon name='arrow_forward' className="m-text-primary m-relative m-h-5 m-w-5 m-ml-1 m-" />
      case 'FROM': return <Icon name='arrow_back' className="m-text-primary m-relative m-h-5 m-w-5 m- m-ml-1 m-" />
      case 'BOTH': return <Icon name='sync_alt' className="m-text-primary m-relative m-h-5 m-w-5 m- m-ml-1 m-" />
      case 'NONE': return null
    }
  }
  return (
    <div className={props.className}>
      {item.links.length > 0 && item.links.map(l => (
        <div key={`${props.depth}-${l.Id}`} className="m-flex m-flex-nowrap m-w-full">
          <div className="m-height-f m-flex m-ml-2 m-mr-1">
            <Icon name={'link'} className="m-text-primary m-relative m-h-5 m-w-5 m-" />
            {getLinkDirectionIcon(l)}
          </div>
          <div className="m-grow m-truncate m-text-left m-text-sm m-font-semibold m-leading-5" key={l.Id}>{getLinkLabel(l)}</div>
        </div>
      ))}
      <div className="m-flex m-flex-nowrap m-w-full m-py-1">
        <div className="m-height-f m-flex m-mx-2 m-items-center"><Icon name={view.Icon} className="m-text-primary m-relative m-h-5 m-w-5 m-" /></div>
        <div className="m-grow m-truncate m-text-left m-mr-1 m-text-normal">
          { getLabel(item.primary) }
        </div>
      </div>
      {item.entities.length > 0 && item.entities.map(subEntity => (
        <InternalResult depth={props.depth + 1} className="m-ml-4 m-border-dashed m-border-l-2 m-border-gray-300" key={subEntity.primary.Id} item={subEntity}></InternalResult>
      ))}
    </div>
  )
}

function ItemResult (props: Props) {
  const config = configService.getEntityConfiguration(props.item.primary.TypeId)
  const network = useMainStore(state => state.network)

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'entity',
      end: (item, monitor) => {
        if (monitor.didDrop()) {
          const dropPosition: { x: number, y: number } | null = monitor.getDropResult()
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
        }
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    }),
    []
  )

  function add () {
    props.onClick()
  }

  return (
    <div ref={drag} className={props.className + (isDragging ? ' m-opacity-50' : ' m-opacity-100') + ' m-w-full m-rounded m-border-solid m-border m-bg-white m-mb-1 m-py-1 m-relative'}>
      {config && config.Internal !== true && props.onClick != null &&
        <span className='m-absolute m-top-4 -m-right-4 -m-translate-y-1/2' onClick={() => { add() }}>
          <button className="m-text-white m-bg-primary m-rounded-full m-text-lg m-px-2 m-m-2 m-h-5 m-w-5 m-leading-5 m-flex m-justify-center">+</button>
        </span>
      }
      <InternalResult item={props.item} depth={0}></InternalResult>
    </div>
  )
}

export default ItemResult
