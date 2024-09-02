// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { type ReactNode, useMemo, useRef } from 'react'
import { type IBasePropertyConfiguration } from '../../interfaces/configuration'
import type { IBase, IEvent } from '../../interfaces/data-models'
import { type SortConfig } from '../tools/TableTool'
import viewService from '../../services/viewService'
import { toDateAndTimeString } from '../../utils/date'
import configService from '../../services/configurationService'
import type { IEventFilter } from '../../interfaces/configuration/event-operations'

interface Props {
  typeId: string
  items: IBase[]
  sortConfig: SortConfig
  sortFn: (propertyTypeId: string) => any
  filterFn?: (propertyTypeId: string, value: string | undefined) => any
  filters?: IEventFilter[]
}

function Table (props: Props) {
  const tableTop = useRef<null | HTMLTableElement>(null)
  function sortArrows (property: IBasePropertyConfiguration, sortConfig: SortConfig | undefined): ReactNode {
    return <span className="m-relative m-text-xl m-leading-none">
      <span className={`${property.TypeId === sortConfig?.property && props.sortConfig?.asc ? ' m-text-blue-600' : ''} m-absolute m-right-[-2] m-top-[2px]`}>▴</span>
      <span className={`${property.TypeId === sortConfig?.property && !props.sortConfig?.asc ? ' m-text-blue-600' : ''} m-absolute m-right-[-2] m-top-[10px]`}>▾</span>
    </span>
  }

  function handleSort (p: string) {
    props.sortFn(p)
    tableTop?.current?.scrollIntoView()
  }

  function getFilterValue (typeId: string): string {
    if (props.filters) {
      return props.filters.find(x => x.PropertyTypeId === typeId)?.Filter ?? ''
    }

    return ''
  }

  const properties = useMemo(() => {
    const config = configService.getThingConfiguration(props.typeId)
    return config.Properties
  }, [props.typeId])

  const isEvent = props.items.some(e => (e as IEvent).Date != null)

  return <div className="m-w-full m-max-h-[70vh] m-overflow-y-auto">
    <table ref={tableTop} className="m-w-full m-text-left m-rtl:text-right">
      <thead className="m-sticky m-top-0 m-h-8 m-select-none m-text-gray-900 m-bg-gray-100 m-border m-border-gray-100 m-uppercase">
        <tr>
          {isEvent && <th className="m-cursor-pointer m-pl-1.5 m-text-gray-300 hover:m-text-blue-400">
            <span className="m-text-gray-900">Tid</span>
          </th>
          }
          {properties.map(p =>
            <th key={p.TypeId} aria-sort={p.TypeId === props.sortConfig?.property ? props.sortConfig.asc ? 'ascending' : 'descending' : 'none'} className="m-cursor-pointer m-pl-1.5 m-text-gray-300 hover:m-text-blue-400">
              <div onClick={() => { handleSort(p.TypeId) }}>
                <span className="m-text-gray-900">{p.Name}</span>
                <span>{sortArrows(p, props.sortConfig)}</span>
              </div>
              { props.filterFn &&
                <input type='text' placeholder='filter' className="m-my-1 m-p-1 -m-ms-1 m-text-black" value={getFilterValue(p.TypeId)} onChange={(e) => { props.filterFn!(p.TypeId, e.target.value) }}></input>
              }
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {props.items.map(i =>
          <tr key={i.Id} className="hover:m-bg-gray-50">
            {isEvent && <td className='m-border m-border-gray-200 m-h-10 m-p-1.5'>
              {toDateAndTimeString((i as IEvent).Date)}
            </td>
          }
            {properties.map(p =>
              <td className='m-border m-border-gray-200 m-h-10 m-p-1.5' key={p.TypeId}>{viewService.getPropertyValue(i, p.TypeId)}</td>
            )}
          </tr>
        )}
      </tbody>
    </table>
  </div>
}

export default Table
