// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef, useState } from 'react'
import Icon from '../common/Icon'
import { IColor } from '../../interfaces/configuration/theme-configuration'
import { useTranslation } from 'react-i18next'

interface RibbonMenuColorPickerButtonProps {
  label: string
  title?: string
  icon: string
  disabled?: boolean
  color?: string
  children?: React.ReactNode
  className?: string,
  colors: IColor[] | undefined,
  onColorSelected: (color?: string) => void
}

function RibbonMenuColorPickerButton(props: RibbonMenuColorPickerButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false)
  const ctxDropDownMenu = useRef<HTMLDivElement>(null)

  const handleOpen = () => {
    setOpen(!open)
  }

  const handleColorSelected = (color?: string) => {
    props.onColorSelected(color)
    setOpen(false)
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (!ctxDropDownMenu.current?.parentElement?.contains(e.target as HTMLElement)) {
      setOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  })

  const colorClass = "m-w-4 m-h-4 m-outline-1 m-outline-blue-400 hover:m-outline"
  const buttonClass = (open ? 'm-border-blue-300 m-bg-blue-100 ' : 'm-border-transparent ') + 'm-h-5 m-m-px m-inline-flex m-flex-row m-flex-nowrap m-py-0 m-px-1 m-border enabled:hover:m-bg-blue-100 enabled:hover:m-border-blue-400 disabled:m-opacity-50 disabled:m-cursor-default'
  return <div className="m-relative m-text-left m-h-5">
    <button type='button' disabled={props.disabled} onClick={handleOpen} title={props.title} className={props.className + ' ' + buttonClass}>
      <span className="m-flex m-justify-center m-items-center">
        <span className="m-h-4 m-w-4 m-max-h-4 m-max-w-4 m-leading-4"><Icon color={props.color} name={props.icon} className="m-text-primary m-flex m-justify-center m-items-center m-h-4 m-w-4 m-" /></span>
      </span>
      <span className="m-ml-1 m-inline-flex m-flex-row m-flex-nowrap m-whitespace-nowrap">{props.label}<Icon name='outlined_arrow_left' className="m-text-primary m-flex m-justify-center m-items-center m-h-4 m-w-4 -m-rotate-90" /></span>
    </button>
    {open
      ? (
        <div className="m-absolute m-bg-white m-text-sm m-z-50 m-shadow m-border m-border-gray-300" ref={ctxDropDownMenu}>
          {(props.colors != null && props.colors.length > 0) &&
            <div>
              <div className="m-bg-gray-200 m-py-1 m-px-2 m-text-sm m-font-semibold m-border-none">{t('theme colors')}</div>
              <div className="m-grid m-grid-cols-6 m-gap-1 m-p-1">
                {props.colors.map(c => (
                  <div key={c.Name} title={c.Name} onClick={() => { handleColorSelected(c.Color) }} className={colorClass} style={{ backgroundColor: c.Color }}></div>
                ))}
              </div>
            </div>
          }
          <div className="m-bg-gray-200 m-py-1 m-px-2 m-text-sm m-font-semibold">{('default colors')}</div>
          <div className="m-flex m-gap-1 m-p-1">
            <div key={'blue'} title={t('blue')} onClick={() => { handleColorSelected('#4169E1') }} className={colorClass} style={{ backgroundColor: '#4169E1' }}></div>
            <div key={'green'} title={t('green')} onClick={() => { handleColorSelected('#008000') }} className={colorClass} style={{ backgroundColor: '#008000' }}></div>
            <div key={'red'} title={t('red')} onClick={() => { handleColorSelected('#FF4040') }} className={colorClass} style={{ backgroundColor: '#FF4040' }}></div>
            <div key={'yellow'} title={t('yellow')} onClick={() => { handleColorSelected('#FFD700') }} className={colorClass} style={{ backgroundColor: '#FFD700' }}></div>
            <div key={'purple'} title={t('purple')} onClick={() => { handleColorSelected('#800080') }} className={colorClass} style={{ backgroundColor: '#800080' }}></div>
            <div key={'organge'} title={t('organge')} onClick={() => { handleColorSelected('#FFA500') }} className={colorClass} style={{ backgroundColor: '#FFA500' }}></div>
          </div>
          <div className="m-flex m-text-sm m-text-left m-border-none hover:m-bg-blue-100 m-text-gray-700 m-p-1 m-whitespace-nowrap" onClick={() => { handleColorSelected(undefined) }} >
            <div className="m-w-4 m-h-4 m-border m-bg-gray-100 m-border-gray-400 m-mr-2"></div>
            {t('reset color')}
          </div>
        </div>
      )
      : null}
  </div>
}

export default RibbonMenuColorPickerButton
