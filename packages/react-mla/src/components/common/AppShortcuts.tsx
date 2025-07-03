// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef, useState } from "react";
import useKeyDown from "../../effects/keydown";
import type { IEntity, ILink } from "../../interfaces/data-models";
import type { IShape } from "../../interfaces/data-models/shape";
import configService from "../../services/configurationService";
import type { IQueryResponse } from "../../services/queryService";
import { internalRemove } from "../../store/internal-actions";
import { internalRemoveShapes } from "../../store/internal-actions";
import useMainStore from "../../store/main-store";
import useWorkflowStore from "../../store/workflow-store";
import Delete from "../modal/Delete";
import WorkflowProgress from "../modal/WorkflowProgress";
import Modal from "./Modal";

import { useTranslation } from "react-i18next";
import ContextMenu from "./ContextMenu";

interface Props {
  className?: string;
  children: React.ReactNode;
}

function AppShortcuts(props: Props) {
  const { t } = useTranslation();
  const workflow = useWorkflowStore((state) => state.workflow);
  const showWorkflow = useWorkflowStore((state) => state.showDialog);
  const setShowWorkflow = useWorkflowStore((state) => state.setShowDialog);

  const selectedEntities = useMainStore((state) => state.selectedEntities);
  const selectedLinks = useMainStore((state) => state.selectedLinks);
  const selectedShapeIds = useMainStore((state) => state.selectedShapeIds);
  const shapes = useMainStore((state) => state.shapes);

  const addEntity = useMainStore((state) => state.addEntity);
  const addLink = useMainStore((state) => state.addLink);

  const undo = useMainStore((state) => state.undo);
  const redo = useMainStore((state) => state.redo);

  const [showDelete, setDelete] = useState(false);
  const dirty = useMainStore((state) => state.dirty);

  useEffect(() => {
    window.onbeforeunload = dirty ? () => true : null;
    return () => {
      window.onbeforeunload = null;
    };
  }, [dirty]);

  function onDelete() {
    const hasSelectedNodes = selectedEntities.length > 0 || selectedLinks.length > 0;
    const hasSelectedShapes = selectedShapeIds.length > 0;

    if (hasSelectedNodes || hasSelectedShapes) {
      setDelete(true);
    }
  }

  function performDelete() {
    // Delete entities and links
    if (selectedEntities.length > 0 || selectedLinks.length > 0) {
      internalRemove(true, selectedEntities, selectedLinks);
    }

    // Delete shapes - collect all shapes to delete and remove them as a single operation
    if (selectedShapeIds.length > 0) {
      const shapesToDelete = selectedShapeIds.map((id) => shapes.find((s) => s.id === id)).filter(Boolean) as IShape[];
      if (shapesToDelete.length > 0) {
        internalRemoveShapes(true, shapesToDelete);
      }
    }

    setDelete(false);
  }

  function copy() {
    const selected: IQueryResponse = {
      Entities: selectedEntities,
      Links: selectedLinks,
      Events: [],
    };

    const json = JSON.stringify(selected);
    const type = "text/plain";
    const blob = new Blob([json], { type });
    const data = [new ClipboardItem({ [type]: blob })];

    void navigator.clipboard.write(data);
  }

  function paste() {
    void navigator.clipboard.readText().then((jsonData) => {
      let result: { Entities?: IEntity[]; Links?: ILink[] } = {};
      try {
        const data = JSON.parse(jsonData);
        if (data?.Entities == null || data?.Links == null) {
          return;
        }

        result = data;
      } catch (e) {
        console.debug("[paste error]", e);
      }

      if (result.Entities != null) {
        result.Entities.forEach((e) => {
          addEntity(e);
        });
      }

      if (result.Links != null) {
        result.Links.forEach((e) => {
          addLink(e);
        });
      }
    });
  }

  const appRef = useRef<HTMLDivElement>(null);
  useKeyDown(
    () => {
      onDelete();
    },
    appRef,
    ["Delete"]
  );

  useKeyDown(
    () => {
      copy();
    },
    appRef,
    ["KeyC"],
    true
  );

  useKeyDown(
    () => {
      paste();
    },
    appRef,
    ["KeyV"],
    true
  );

  useKeyDown(
    () => {
      undo();
    },
    appRef,
    ["KeyZ"],
    true
  );

  useKeyDown(
    () => {
      redo();
    },
    appRef,
    ["KeyY"],
    true
  );

  return (
    <>
      <ContextMenu
        copy={copy}
        paste={paste}
        delete={() => {
          setDelete(true);
        }}
      ></ContextMenu>
      <Modal
        mode="accept"
        show={showDelete}
        title={t("delete")}
        onNegative={() => {
          setDelete(false);
        }}
        onPositive={performDelete}
      >
        <Delete entities={selectedEntities} links={selectedLinks} shapes={selectedShapeIds.map((id) => shapes.find((s) => s.id === id)).filter(Boolean) as IShape[]} />
      </Modal>
      {workflow && (
        <Modal
          mode="ok"
          show={showWorkflow}
          title={configService.getWorkflow(workflow).Name}
          onNegative={() => {
            setShowWorkflow(false);
          }}
        >
          <WorkflowProgress />
        </Modal>
      )}
      <div ref={appRef} className={props.className}>
        {props.children}
      </div>
    </>
  );
}

export default AppShortcuts;
