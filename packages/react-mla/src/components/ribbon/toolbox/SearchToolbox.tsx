// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import configService from '../../../services/configurationService'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import { useMemo } from 'react'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import useSearchStore from '../../../store/search-state'
import { filterEntityIntegrations } from '../../../utils/utils'
import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'
import type { IQueryIntegration } from '../../../interfaces/configuration'

interface Props {
  show?: boolean
}

export default function SearchTool (props: Props) {
  const geoFeature = useAppStore((state) => state.selectedGeoFeature)
  const selectedEntities = useMainStore((state) => state.selectedEntities())

  const searchTool = useSearchStore((state) => state.searchTool)
  const exploreTool = useSearchStore((state) => state.exploreTool)

  const setSearchTool = useSearchStore(state => state.setSearchTool)
  const setExploreTool = useSearchStore(state => state.setExploreTool)
  const performExplore = useSearchStore(state => state.explore)

  const [searchToolsAvailable, exploreToolsAvailable] = useMemo(() => {
    return [
      configService.getSearchServices().filter(s => s.Parameters.Form != null)?.length > 0,
      configService.getSearchServices().filter(s => s.Parameters.EntityTypes != null).length > 0
    ]
  }, [])

  const tools = useMemo(() => {
    return configService.getSearchServices().filter(t => t.Parameters.EntityTypes != null)
  }, [])

  const availableTools = useMemo(() => {
    const selectedTypes = selectedEntities.map(e => e.TypeId)
    let toolbox = filterEntityIntegrations(tools, selectedTypes)
    toolbox = [...toolbox, ...tools.filter(t => t.Parameters.GeoData != null && geoFeature)]

    return toolbox
  }, [geoFeature, selectedEntities, tools])

  function explore (id: string) {
    setExploreTool(id)
    void performExplore()
  }

  function getTitle (service: IQueryIntegration): string {
    let text = service.Description

    if (service.Parameters.EntityTypes != null) {
      text += '\nMarkera '
      const params: string[] = []
      service.Parameters.EntityTypes.forEach(e => {
        if (e.Max === e.Min) {
          params.push(`${e.Min} ${configService.getEntityConfiguration(e.TypeId).Name.toLowerCase()}`)
        } else if (e.Max != null) {
          params.push(`${e.Min} till ${e.Max} ${configService.getEntityConfiguration(e.TypeId).Name.toLowerCase()}`)
        } else {
          params.push(`minst ${e.Min} ${configService.getEntityConfiguration(e.TypeId).Name.toLowerCase()}`)
        }
      })
      text += params.join(service.Parameters.EntityConfiguration === 'OR' ? ' eller ' : ' och ')
    }

    if (service.Parameters.GeoData === true) {
      if (service.Parameters.EntityTypes != null) {
        text += ' eller välj Geoposition'
      } else {
        text += '\nVälj plats på kartan'
      }
    }

    if (service.Parameters.EntityTypes != null || service.Parameters.GeoData === true) {
      text += ' för att hämta uppgifterna'
    }

    return text
  }

  return <>
    { props.show !== false && searchToolsAvailable && <>
      <RibbonMenuSection title='Sök' >
        <RibbonMenuButtonGroup>
          { configService.getSearchServices().filter(s => s.Parameters.Form != null).map(e => (
            <RibbonMenuIconButton key={e.Id} label={e.Name} active={searchTool?.Id === e.Id} title={getTitle(e)} icon={e.Icon ?? 'manage_search'} onClick={() => { setSearchTool(e.Id) }}></RibbonMenuIconButton>
          ))}
        </RibbonMenuButtonGroup>
      </RibbonMenuSection>
      <RibbonMenuDivider />
    </>
    }
    { props.show !== false && exploreToolsAvailable && <>
      <RibbonMenuSection title='Hämta' >
        <RibbonMenuButtonGroup>
          { configService.getSearchServices().filter(s => s.Parameters.EntityTypes != null || s.Parameters.GeoData != null).map(e => (
            <RibbonMenuIconButton key={e.Id} label={e.Name} active={exploreTool?.Id === e.Id} title={getTitle(e)} icon={e.Icon ?? 'manage_search'} disabled={!availableTools.some(x => x.Id === e.Id)} onClick={() => { explore(e.Id) }}></RibbonMenuIconButton>
          ))}
        </RibbonMenuButtonGroup>
      </RibbonMenuSection>
      <RibbonMenuDivider />
    </>
    }
  </>
}
