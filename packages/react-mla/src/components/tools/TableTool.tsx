// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useMemo, useState } from 'react'
import configService from '../../services/configurationService'
import { type IBase } from '../../interfaces/data-models'
import Table from '../common/Table'
import Icon from '../common/Icon'
import viewService from '../../services/viewService'
import { useTranslation } from 'react-i18next'

interface Props {
  items: IBase[]
  showExport?: boolean
}

export interface SortConfig {
  property: string
  asc: boolean
}

function TableTool (props: Props) {
  const { t } = useTranslation();

  if (props.items.length === 0) {
    throw new Error("Cannot display without items")
  }

  const [selectedType, setSelectedType] = useState<string>(props.items[0].TypeId)
  const [sortColumn, setSortColumn] = useState(configService.getProperties(props.items[0])[0].propertyConfiguration.TypeId)
  const [sortAsc, setSortDirection] = useState(true)

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

    return newList
  }, [props.items, selectedType, sortAsc, sortColumn])

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
      return config.Properties.map(p => `"${p.Name}"`).join(';')
    }
    function getBody (): string {
      return showList.map(i => {
        return config.Properties.map(p => `"${viewService.getPropertyValue(i, p.TypeId) ?? ''}"`).join(';')
      }).join('\n')
    }
    return `\uFEFF${getHeader()}${'\n'}${getBody()}`
  }

  return <div>
    {Object.keys(types).length > 1 &&
      <section className="m-text-left m-pt-3 m-bg-gray-300">
        <div className="m-pl-1">
          {Object.keys(types).map(t =>
            <button
              key={t}
              className={` ${t === selectedType ? ' m-bg-white m-text-blue-800' : ' m-bg-gray-100 m-border m-border-b-gray-300 m-border-t-gray-50'} m-h-7 m-mx-0.5 m-px-4 m-select-none m-font-medium m-tracking-wider hover:m-bg-white hover:m-border-b-gray-200`}
              type='button'
              onClick={() => { setSelectedType(t) }}>{types[t]}
            </button>)}
        </div>
      </section>
    }
    <section className="m-p-3">
      <Table items={showList} typeId={selectedType} sortFn={setSort} sortConfig={ { property: sortColumn, asc: sortAsc }} />
      <div className="m-flex m-justify-between m-mt-0.5 m-align-top m-text-gray-500 m-text-sm">
        {props.showExport !== false && <button className="bg-gray-200 mt-1.5 px-2 py-1 font-medium text-gray-800" onClick={(e: any) => { exportToCsv(e) }}>
          <Icon name="ios_share" className="m-w-5 m-h-5 m-inline-block m-m-0 -m-mb-1 m-me-1"></Icon>
          {t('export csv')}
        </button>}
        <span>{t('count of', { count: showList.length})}</span>
      </div>
    </section>
  </div >
}

export default TableTool
