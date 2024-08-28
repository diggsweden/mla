// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import CreateMLAComponent from './component'

CreateMLAComponent();

const configUrl =  "/test/default.json";
const mla = document.createElement("mla-component") as any
mla.configSrc = configUrl;

document.body.appendChild(mla)