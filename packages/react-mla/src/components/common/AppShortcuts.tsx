// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import Delete from '../modal/Delete'
import useKeyDown from '../../effects/keydown'
import useWorkflowStore from '../../store/workflow-store'
import useMainStore from '../../store/main-store'
import { internalRemove } from '../../store/internal-actions'
import type { IShape } from '../../interfaces/data-models/shape'
import { generateUUID } from '../../utils/utils'
import type { IQueryResponse } from '../../services/queryService'
import type { IEntity, ILink } from '../../interfaces/data-models'
import WorkflowProgress from '../modal/WorkflowProgress'
import configService from '../../services/configurationService'

import ContextMenu from "./ContextMenu"
import { useTranslation } from 'react-i18next'

interface Props {
  className?: string
  children: React.ReactNode
}

function AppShortcuts (props: Props) {
  const { t } = useTranslation()
  const workflow = useWorkflowStore((state) => state.workflow)
  const showWorkflow = useWorkflowStore((state) => state.showDialog)
  const setShowWorkflow = useWorkflowStore((state) => state.setShowDialog)

  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const selectedLinks = useMainStore((state) => state.selectedLinks)

  const shapes = useMainStore((state) => state.shapes)
  const selectedShapeIds = useMainStore((state) => state.selectedShapeIds)
  const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.Id))
  const addShapes = useMainStore((state) => state.addShapes)

  const addEntity = useMainStore((state) => state.addEntity)
  const addLink = useMainStore((state) => state.addLink)

  const undo = useMainStore((state) => state.undo)
  const redo = useMainStore((state) => state.redo)

  const [showDelete, setDelete] = useState(false)
  const dirty = useMainStore((state) => state.dirty)

  useEffect(() => {
    window.onbeforeunload = dirty ? () => true : null;
    return () => {
        window.onbeforeunload = null;
    }
  }, [dirty])

  function onDelete () {
    if (selectedEntities.length > 0 || selectedLinks.length > 0 || selectedShapes.length > 0) {
      setDelete(true)
    }
  }

  function performDelete () {
    internalRemove(true, selectedEntities, selectedLinks, selectedShapes)

    setDelete(false)
  }

  function copy () {
    const selected: IQueryResponse & { Shapes: IShape[] } = {
      Entities: selectedEntities,
      Links: selectedLinks,
      Events: [],
      Shapes: selectedShapes
    }

    const json = JSON.stringify(selected)
    const type = 'text/plain'
    const blob = new Blob([json], { type })
    const data = [new ClipboardItem({ [type]: blob })]

    void navigator.clipboard.write(data)
  }

  function paste () {
    void navigator.clipboard
      .readText()
      .then((jsonData) => {
        let result: { Entities?: IEntity[], Links?: ILink[], Shapes?: IShape[] } = {}
        try {
          const data = JSON.parse(jsonData) as { Entities?: IEntity[], Links?: ILink[], Shapes?: IShape[] } | null
          if ((data?.Entities == null || data?.Links == null) && (data?.Shapes?.length ?? 0) === 0) {
            return
          }

          result = data ?? {}
        } catch (e) {
          console.debug('[paste error]', e)
        }

        if (result.Entities != null) {
          result.Entities.forEach(e => { addEntity(e) })
        }

        if (result.Links != null) {
          result.Links.forEach(e => { addLink(e) })
        }

        // A copy of a shape is a little to the side of it, to be seen
        if (result.Shapes != null && result.Shapes.length > 0) {
          addShapes(...result.Shapes.map(s => ({ ...s, Id: generateUUID(), X: s.X + 24, Y: s.Y + 24 })))
        }
      })
  }

  const appRef = useRef<HTMLDivElement>(null)
  useKeyDown(() => {
    onDelete()
  }, appRef, ['Delete'])

  useKeyDown(() => {
    copy()
  }, appRef, ['KeyC'], true)

  useKeyDown(() => {
    paste()
  }, appRef, ['KeyV'], true)

  useKeyDown(() => {
    undo()
  }, appRef, ['KeyZ'], true)

  useKeyDown(() => {
    redo()
  }, appRef, ['KeyY'], true)

  return (
    <>
      <ContextMenu copy={copy} paste={paste} delete={() => { setDelete(true) }}></ContextMenu>
      <Modal mode="accept" show={showDelete} title={t('delete')} onNegative={() => { setDelete(false) }} onPositive={performDelete}>
        <Delete entities={selectedEntities} links={selectedLinks} shapes={selectedShapes} />
      </Modal>
      {workflow && <Modal mode="ok" show={showWorkflow} title={configService.getWorkflow(workflow).Name} onNegative={() => { setShowWorkflow(false) }}>
        <WorkflowProgress />
      </Modal>
      }
      <div ref={appRef} className={props.className}>
        {props.children}
      </div>
    </>
  )
}

export default AppShortcuts
