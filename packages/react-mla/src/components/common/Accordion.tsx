// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

interface AccordionProps {
  title: string
  expanded: boolean
  children?: React.ReactNode
}

function Accordion (props: AccordionProps) {
  const contentSpace = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(props.expanded)
  const [height, setHeight] = useState(props.expanded ? '' : '0px')
  const [rotate, setRotate] = useState(props.expanded ? 'm-transform duration-300 m-ease m-rotate-90' : 'm-transform m-duration-400 m-ease')

  useEffect(() => {
    setHeight(!active ? '0px' : `${contentSpace.current?.scrollHeight ?? 0}px`)
    setRotate(!active ? 'm-transform m-duration-300 m-ease' : 'm-transform m-duration-300 m-ease m-rotate-90')
  }, [active])

  return (
    <div className="m-flex m-flex-col m-mx-3 m-mt-3">
      <button className="m-w-full m-p-1 m-text-left m-cursor-pointer m-box-border m-flex m-items-center m-bg-slate-300" onClick={() => { setActive(!active) }}>
        <Icon color="#000" name="outlined_chevron_right" className={`${rotate} m-inline-block m-text-primary m-h-4 m-w-4`} />
        <div className="m-grow m-pl-1">{props.title}</div>
      </button>
      <div ref={contentSpace} style={{ maxHeight: `${height}` }} className="m-overflow-hidden m-transition-max-height m-duration-300 m-ease-in-out">
        <div className="m-pb-2 m-pt-3">{props.children}</div>
      </div>
    </div>
  )
}

export default Accordion
