// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

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
        <div className="m-group m-px-1 m-pb-6 m-relative m-flex m-items-start m-content-start">
          {children}
          <span className="m-title m-block m-absolute m-left-0 m-bottom-0 m-w-full m-h-6 m-leading-6 m-text-sm m-text-center m-whitespace-nowrap m-border-t m-border-solid m-border-gray-300">{title}</span>
        </div>
      }
    </>
  )
}

export default RibbonMenuSection
