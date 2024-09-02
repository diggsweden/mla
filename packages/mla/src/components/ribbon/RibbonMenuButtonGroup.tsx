// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

interface RibbonMenuButtonGroupProps {
  children?: React.ReactNode
}

function RibbonMenuButtonGroup (props: RibbonMenuButtonGroupProps) {
  return <div className={'m-grid m-grid-flow-col m-grid-rows-3 m-max-h-20 m-pt-[2px] m-pb-[5px]'}>
    {props.children }
  </div>
}

export default RibbonMenuButtonGroup
