// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type IEntityConfiguration, type ILinkConfiguration } from '../../../interfaces/configuration'
import { type IEntity } from '../../../interfaces/data-models'
import configService from '../../../services/configurationService'
import useMainStore from '../../../store/main-store'
import useAppStore from '../../../store/app-store'
import { allows } from '../../modal/link-utils'
import RibbonEntityButton from '../RibbonEntityButton'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import RibbonMenuSection from '../RibbonMenuSection'
import { getId } from '../../../utils/utils'
import { newEntity } from '../../../utils/new-entity'
import { useTranslation } from 'react-i18next'

interface Props {
  show?: boolean
}

export default function CreateToolbox (props: Props) {
  const { t } = useTranslation()
  const config = configService.getConfiguration()

  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const selectedLinks = useMainStore((state) => state.selectedLinks)
  const setSelected = useMainStore((state) => state.setSelected)

  const addEntity = useMainStore((state) => state.addEntity)

  const requestEntity = useAppStore((state) => state.requestEntity)

  const linkTool = useAppStore((state) => state.linkTool)
  const setLinkTool = useAppStore((state) => state.setLinkTool)
  const setDrawnLink = useAppStore((state) => state.setDrawnLink)

  function addEntityOnPosition (x: number, y: number, config: IEntityConfiguration) {
    onAddEntity(newEntity(config, { x, y }))
  }

  // The dialog of the entity is opened by EntityMaker, which is there whatever tab is shown
  function addEntityClick (type: IEntityConfiguration) {
    requestEntity({ typeId: type.TypeId })
  }

  // An entity dropped on the chart is made there at once, and selected, so that its details are filled in in the panel
  function onAddEntity (entity: IEntity) {
    addEntity(entity)
    window.setTimeout(() => { setSelected([getId(entity)]) }, 100)
  }

  function isLinkAvailable (link: ILinkConfiguration) {
    return selectedLinks.length === 0 && selectedEntities.length === 2 && allows(link, selectedEntities[0], selectedEntities[1])
  }

  // The dialog of the relation is opened by LinkMaker, which is there whatever tab is shown
  function makeLink (type: ILinkConfiguration) {
    setDrawnLink({ from: getId(selectedEntities[0]), to: getId(selectedEntities[1]), typeIds: [type.TypeId] })
  }

  // Drawing a relation starts from nothing selected, so that what was selected is not taken for part of it
  function toggleLinkTool () {
    if (!linkTool) {
      setSelected([])
      useMainStore.getState().setSelectedShapeIds([])
    }
    setLinkTool(!linkTool)
  }

  if (props.show === false) {
    return null
  }

  return (<>
    <RibbonMenuSection title={t('create')} >
      <RibbonMenuButtonGroup>
        {config.Domain.EntityTypes.filter(e => e.Internal !== true).map(e => (
          <RibbonEntityButton key={e.TypeId} entity={e} onClick={() => { addEntityClick(e) }} onDrop={(x, y) => { addEntityOnPosition(x, y, e) }}></RibbonEntityButton>
        ))}
      </RibbonMenuButtonGroup>
    </RibbonMenuSection>
    <RibbonMenuDivider />

    <RibbonMenuSection title={t('link')} >
      <RibbonMenuButtonGroup>
        <RibbonMenuIconButton active={linkTool} onClick={toggleLinkTool} label={t('draw link')} title={t('draw link help')} icon="conversion_path"></RibbonMenuIconButton>
        {config.Domain.LinkTypes.map(e => (
          <RibbonMenuIconButton key={e.TypeId} disabled={!isLinkAvailable(e)} onClick={() => { makeLink(e) }} label={e.Name} title={e.Description} icon="add_link"></RibbonMenuIconButton>
        ))}
      </RibbonMenuButtonGroup>
    </RibbonMenuSection>
    <RibbonMenuDivider />

  </>
  )
}
