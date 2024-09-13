// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  className?: string
  title?: string
  value?: boolean
  yesNo?: boolean
  readOnly?: boolean
  onChange?: (newValue: boolean) => void
}

const Toggle = (props: Props) => {
  const { t } = useTranslation();
  const [isChecked, setIsChecked] = useState(props.value ?? false)

  const readOnly = props.readOnly ?? false;

  const handleCheckboxChange = () => {
    const newValue = !isChecked
    setIsChecked(newValue)
    if (props.onChange) {
      props.onChange(newValue)
    }
  }

  return (
    <>
      <label className={props.className + ' autoSaverSwitch m-relative m-inline-flex m-cursor-pointer m-select-none m-items-center ' + (readOnly ? 'm-pointer-events-none' : '')} title={props.title}>
        <input
          type='checkbox'
          name='autoSaver'
          className="m-sr-only"
          checked={isChecked}
          onChange={handleCheckboxChange}
        />
        <span
          className={`m-slider m-mr-3 m-flex m-h-[20px] m-w-[44px] m-items-center m-rounded-full m-p-1 m-duration-200 ${isChecked ? 'm-bg-primary' : 'm-bg-secondary'
          }`}
        >
          <span
            className={`m-dot m-h-[12px] m-w-[12px] m-rounded-full m-bg-white m-duration-200 ${isChecked ? 'm-translate-x-6' : ''
            }`}
          ></span>
        </span>
        <span className="m-label m-flex m-items-center m-text-sm m-font-medium m-text-black">
          {props.title}<span className="m-pl-1"> {isChecked ? (props.yesNo ? (': ' + t('yes'))  : t('on')) : (props.yesNo ? (': ' + t('no')) : t('off'))} </span>
        </span>
      </label>
    </>
  )
}

export default Toggle
