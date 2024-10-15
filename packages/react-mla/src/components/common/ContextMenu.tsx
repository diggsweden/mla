// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useMemo } from 'react'
import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'
import { filterEntityIntegrations, getId } from '../../utils/utils'
import useSearchStore from '../../store/search-state'
import Icon from './Icon'
import configService from '../../services/configurationService'
import Popover from './Popover'
import { useTranslation } from 'react-i18next'

interface Props {
  show?: boolean
  delete?: () => void
  copy?: () => void
  paste?: () => void
}

export default function ContextMenu (props: Props) {
  const { t } = useTranslation() 
  const contextmenuPosition = useAppStore((state) => state.contextmenuPosition)
  const hideContextMenu = useAppStore((state) => state.hideContextMenu)

  const geoFeature = useAppStore((state) => state.selectedGeoFeature)

  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const selectedLinks = useMainStore((state) => state.selectedLinks)
  const entities = useMainStore((state) => state.entities)
  const setSelected = useMainStore((state) => state.setSelected)
  const setExploreTool = useSearchStore((state) => state.setExploreTool)
  const performExplore = useSearchStore((state) => state.explore)

  const tools = useMemo(() => {
    return configService.getSearchServices().filter(t => t.Parameters.EntityTypes != null || t.Parameters.GeoData != null) ?? []
  }, [])

  const availableTools = useMemo(() => {
    if (geoFeature == null) {
      const selectedTypes = selectedEntities.map(e => e.TypeId)
      return filterEntityIntegrations(tools, selectedTypes)
    } else {
      return tools.filter(t => t.Parameters.GeoData != null && geoFeature)
    }
  }, [geoFeature, selectedEntities, tools])

  function explore (toolId: string) {
    setExploreTool(toolId)
    void performExplore()
  }

  function selectGeoFeature () {
    const result = [] as string[]

    if (geoFeature?.Bounds != null) {
      Object.values(entities).forEach(e => {
        const entity = e[0]
        if (entity.Coordinates != null) {
          if (geoFeature.Bounds!.contains(entity.Coordinates)) {
            result.push(getId(entity))
          }
        }
      })
    }
    setSelected(result)
  }

  if (contextmenuPosition === undefined) {
    return null
  }

  function hide (e: React.MouseEvent) {
    hideContextMenu()

    const event = new CustomEvent('contextMenuClick', {
      detail: {
        x: e.clientX,
        y: e.clientY,
        button: e.button
      }
    })

    document.body.dispatchEvent(event)
  }

  return (
    <Popover menuClass='w-60' show={contextmenuPosition != null} x={contextmenuPosition.x} y={contextmenuPosition.y} hide={hide}>
      <>
        {geoFeature?.Point != null && <>
          <span>{geoFeature.Point.lat}, {geoFeature.Point.lng}</span>
          <hr className="m-my-3 m-border-gray-300" />
        </>}
        {availableTools.length > 0 && <>
          <div className="m-flex m-py-1 m-px-2 m-rounded m-cursor-default">
            <span className="m-w-3 m-mr-2"><Icon name="content_paste_search" /></span>
            <div>{t('fetch')}</div>
          </div>
          {availableTools.map(e => (
            <button key={e.Id} className="m-flex hover:m-bg-gray-100 m-py-1 m-px-2 m-rounded m-cursor-pointer" onClick={() => { explore(e.Id); hideContextMenu() }}>
              <div>{e.Name}</div>
            </button>
          ))}
          <hr className="m-my-3 m-border-gray-300" />
        </>}
        {geoFeature?.Bounds && (<>
          <button className="m-flex hover:m-bg-gray-100 m-py-1 m-px-2 m-rounded m-cursor-pointer" onClick={() => { selectGeoFeature(); hideContextMenu() }}>
            <span className="m-w-3 m-mr-2"><Icon name="select_all" /></span>
            <div>{t('select')}</div>
          </button>
          <hr className="m-my-3 m-border-gray-300" />
        </>
        )}
        <button className="m-flex hover:m-bg-gray-100 m-py-1 m-px-2 m-rounded m-cursor-pointer disabled:m-opacity-50" disabled={selectedEntities.length === 0 && selectedLinks.length === 0} onClick={() => { if (props.copy != null) { props.copy(); hideContextMenu() } }}>
          <span className="m-w-3 m-mr-2"><Icon name="content_copy" /></span>
          <div>{t('copy')}</div>
        </button>
        <button className="m-flex hover:m-bg-gray-100 m-py-1 m-px-2 m-rounded m-cursor-pointer" onClick={() => { if (props.paste != null) { props.paste(); hideContextMenu() } }}>
          <span className="m-w-3 m-mr-2"><Icon name="content_paste" /></span>
          <div>{t('paste')}</div>
        </button>
        <button className="m-flex hover:m-bg-gray-100 m-py-1 m-px-2 m-rounded disabled:m-opacity-50 m-cursor-pointer" disabled={selectedEntities.length === 0 && selectedLinks.length === 0} onClick={() => { if (props.delete != null) { props.delete(); hideContextMenu() } }}>
          <span className="m-w-3 m-mr-2"><Icon name="delete_forever" /></span>
          <div>{t('delete')}</div>
        </button>
      </>
    </Popover>
  )
}
