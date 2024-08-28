// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

interface Props {
  visible?: boolean
}

function RibbonMenuDivider (props: Props) {
  return props.visible !== false ? <div className="w-px border border-l-slate-300 -ml-px"></div> : null
}

export default RibbonMenuDivider
