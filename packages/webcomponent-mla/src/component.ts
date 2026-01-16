// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import r2wc from "@r2wc/react-to-web-component"
import { MLA, MlaProps} from "@diggsweden/react-mla"

function CreateMLAComponent() {
  const MLAComponent = r2wc(MLAComponentWrapper, {
    props: {
      config: 'string',
      configSrc: 'string',
      context: 'string',
      publicUrl: 'string'
    } as MlaProps
  })
  
  customElements.define('mla-component', MLAComponent)
}

function MLAComponentWrapper({ container } : { container: MlaProps}) {
  return MLA(container)
}

export default CreateMLAComponent
