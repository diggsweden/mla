// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

interface Props {
  title: string
  visible?: boolean
  children?: React.ReactNode
}

function RibbonMenuSection (props: Props) {
  const { visible = true, children, title } = props
  return (
    <>
      {visible &&
        <div className="group px-1 pb-6 relative flex items-start content-start">
          {children}
          <span className="title block absolute left-0 bottom-0 w-full h-6 leading-6 text-sm text-center whitespace-nowrap border-t border-solid border-gray-300">{title}</span>
        </div>
      }
    </>
  )
}

export default RibbonMenuSection
