// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { NodeProgramType } from "sigma/rendering";

import createNodeSvgProgram from "./factory";

export { default as createNodeSvgProgram } from "./factory";
export const NodeSvgProgram: NodeProgramType = createNodeSvgProgram();