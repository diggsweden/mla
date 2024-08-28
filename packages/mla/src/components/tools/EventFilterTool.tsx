// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useMemo, useState } from 'react'
import configService from '../../services/configurationService'
import type { IEvent, IBase } from '../../interfaces/data-models'
import Table from '../common/Table'
import Icon from '../common/Icon'
import viewService from '../../services/viewService'
import { toDateAndTimeString } from '../../utils/date'
import useMainStore from '../../store/main-store'
import type { IEventFilter } from '../../interfaces/configuration/event-operations'
import { filterEvents } from '../../utils/event-utils'
import { produce } from 'immer'

interface Props {
  items: IEvent[]
  onChange: (filters: Record<string, IEventFilter[] | undefined>) => void
}

export interface SortConfig {
  property: string
  asc: boolean
}

function EventFilterTool (props: Props) {
  if (props.items.length === 0) {
    throw new Error('No events to filter')
  }

  const [selectedType, setSelectedType] = useState<string>(props.items[0].TypeId)
  const [sortColumn, setSortColumn] = useState(configService.getProperties(props.items[0])[0].propertyConfiguration.TypeId)
  const [sortAsc, setSortDirection] = useState(true)

  const [updatedFilter, setUpdatedFilters] = useState<Record<string, IEventFilter[] | undefined>>(useMainStore.getState().eventFilters)

  const types = useMemo(() => {
    const res: Record<string, string> = {}
    props.items.forEach(e => {
      const config = configService.getThingConfiguration(e.TypeId)
      res[e.TypeId] = config.Name
    })

    return res
  }, [props.items])

  useEffect(() => {
    const config = configService.getThingConfiguration(selectedType)
    setSortColumn(config.Properties[0].TypeId)
    setSortDirection(true)
  }, [props.items, selectedType])

  const showList = useMemo(() => {
    const newList = props.items.filter(e => e.TypeId === selectedType).sort((a: IBase, b: IBase): number => {
      const aValue = a.Properties.find(p => p.TypeId === sortColumn)?.Value?.toString().toLowerCase() ?? ''
      const bValue = b.Properties.find(p => p.TypeId === sortColumn)?.Value?.toString().toLowerCase() ?? ''

      if (aValue === '') return 1
      if (bValue === '') return -1

      if (sortAsc) {
        return bValue > aValue ? 1 : -1
      } else {
        return bValue < aValue ? 1 : -1
      }
    })

    if (updatedFilter[selectedType]) {
      return filterEvents(updatedFilter[selectedType]!, ...newList)
    }

    return newList
  }, [props.items, selectedType, sortAsc, sortColumn, updatedFilter])

  function downloadFile (data: string, fileName: string, fileType: string) {
    const blob = new Blob([data], { type: fileType })
    const a = document.createElement('a')
    a.download = fileName
    a.href = window.URL.createObjectURL(blob)
    const clickEvt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    })
    a.dispatchEvent(clickEvt)
    a.remove()
  }

  function setSort (column: string) {
    if (column === sortColumn) {
      setSortDirection(!sortAsc)
    } else {
      setSortColumn(column)
      setSortDirection(true)
    }
  }

  function setFilter (propertyType: string, filterValue: string | undefined) {
    const update = produce(updatedFilter, draft => {
      if (draft[selectedType] == null) {
        draft[selectedType] = []
      }

      draft[selectedType] = draft[selectedType]!.filter(f => f.PropertyTypeId !== propertyType)
      if (filterValue) {
        draft[selectedType]!.push({ PropertyTypeId: propertyType, Filter: filterValue })
      } else if (draft[selectedType]?.length === 0) {
        draft[selectedType] = undefined
      }
    })

    setUpdatedFilters(update)
    props.onChange(update)
  }

  function exportToCsv (e: MouseEvent) {
    e.preventDefault()

    const config = configService.getThingConfiguration(selectedType)
    const content = getfileContent()
    const fileName = `${config.Name.toLowerCase()}.csv`
    const mime = 'text/csv'
    downloadFile(content, fileName, mime)
  }

  function getfileContent () {
    const config = configService.getThingConfiguration(selectedType)
    function getHeader (): string {
      return ['Datum', ...config.Properties.map(p => `"${p.Name}"`)].join(';')
    }
    function getBody (): string {
      return showList.map(i => {
        return [toDateAndTimeString(i.Date), ...config.Properties.map(p => `"${viewService.getPropertyValue(i, p.TypeId) ?? ''}"`)].join(';')
      }).join('\n')
    }
    return `\uFEFF${getHeader()}${'\n'}${getBody()}`
  }

  return <div>
    {Object.keys(types).length > 1 &&
      <section className="text-left pt-3 bg-gray-300">
        <div className="pl-1">
          {Object.keys(types).map(t =>
            <button
              key={t}
              className={` ${t === selectedType ? ' bg-white text-blue-800' : ' bg-gray-100 border border-b-gray-300 border-t-gray-50'} h-7 mx-0.5 px-4 select-none font-medium tracking-wider hover:bg-white hover:border-b-gray-200`}
              type='button'
              onClick={() => { setSelectedType(t) }}>{types[t]}
            </button>)}
        </div>
      </section>
    }
    <section className="p-3">
      <Table items={showList} typeId={selectedType} sortFn={setSort} filterFn={setFilter} filters={updatedFilter[selectedType]} sortConfig={{ property: sortColumn, asc: sortAsc }} />
      <div className="flex justify-between mt-0.5 align-top text-gray-500 text-sm">
        <button className="bg-gray-200 mt-1.5 px-2 py-1 font-medium text-gray-800" onClick={(e: any) => { exportToCsv(e) }}>
          <Icon name="ios_share" className='w-5 h-5 inline-block m-0 -mb-1 me-1'></Icon>
          Exportera CSV
        </button>
        <span>Antal: {showList.length}</span>
      </div>
    </section>
  </div >
}

export default EventFilterTool
