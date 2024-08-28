// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useState } from 'react'

interface Props {
  className?: string
  title?: string
  value?: boolean
  yesNo?: boolean
  readOnly?: boolean
  onChange?: (newValue: boolean) => void
}

const Toggle = (props: Props) => {
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
      <label className={props.className + ' autoSaverSwitch relative inline-flex cursor-pointer select-none items-center ' + (readOnly ? 'pointer-events-none' : '')} title={props.title}>
        <input
          type='checkbox'
          name='autoSaver'
          className='sr-only'
          checked={isChecked}
          onChange={handleCheckboxChange}
        />
        <span
          className={`slider mr-3 flex h-[20px] w-[44px] items-center rounded-full p-1 duration-200 ${isChecked ? 'bg-primary' : 'bg-secondary'
          }`}
        >
          <span
            className={`dot h-[12px] w-[12px] rounded-full bg-white duration-200 ${isChecked ? 'translate-x-6' : ''
            }`}
          ></span>
        </span>
        <span className='label flex items-center text-sm font-medium text-black'>
          {props.title}<span className='pl-1'> {isChecked ? (props.yesNo ? ': Ja' : 'På') : (props.yesNo ? ': Nej' : 'Av')} </span>
        </span>
      </label>
    </>
  )
}

export default Toggle
