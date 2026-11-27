// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useEffectEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ILinkConfiguration } from '../../interfaces/configuration'
import { type IEntity, type ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import useAppStore, { type LinkRequest } from '../../store/app-store'
import useMainStore from '../../store/main-store'
import { getId } from '../../utils/utils'
import Modal from '../common/Modal'
import LinkDialog from './LinkDialog'
import { type LinkDirection, allows } from './link-utils'

// Makes the relations that are asked for, from the ribbon, the menu of the chart or by drawing one: it opens the dialog
// for the relation, or says that no type of relation can be between the two. It is always there, whatever tab is shown
export default function LinkMaker () {
  const { t } = useTranslation()
  const addLink = useMainStore((state) => state.addLink)
  const setSelected = useMainStore((state) => state.setSelected)
  const setLinkTool = useAppStore((state) => state.setLinkTool)

  // The relation being made: between which two entities, in the order the user gave them, of which types, and which way it points
  const [linkToMake, setLinkToMake] = useState<{ first: IEntity, second: IEntity, types: ILinkConfiguration[], direction?: LinkDirection } | undefined>()
  // Two entities that no type of relation can be between
  const [noLinkTypes, setNoLinkTypes] = useState<{ from: IEntity, to: IEntity } | undefined>()

  const onRequest = useEffectEvent((request: LinkRequest) => {
    useAppStore.getState().setDrawnLink(undefined)
    const entities = useMainStore.getState().entities
    const from = entities[request.from]?.[0]
    const to = entities[request.to]?.[0]
    if (from == null || to == null) {
      return
    }
    const types = configService.getConfiguration().Domain.LinkTypes
      .filter(l => request.typeIds == null || request.typeIds.includes(l.TypeId))
      .filter(l => allows(l, from, to))
    if (types.length === 0) {
      setNoLinkTypes({ from, to })
      return
    }
    // A drawn relation points to the entity it ended on, until the user chooses otherwise
    setLinkToMake({ first: from, second: to, types, direction: request.drawn === true ? 'end' : undefined })
  })
  useEffect(() => useAppStore.subscribe((state, previous) => {
    if (state.drawnLink != null && state.drawnLink !== previous.drawnLink) {
      onRequest(state.drawnLink)
    }
  }), [])

  function onAddLink (link: ILink) {
    addLink(link)
    window.setTimeout(() => { setSelected([getId(link)]) }, 100)
    setLinkToMake(undefined)
    // A relation is drawn, so the tool is done. A cancelled one leaves it on, to draw it again
    setLinkTool(false)
  }

  return (<>
    {linkToMake != null &&
      <LinkDialog first={linkToMake.first} second={linkToMake.second} types={linkToMake.types} direction={linkToMake.direction}
        onSave={onAddLink} onCancel={() => { setLinkToMake(undefined) }} />
    }

    {noLinkTypes != null &&
      <Modal mode="ok" show={true} title={t('draw link')} onNegative={() => { setNoLinkTypes(undefined) }} onPositive={() => { setNoLinkTypes(undefined) }}>
        <p className="m:p-6 m:text-left">{t('no link types between', { from: configService.getTypeName(noLinkTypes.from), to: configService.getTypeName(noLinkTypes.to) })}</p>
      </Modal>
    }
  </>)
}
