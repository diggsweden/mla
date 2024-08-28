// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useRef, type ReactNode, useMemo } from 'react'
import { type IBasePropertyConfiguration } from '../../interfaces/configuration'
import type { IEvent, IBase } from '../../interfaces/data-models'
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
    return <span className="relative text-xl leading-none">
      <span className={`${property.TypeId === sortConfig?.property && props.sortConfig?.asc ? ' text-blue-600' : ''} absolute right-[-2] top-[2px]`}>▴</span>
      <span className={`${property.TypeId === sortConfig?.property && !props.sortConfig?.asc ? ' text-blue-600' : ''} absolute right-[-2] top-[10px]`}>▾</span>
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

  return <div className="w-full max-h-[70vh] overflow-y-auto">
    <table ref={tableTop} className="w-full text-left rtl:text-right">
      <thead className="sticky top-0 h-8 select-none text-gray-900 bg-gray-100 border border-gray-100 uppercase">
        <tr>
          {isEvent && <th className="cursor-pointer pl-1.5 text-gray-300 hover:text-blue-400">
            <span className="text-gray-900">Tid</span>
          </th>
          }
          {properties.map(p =>
            <th key={p.TypeId} aria-sort={p.TypeId === props.sortConfig?.property ? props.sortConfig.asc ? 'ascending' : 'descending' : 'none'} className="cursor-pointer pl-1.5 text-gray-300 hover:text-blue-400">
              <div onClick={() => { handleSort(p.TypeId) }}>
                <span className="text-gray-900">{p.Name}</span>
                <span>{sortArrows(p, props.sortConfig)}</span>
              </div>
              { props.filterFn &&
                <input type='text' placeholder='filter' className='my-1 p-1 -ms-1 text-black' value={getFilterValue(p.TypeId)} onChange={(e) => { props.filterFn!(p.TypeId, e.target.value) }}></input>
              }
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {props.items.map(i =>
          <tr key={i.Id} className="hover:bg-gray-50">
            {isEvent && <td className='border border-gray-200 h-10 p-1.5'>
              {toDateAndTimeString((i as IEvent).Date)}
            </td>
          }
            {properties.map(p =>
              <td className='border border-gray-200 h-10 p-1.5' key={p.TypeId}>{viewService.getPropertyValue(i, p.TypeId)}</td>
            )}
          </tr>
        )}
      </tbody>
    </table>
  </div>
}

export default Table
