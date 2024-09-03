// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import r2wc from "@r2wc/react-to-web-component"
import { MLA, MlaProps} from "react-mla"

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
