// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import r2wc from "@r2wc/react-to-web-component"
import { MLA } from '@repo/mla'

function CreateMLAComponent() {
  const MLAComponent = r2wc(MLAComponentWrapper, {
    props: {
      config: 'string',
      context: 'string',
      publicUrl: 'string'
    }
  })
  
  customElements.define('mla-component', MLAComponent)
}

interface Props {
  config?: string
  configSrc?: string
  context?: string
  publicUrl?: string
  workflowId?: string
}

function MLAComponentWrapper({ container } : { container: Props}) {
  return MLA(container as Props)
}

export default CreateMLAComponent
