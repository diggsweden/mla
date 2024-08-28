// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

interface RibbonMenuButtonGroupProps {
  children?: React.ReactNode
}

function RibbonMenuButtonGroup (props: RibbonMenuButtonGroupProps) {
  return <div className={'grid grid-flow-col grid-rows-3 max-h-20 pt-[2px] pb-[5px]'}>
    {props.children }
  </div>
}

export default RibbonMenuButtonGroup
