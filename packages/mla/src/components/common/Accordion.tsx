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
  const [rotate, setRotate] = useState(props.expanded ? 'transform duration-300 ease rotate-90' : 'transform duration-400 ease')

  useEffect(() => {
    setHeight(!active ? '0px' : `${contentSpace.current?.scrollHeight ?? 0}px`)
    setRotate(!active ? 'transform duration-300 ease' : 'transform duration-300 ease rotate-90')
  }, [active])

  return (
    <div className="flex flex-col mx-3 mt-3">
      <button className="w-full p-1 text-left cursor-pointer box-border flex items-center bg-slate-300" onClick={() => { setActive(!active) }}>
        <Icon color="#000" name="outlined_chevron_right" className={`${rotate} inline-block text-primary h-4 w-4`} />
        <div className="grow pl-1">{props.title}</div>
      </button>
      <div ref={contentSpace} style={{ maxHeight: `${height}` }} className="overflow-hidden transition-max-height duration-300 ease-in-out">
        <div className="pb-2 pt-3">{props.children}</div>
      </div>
    </div>
  )
}

export default Accordion
