// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useEffectEvent, useState } from 'react'
import { type IEntityConfiguration, type ILinkConfiguration } from '../../../interfaces/configuration'
import { type IEntity, type ILink } from '../../../interfaces/data-models'
import configService from '../../../services/configurationService'
import viewService from '../../../services/viewService'
import useMainStore from '../../../store/main-store'
import useAppStore from '../../../store/app-store'
import Modal from '../../common/Modal'
import EntityCreator from '../../modal/EntityCreator'
import LinkDialog from '../../modal/LinkDialog'
import { type LinkDirection, allows } from '../../modal/link-utils'
import RibbonEntityButton from '../RibbonEntityButton'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import RibbonMenuSection from '../RibbonMenuSection'
import { generateUUID, getId } from '../../../utils/utils'
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
  const addLink = useMainStore((state) => state.addLink)

  const [typeToAdd, setTypeToAdd] = useState(undefined as undefined | IEntityConfiguration)
  const [entityToAdd, setEntityToAdd] = useState(undefined as undefined | IEntity)

  // The relation being made: between which two entities, in the order the user gave them, of which types, and which way it points
  const [linkToMake, setLinkToMake] = useState<{ first: IEntity, second: IEntity, types: ILinkConfiguration[], direction?: LinkDirection } | undefined>()

  const [addValid, setAddValid] = useState(false)

  const linkTool = useAppStore((state) => state.linkTool)
  const setLinkTool = useAppStore((state) => state.setLinkTool)
  // Two entities that no type of relation can be between
  const [noLinkTypes, setNoLinkTypes] = useState<{ from: IEntity, to: IEntity } | undefined>()

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

  function onAddLink (link: ILink) {
    addLink(link)
    window.setTimeout(() => { setSelected([getId(link)]) }, 100)
    setLinkToMake(undefined)
    // A relation is drawn, so the tool is done. A cancelled one leaves it on, to draw it again
    setLinkTool(false)
  }

  function isLinkAvailable (link: ILinkConfiguration) {
    return selectedLinks.length === 0 && selectedEntities.length === 2 && allows(link, selectedEntities[0], selectedEntities[1])
  }

  // A relation drawn in the chart opens the dialog with the first type it can be, and the others to choose from
  const onDrawn = useEffectEvent((ids: { from: string, to: string }) => {
    useAppStore.getState().setDrawnLink(undefined)
    const entities = useMainStore.getState().entities
    const from = entities[ids.from]?.[0]
    const to = entities[ids.to]?.[0]
    if (from == null || to == null) {
      return
    }
    const types = config.Domain.LinkTypes.filter(l => allows(l, from, to))
    if (types.length === 0) {
      setNoLinkTypes({ from, to })
      return
    }
    // A drawn relation points to the entity it ended on, until the user chooses otherwise
    setLinkToMake({ first: from, second: to, types, direction: 'end' })
  })
  useEffect(() => useAppStore.subscribe((state, previous) => {
    if (state.drawnLink != null && state.drawnLink !== previous.drawnLink) {
      onDrawn(state.drawnLink)
    }
  }), [])

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
          <RibbonMenuIconButton key={e.TypeId} disabled={!isLinkAvailable(e)} onClick={() => { setLinkToMake({ first: selectedEntities[0], second: selectedEntities[1], types: [e] }) }} label={e.Name} title={e.Description} icon="add_link"></RibbonMenuIconButton>
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

    {linkToMake != null &&
      <LinkDialog first={linkToMake.first} second={linkToMake.second} types={linkToMake.types} direction={linkToMake.direction}
        onSave={onAddLink} onCancel={() => { setLinkToMake(undefined) }} />
    }

    {noLinkTypes != null &&
      <Modal mode="ok" show={true} title={t('draw link')} onNegative={() => { setNoLinkTypes(undefined) }} onPositive={() => { setNoLinkTypes(undefined) }}>
        <p className="m:p-6 m:text-left">{t('no link types between', { from: configService.getTypeName(noLinkTypes.from), to: configService.getTypeName(noLinkTypes.to) })}</p>
      </Modal>
    }
  </>
  )
}
