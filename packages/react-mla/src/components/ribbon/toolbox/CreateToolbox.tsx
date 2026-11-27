// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import { type IEntityConfiguration, type ILinkConfiguration } from '../../../interfaces/configuration'
import { type IEntity } from '../../../interfaces/data-models'
import configService from '../../../services/configurationService'
import viewService from '../../../services/viewService'
import useMainStore from '../../../store/main-store'
import useAppStore from '../../../store/app-store'
import Modal from '../../common/Modal'
import EntityCreator from '../../modal/EntityCreator'
import { allows } from '../../modal/link-utils'
import RibbonEntityButton from '../RibbonEntityButton'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import RibbonMenuSection from '../RibbonMenuSection'
import { getId } from '../../../utils/utils'
import { newEntity } from '../../../utils/new-entity'
import Icon from '../../common/Icon'
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

  const [typeToAdd, setTypeToAdd] = useState(undefined as undefined | IEntityConfiguration)
  const [entityToAdd, setEntityToAdd] = useState(undefined as undefined | IEntity)

  const [addValid, setAddValid] = useState(false)

  const linkTool = useAppStore((state) => state.linkTool)
  const setLinkTool = useAppStore((state) => state.setLinkTool)
  const setDrawnLink = useAppStore((state) => state.setDrawnLink)

  function addEntityOnPosition (x: number, y: number, config: IEntityConfiguration) {
    onAddEntity(newEntity(config, { x, y }))
  }

  function addEntityClick(type: IEntityConfiguration) {
    setTypeToAdd(type)
    setEntityToAdd(newEntity(type))
  }

  function onAddEntity (entity?: IEntity) {
    if (entity != null) {
      addEntity(entity)
      window.setTimeout(() => { setSelected([getId(entity)]) }, 100)
    }
    setEntityToAdd(undefined)
    setTypeToAdd(undefined)
  }

  function onAbort () {
    setEntityToAdd(undefined)
    setTypeToAdd(undefined)
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

    {typeToAdd &&
      <Modal mode="save" valid={addValid} show={typeToAdd != null} title={t('create') + ": " + typeToAdd?.Name} onNegative={onAbort} onPositive={() => { onAddEntity(entityToAdd) }} sidebar={
        <div>
          <div className="m:flex m:justify-center">
            <Icon name={viewService.getView(typeToAdd.TypeId).Icon} className="m:text-primary m:relative m:h-16 m:w-16 m:my-2"></Icon>
          </div>
          <p className="m:font-medium">
            {typeToAdd.Name}
          </p>
          <p className="m:m-4">
            {typeToAdd.Description}
          </p>
        </div>
      }>
        {entityToAdd != null && (
          <EntityCreator entity={entityToAdd} validChanged={e => { setAddValid(e) }} onChange={(e) => { setEntityToAdd(e) }} />
        )}
      </Modal>
    }

  </>
  )
}
