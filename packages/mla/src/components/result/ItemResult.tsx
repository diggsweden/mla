// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import type { IChartBase, IEntity, ILink } from '../../interfaces/data-models'
import Icon from '../common/Icon'
import configService from '../../services/configurationService'
import { useDrag } from 'react-dnd'
import viewService from '../../services/viewService'
import useMainStore from '../../store/main-store'
import { positionGroup } from '../../utils/vis-data-utils'

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
      return 'Länkad'
    }

    return label
  }

  function getLinkDirectionIcon (link: ILink): JSX.Element | null {
    switch (link.Direction) {
      case 'TO': return <Icon name='arrow_forward' className="text-primary relative h-5 w-5 ml-1 " />
      case 'FROM': return <Icon name='arrow_back' className="text-primary relative h-5 w-5  ml-1 " />
      case 'BOTH': return <Icon name='sync_alt' className="text-primary relative h-5 w-5  ml-1 " />
      case 'NONE': return null
    }
  }
  return (
    <div className={props.className}>
      {item.links.length > 0 && item.links.map(l => (
        <div key={`${props.depth}-${l.Id}`} className="flex flex-nowrap w-full">
          <div className="height-f flex ml-2 mr-1">
            <Icon name={'link'} className="text-primary relative h-5 w-5 " />
            {getLinkDirectionIcon(l)}
          </div>
          <div className='grow truncate text-left text-sm font-semibold leading-5' key={l.Id}>{getLinkLabel(l)}</div>
        </div>
      ))}
      <div className="flex flex-nowrap w-full py-1">
        <div className="height-f flex mx-2 items-center"><Icon name={view.Icon} className="text-primary relative h-5 w-5 " /></div>
        <div className='grow truncate text-left mr-1 text-normal'>
          { getLabel(item.primary) }
        </div>
      </div>
      {item.entities.length > 0 && item.entities.map(subEntity => (
        <InternalResult depth={props.depth + 1} className='ml-4 border-dashed border-l-2 border-gray-300' key={subEntity.primary.Id} item={subEntity}></InternalResult>
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
    <div ref={drag} className={props.className + (isDragging ? ' opacity-50' : ' opacity-100') + ' w-full rounded border-solid border bg-white mb-1 py-1 relative'}>
      {config.Internal !== true && props.onClick != null &&
        <span className='absolute top-4 -right-4 -translate-y-1/2' onClick={() => { add() }}>
          <button className='text-white bg-primary rounded-full text-lg px-2 m-2 h-5 w-5 leading-5 flex justify-center'>+</button>
        </span>
      }
      <InternalResult item={props.item} depth={0}></InternalResult>
    </div>
  )
}

export default ItemResult
