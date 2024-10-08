// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import * as config from '../../../apps/web/public/config/default.json'

import CreateMLAComponent from "./component"

CreateMLAComponent();

const mla = document.createElement("mla-component") as any
mla.config = JSON.stringify(config);

document.body.appendChild(mla)
