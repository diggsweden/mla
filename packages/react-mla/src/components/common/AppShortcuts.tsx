// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import Modal from './Modal'
import Delete from '../modal/Delete'
import useKeyDown from '../../effects/keydown'
import useWorkflowStore from '../../store/workflow-store'
import useMainStore from '../../store/main-store'
import { internalRemove } from '../../store/internal-actions'
import type { IQueryResponse } from '../../services/queryService'
import type { IEntity, ILink } from '../../interfaces/data-models'
import WorkflowProgress from '../modal/WorkflowProgress'
import configService from '../../services/configurationService'

const ContextMenu = lazy(() =>
  import("./ContextMenu").then((module) => ({
    default: module.ContextMenu,
  }))
);

interface Props {
  className?: string
  children: React.ReactNode
}

function AppShortcuts (props: Props) {
  const workflow = useWorkflowStore((state) => state.workflow)
  const showWorkflow = useWorkflowStore((state) => state.showDialog)
  const setShowWorkflow = useWorkflowStore((state) => state.setShowDialog)

  const selectedEntities = useMainStore((state) => state.selectedEntities())
  const selectedLinks = useMainStore((state) => state.selectedLinks())

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
    if (selectedEntities.length > 0 || selectedLinks.length > 0) {
      setDelete(true)
    }
  }

  function performDelete () {
    internalRemove(true, selectedEntities, selectedLinks)

    setDelete(false)
  }

  function copy () {
    const selected: IQueryResponse = {
      Entities: selectedEntities,
      Links: selectedLinks,
      Events: []
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
        let result: { Entities?: IEntity[], Links?: ILink[] } = {}
        try {
          const data = JSON.parse(jsonData)
          if (data?.Entities == null || data?.Links == null) {
            return
          }

          result = data
        } catch (e) {
          console.debug('[paste error]', e)
        }

        if (result.Entities != null) {
          result.Entities.forEach(e => { addEntity(e) })
        }

        if (result.Links != null) {
          result.Links.forEach(e => { addLink(e) })
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
      <Suspense>
        <ContextMenu copy={copy} paste={paste} delete={() => { setDelete(true) }}></ContextMenu>
      </Suspense>
      <Modal mode="accept" show={showDelete} title="Radera objekt" onNegative={() => { setDelete(false) }} onPositive={performDelete}>
        <Delete entities={selectedEntities} links={selectedLinks} />
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
