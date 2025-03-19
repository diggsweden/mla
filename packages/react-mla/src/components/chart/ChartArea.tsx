// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import ChartContent from './ChartContent';

import useMainStore from '../../store/main-store';

import useDropRef from "../hooks/useDropRef";
import PropertiesPanel from '../properties/PropertiesPanel';
import Timeline from '../timeline/Timeline';
import ToolPanel from '../tools/ToolPanel';
import useDraw from './hooks/use-draw';
import useSigma from './hooks/use-sigma';

import { useEffect } from 'react';
import workflowService from '../../services/workflowService';

function ChartArea() {
  const workflow = useMainStore((state) => state.workflowToExecute)
  const graph = useMainStore((state) => state.graph)
  const { sigma, container, dropRef } = useSigma(graph);
  useDraw(sigma)

  useEffect(() => {
    // Run workflow after sigma is created
    if (workflow != '') {
      workflowService.Execute("testdata")
    }
  }, [workflow])

  return (
    <>
      <div className="m-h-full m-flex-1 m-relative m-overflow-hidden">
        <div className="m-h-full m-w-full m-absolute m-pointer-events-none m-z-10">
          <div className="m-h-full m-w-full m-flex m-flex-row m-overflow-hidden">
            <ToolPanel className="m-w-72 m-flex-none m-h-full m-border-r m-border-gray-300 m-pointer-events-auto" />
            <Timeline className="m-pointer-events-auto" />
            <PropertiesPanel className="m-w-72 m-flex-none m-h-full m-border-l m-border-gray-300 m-pointer-events-auto" />
          </div>
        </div>
        <div className="m-h-full m-w-full" ref={useDropRef(dropRef[1])} >
          <div className="m-h-full m-w-full m-outline-none" id="m-chart" tabIndex={1} ref={container}></div>
          <ChartContent />
        </div>
      </div>
    </>
  )
}

export default ChartArea