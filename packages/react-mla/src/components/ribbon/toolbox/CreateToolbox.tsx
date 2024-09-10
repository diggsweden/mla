// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useState } from 'react'
import { type IEntityConfiguration, type ILinkConfiguration } from '../../../interfaces/configuration'
import { type IEntity, type ILink } from '../../../interfaces/data-models'
import configService from '../../../services/configurationService'
import viewService from '../../../services/viewService'
import useMainStore from '../../../store/main-store'
import Modal from '../../common/Modal'
import EntityCreator from '../../modal/EntityCreator'
import LinkCreator from '../../modal/LinkCreator'
import RibbonEntityButton from '../RibbonEntityButton'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import RibbonMenuSection from '../RibbonMenuSection'
import { compareWildcard, generateUUID, getId } from '../../../utils/utils'
import Icon from '../../common/Icon'

interface Props {
  show?: boolean
}

export default function CreateToolbox (props: Props) {
  const config = configService.getConfiguration()

  const selectedEntities = useMainStore((state) => state.selectedEntities())
  const selectedLinks = useMainStore((state) => state.selectedLinks())
  const setSelected = useMainStore((state) => state.setSelected)

  const addEntity = useMainStore((state) => state.addEntity)
  const addLink = useMainStore((state) => state.addLink)

  const [typeToAdd, setTypeToAdd] = useState(undefined as undefined | IEntityConfiguration)
  const [entityToAdd, setEntityToAdd] = useState(undefined as undefined | IEntity)

  const [linkTypeToAdd, setLinkTypeToAdd] = useState(undefined as undefined | ILinkConfiguration)
  const [linkToAdd, setLinkToAdd] = useState(undefined as undefined | ILink)

  const [addValid, setAddValid] = useState(false)

  function createEntity (type: IEntityConfiguration): IEntity {
    return {
      Id: generateUUID(),
      InternalId: generateUUID(),
      TypeId: type.TypeId,
      GlobalType: type.GlobalType,
      LabelLong: '',
      LabelShort: '',
      LabelChart: '',
      SourceSystemId: 'Egenskapad',
      Properties: [],
    }
  }

  function createLink (from: IEntity, to: IEntity, type: ILinkConfiguration): ILink {
    return {
      Id: generateUUID(),
      InternalId: generateUUID(),
      TypeId: type.TypeId,
      GlobalType: type.GlobalType,
      LabelLong: '',
      LabelShort: '',
      LabelChart: '',
      SourceSystemId: 'Egenskapad',
      FromEntityId: from.Id,
      FromEntityTypeId: from.TypeId,
      ToEntityId: to.Id,
      ToEntityTypeId: to.TypeId,
      Direction: from.TypeId === to.TypeId ? 'BOTH' : 'TO',
      Properties: []
    }
  }

  function addEntityOnPosition (x: number, y: number, config: IEntityConfiguration) {
    const ent = createEntity(config)
    ent.PosX = x
    ent.PosY = y
    onAddEntity(ent)
  }

  function addEntityClick(type: IEntityConfiguration) {
    setTypeToAdd(type)
    setEntityToAdd(createEntity(type))
  }

  function addLinkClick(entity1: IEntity, entity2: IEntity, config: ILinkConfiguration) {
    setLinkTypeToAdd(config)

    let from = entity1
    let to = entity2;
    if (config.AllowedRelations.some(r => compareWildcard(r.FromEntityTypeId, entity2.TypeId) && compareWildcard(r.ToEntityTypeId, entity1.TypeId))) {
      from = entity2
      to = entity1
    }
    setLinkToAdd(createLink(from, to, config))
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

    setLinkToAdd(undefined)
    setLinkTypeToAdd(undefined)
  }

  function onAddLink () {
    if (linkToAdd != null) {
      addLink(linkToAdd)
      window.setTimeout(() => { setSelected([getId(linkToAdd)]) }, 100)
    }
    setLinkToAdd(undefined)
    setLinkTypeToAdd(undefined)
  }

  function isLinkAvailable (link: ILinkConfiguration) {
    if (selectedLinks.length === 0 && selectedEntities.length === 2) {
      const tf = [selectedEntities[0].TypeId, selectedEntities[1].TypeId]

      const result = (
        link.AllowedRelations.some(r => compareWildcard(r.FromEntityTypeId, tf[0]) && compareWildcard(r.ToEntityTypeId, tf[1])) ||
        link.AllowedRelations.some(r => compareWildcard(r.ToEntityTypeId, tf[0]) && compareWildcard(r.FromEntityTypeId, tf[1]))
      )

      return result
    }
    return false
  }

  if (props.show === false) {
    return null
  }

  return (<>
    <RibbonMenuSection title='Skapa' >
      <RibbonMenuButtonGroup>
        {config.Domain.EntityTypes.filter(e => e.Internal !== true).map(e => (
          <RibbonEntityButton key={e.TypeId} entity={e} onClick={() => { addEntityClick(e) }} onDrop={(x, y) => { addEntityOnPosition(x, y, e) }}></RibbonEntityButton>
        ))}
      </RibbonMenuButtonGroup>
    </RibbonMenuSection>
    <RibbonMenuDivider />

    <RibbonMenuSection title='Länka' >
      <RibbonMenuButtonGroup>
        {config.Domain.LinkTypes.map(e => (
          <RibbonMenuIconButton key={e.TypeId} disabled={!isLinkAvailable(e)} onClick={() => { addLinkClick(selectedEntities[0], selectedEntities[1], e) }} label={e.Name} title={e.Description} icon="add_link"></RibbonMenuIconButton>
        ))}
      </RibbonMenuButtonGroup>
    </RibbonMenuSection>
    <RibbonMenuDivider />

    {typeToAdd &&
      <Modal mode="save" valid={addValid} show={typeToAdd != null} title={'Skapa: ' + typeToAdd?.Name} onNegative={onAbort} onPositive={() => { onAddEntity(entityToAdd) }} sidebar={
        <div>
          <div className="m-flex m-justify-center">
            <Icon name={viewService.getView(typeToAdd.TypeId).Icon} className="m-text-primary m-relative m-h-16 m-w-16 m-my-2"></Icon>
          </div>
          <p className="m-font-medium">
            {typeToAdd.Name}
          </p>
          <p className="m-m-4">
            {typeToAdd.Description}
          </p>
        </div>
      }>
        {entityToAdd != null && (
          <EntityCreator entity={entityToAdd} validChanged={e => { setAddValid(e) }} onChange={(e) => { setEntityToAdd(e) }} />
        )}
      </Modal>
    }

    {linkTypeToAdd &&
      <Modal mode="save" valid={addValid} show={linkTypeToAdd != null} title={'Skapa länk: ' + linkTypeToAdd?.Name} onNegative={onAbort} onPositive={() => { onAddLink() }} sidebar={
        <div>
          <div className="m-flex m-justify-center">
            <Icon name='open_in_full' className="m-text-primary m-relative m-h-16 m-w-16 m-my-2"></Icon>
          </div>
          <p className="m-font-medium">
            {linkTypeToAdd.Name}
          </p>
          <p className="m-m-4">
            {linkTypeToAdd.Description}
          </p>
        </div>
      }>
        {linkToAdd != null && (
          <LinkCreator link={linkToAdd} validChanged={e => { setAddValid(e) }} onChange={(e) => { setLinkToAdd(e) }} />
        )}
      </Modal>
    }
  </>
  )
}
