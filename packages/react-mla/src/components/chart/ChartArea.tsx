// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import ChartContent from "./ChartContent";
import useMainStore, { DrawingTool } from "../../store/main-store";
import PropertiesPanel from "../properties/PropertiesPanel";
import Timeline from "../timeline/Timeline";
import ToolPanel from "../tools/ToolPanel";
import useChart from "./hooks/use-chart";

import { useEffect, useRef } from "react";
import workflowService from "../../services/workflowService";

function ChartArea() {
  const workflow = useMainStore((state) => state.workflowToExecute);
  const setDrawingTool = useMainStore((state) => state.setDrawingTool);
  const setActiveShapeType = useMainStore((state) => state.setActiveShapeType);

  // Create a shared container ref
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize sigma
  const chart = useChart(containerRef);

  // Store drawing tool in global state so it can be accessed from the DrawTabPanel
  useEffect(() => {
    // Create an adapter that matches the DrawingTool interface
    const drawingToolAdapter: DrawingTool = {
      setCurrentShape: setActiveShapeType,
      setShapeColor: chart.setShapeColor,
      setTextProperties: chart.setTextProperties,
      hasSelection: chart.hasSelection,
      hasShapes: chart.hasShapes,
      activeShapeType: chart.activeShapeType,
    };

    setDrawingTool(drawingToolAdapter);

    return () => {
      setDrawingTool(undefined);
    };
  }, [chart, setActiveShapeType, setDrawingTool]); // Added drawTools as dependency

  useEffect(() => {
    // Run workflow after sigma is created
    if (workflow != "") {
      workflowService.Execute("testdata");
    }
  }, [workflow]);

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
        <div
          className="m-h-full m-w-full"
          ref={(el) => {
            containerRef.current = el;
            chart.dropRef(el);
          }}
        >
          <div className="m-h-full m-w-full m-outline-none" id="m-chart" tabIndex={1} ref={chart.container}></div>
          <ChartContent />
        </div>
      </div>
    </>
  );
}

export default ChartArea;
