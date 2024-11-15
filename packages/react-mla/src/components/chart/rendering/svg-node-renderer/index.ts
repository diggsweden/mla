import { NodeProgramType } from "sigma/rendering";

import createNodeSvgProgram from "./factory";

export { default as createNodeSvgProgram } from "./factory";
export const NodeSvgProgram: NodeProgramType = createNodeSvgProgram();
//export const NodePictogramProgram: NodeProgramType = createNodeImageProgram({
//  keepWithinCircle: false,
//  size: { mode: "force", value: 256 },
//  drawingMode: "color",
//  correctCentering: true,
//});