// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type ReactNode, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Icon from '../common/Icon'

// The icon of an entity in the color of its type, as in the chart
export function ActorBadge (props: { icon: string, color: string }) {
  return (
    <span aria-hidden="true" className="m:w-7 m:h-7 m:shrink-0 m:rounded-full m:bg-white m:border m:border-gray-300 m:flex m:items-center m:justify-center">
      <Icon name={props.icon} color={props.color} className="m:w-5 m:h-5" />
    </span>
  )
}

export function SquareButton (props: { label: string, title?: string, onClick: () => void, children: ReactNode }) {
  return (
    <button type="button" onClick={props.onClick} aria-label={props.label} title={props.title ?? props.label}
      className="m:w-7.5 m:h-7.5 m:shrink-0 m:flex m:items-center m:justify-center m:border m:border-gray-300 m:rounded m:bg-white m:text-gray-900 m:cursor-pointer m:hover:bg-gray-100">
      {props.children}
    </button>
  )
}

export function MinusIcon () {
  return <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

export function PlusIcon () {
  return <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8M6 2v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

export function GripIcon () {
  return (
    <svg width="12" height="18" viewBox="0 0 12 18" aria-hidden="true">
      {[3, 9, 15].map(y => [3, 9].map(x => <circle key={x + '-' + y} cx={x} cy={y} r="1.6" fill="currentColor" />))}
    </svg>
  )
}

// Two arrows that point the way the panel goes when it is hidden
export function CollapseIcon (props: { towards: 'left' | 'right' }) {
  const d = props.towards === 'left' ? 'M10 3L6 7l4 4M6 3L2 7l4 4' : 'M4 3l4 4-4 4M8 3l4 4-4 4'
  return <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

// The heading of a panel, with the button that hides it
export function PanelHeading (props: { title: string, help?: string, hideLabel: string, side: 'left' | 'right', onHide: () => void }) {
  return (
    <div className="m:shrink-0 m:px-4 m:pt-3.5 m:pb-2.5">
      <div className="m:flex m:justify-between m:items-center">
        <h2 className="m:text-[15px] m:font-bold">{props.title}</h2>
        <SquareButton label={props.hideLabel} onClick={props.onHide}>
          <CollapseIcon towards={props.side} />
        </SquareButton>
      </div>
      {props.help && <p className="m:text-[12px] m:text-gray-600 m:mt-1 m:leading-snug">{props.help}</p>}
    </div>
  )
}

// The narrow strip of a hidden panel, with the button that shows it again
export function CollapsedPanel (props: { label: string, showLabel: string, side: 'left' | 'right', onShow: () => void }) {
  return (
    <div className={'m:w-12 m:shrink-0 m:bg-white m:flex m:flex-col m:items-center m:pt-3 m:border-gray-300 ' + (props.side === 'left' ? 'm:border-r' : 'm:border-l')}>
      <button type="button" onClick={props.onShow} aria-label={props.showLabel} title={props.showLabel}
        className="m:flex m:flex-col m:items-center m:gap-2.5 m:border m:border-gray-300 m:rounded m:bg-white m:text-gray-900 m:cursor-pointer m:px-1.5 m:py-2 m:hover:bg-gray-100">
        <CollapseIcon towards={props.side === 'left' ? 'right' : 'left'} />
        <span className="m:text-[13px] m:font-semibold m:rotate-180" style={{ writingMode: 'vertical-rl' }}>{props.label}</span>
      </button>
    </div>
  )
}

function WarningIcon () {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="m:shrink-0">
      <path d="M12 3 2 21h20L12 3Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 10v5" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="18" r="1.2" fill="#451a03" />
    </svg>
  )
}

// What the user should know about the document, as a symbol and a count. The full texts open above it when it is pointed at or has focus,
// and stay open after a click until it is clicked again or Escape is pressed
export function Warnings (props: { texts: string[] }) {
  const { t } = useTranslation()
  const id = useId()
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const open = hover || pinned

  return (
    <div className="m:relative m:shrink-0" onMouseEnter={() => { setHover(true) }} onMouseLeave={() => { setHover(false) }}>
      <button type="button" aria-expanded={open} aria-describedby={open ? id : undefined}
        onClick={() => { setPinned(!pinned) }} onFocus={() => { setHover(true) }} onBlur={() => { setHover(false); setPinned(false) }}
        onKeyDown={(e) => { if (e.key === 'Escape') { setHover(false); setPinned(false) } }}
        className="m:flex m:items-center m:gap-1.5 m:text-[13px] m:font-semibold m:text-amber-900 m:bg-amber-50 m:border m:border-amber-400 m:rounded-full m:px-2.5 m:py-1 m:cursor-pointer m:hover:bg-amber-100">
        <WarningIcon />
        {t('n warnings', { count: props.texts.length })}
      </button>
      {open && <div id={id} role="tooltip"
        className="m:absolute m:bottom-full m:left-0 m:mb-2 m:z-[30] m:w-[440px] m:box-border m:flex m:flex-col m:gap-2 m:p-3 m:bg-white m:border m:border-amber-400 m:rounded-md m:shadow-lg">
        <div className="m:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-amber-900">{t('notices')}</div>
        <ul className="m:flex m:flex-col m:gap-2">
          {props.texts.map(text => (
            <li key={text} className="m:flex m:gap-2 m:items-start m:text-[13px] m:leading-snug m:text-gray-900"><WarningIcon />{text}</li>
          ))}
        </ul>
      </div>}
    </div>
  )
}

