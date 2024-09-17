// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import iconService from '../../services/iconService'

interface IconProps {
  name?: string
  className?: string
  color?: string
}

function Icon (props: IconProps) {
  const svg = iconService.getSVG(props.name ?? 'warning')
  return <div style={{ color: props.color }} className={'m-fill-current mla-icon ' + props.className} dangerouslySetInnerHTML={{ __html: svg }} />
}

export default Icon
