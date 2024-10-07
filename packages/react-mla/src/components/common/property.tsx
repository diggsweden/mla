// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { createRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { type IPropertyConfiguration } from '../../interfaces/configuration'
import Toggle from './Toggle'
import { DateTime } from 'luxon'

interface Props {
  config: IPropertyConfiguration
  className?: string
  value?: string | number | boolean
  autofocus?: boolean
  readOnly?: boolean
  onChange?: (newValue: string | number | boolean | undefined) => void
  validChanged?: (newValue: boolean) => void
}

function Property (props: Props) {
  const inputRef = createRef<HTMLInputElement>()
  const textRef = createRef<HTMLTextAreaElement>()
  const selectRef = createRef<HTMLSelectElement>()
  const didFocus = useRef(false)

  const [value, setValue] = useState(props.value)
  const [valid, setValid] = useState(false)

  const { config, className, autofocus, readOnly, onChange, validChanged } = props
  const key = "prop-" + config.TypeId

  useLayoutEffect(() => {
    const test = inputRef.current?.validity.valid ?? true
    setValid(test)
  }, [inputRef])

  useEffect(() => {
    if (validChanged) {
      validChanged(valid)
    }
  }, [valid])

  useLayoutEffect(() => {
    const input = inputRef.current
    if (!didFocus.current && autofocus && input != null) {
      didFocus.current = true
      window.setTimeout(() => {
        input.focus()
      }, 50)
    }
  }, [autofocus, inputRef])

  useLayoutEffect(() => {
    const input = selectRef.current
    if (!didFocus.current && autofocus && input != null) {
      didFocus.current = true
      window.setTimeout(() => {
        input.focus()
      }, 50)
    }
  }, [autofocus, selectRef])

  useLayoutEffect(() => {
    const input = textRef.current
    if (!didFocus.current && autofocus && input != null) {
      didFocus.current = true
      window.setTimeout(() => {
        input.focus()
      }, 50)
    }
  }, [autofocus, textRef])

  useEffect(() => {
    const text = textRef.current
    if (text) {
      text.style.height = '0px'
      const scrollHeight = text.scrollHeight
      text.style.height = scrollHeight + 'px'
    }
  }, [textRef])

  function handleChange (value: string | number | boolean | undefined) {
    setValue(value)
    const test = inputRef.current?.validity.valid ?? true
    setValid(test)
    if (test) {
      update(value)
    }
  }

  function handleChangeDate (date?: Date) {
    const dateString = date != undefined ? DateTime.fromJSDate(date).toFormat("yyyy-MM-dd")! : ''
    setValue(dateString)
    const test = inputRef.current?.validity.valid ?? true
    setValid(test)
    if (test && onChange) {
      onChange(dateString)
    }
  }

  function handeFileUpload (event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files != null && event.target.files.length > 0) {
      const file = event.target.files[0]
      const reader = new FileReader()

      if (file && reader && onChange) {
        reader.onload = async (e) => {
          onChange(e.target?.result?.toString())
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const debounce = useRef(0)
  function update (value?: string | number | boolean) {
    window.clearTimeout(debounce.current)
    debounce.current = window.setTimeout(() => {
      if (onChange) {
        onChange(value)
      }
    }, 250)
  }

  function getInput () {
    const inputClass = (valid ? 'm-border-gray-300 ' : 'm-border-red-500 m-bg-red-200 ') + 'm-bg-white m-border m-text-gray-900 m-rounded-lg focus:m-ring-blue-500 m-block m-w-full m-p-1'
    switch (config.FieldType) {
      case 'String': return <input id={key} ref={inputRef} readOnly={readOnly ?? false} type="text" required={config.Required} pattern={config.FieldValidation} value={value?.toString() ?? ''} onChange={(e) => { handleChange(e.target.value) }} className={inputClass}></input>
      case 'Multiline': return <textarea id={key} ref={textRef} readOnly={readOnly ?? false} required={config.Required} value={value?.toString() ?? ''} onChange={(e) => { handleChange(e.target.value) }} className={inputClass + ' min-h-[48px] max-h-[200px] overflow-y-auto'}></textarea>
      case 'Date': return <input id={key} ref={inputRef} readOnly={readOnly ?? false} type="date" required={config.Required} value={value?.toString() ?? ''} onChange={(e) => { handleChangeDate(e.target.valueAsDate ?? undefined) }} className={inputClass}></input>
      case 'Number': return <input id={key} ref={inputRef} readOnly={readOnly ?? false} type="number" required={config.Required} value={value ? Number(value) : 0} onChange={(e) => { handleChange(e.target.value) }} className={inputClass}></input>
      case 'Boolean': return <Toggle title={config.Name} readOnly={readOnly ?? false} value={value === true} onChange={(e) => { handleChange(e) }} yesNo className="m-mt-2" />
      case 'Select': return <select id={key} ref={selectRef} required={config.Required} value={value?.toString() ?? (config.Required ? undefined : '0')} onChange={(e) => { handleChange(e.target.value) }} className={inputClass + (readOnly ?? false ? ' pointer-events-none' : '')}>
        {!config.Required && !config.FieldOptions?.some(x => x.Value === '0') &&
          <option value={undefined}></option>
        }
        {config.FieldOptions?.map(opt =>
          <option key={opt.Value} value={opt.Value}>{opt.Name}</option>
        )}
      </select>
      case 'File': return <input id={key} ref={inputRef} accept={config.FieldValidation} required={config.Required} type="file" onChange={(e) => { handeFileUpload(e) }} className={inputClass}></input>
      default: throw Error('Unsupported config: ' + (config.FieldType as any))
    }
  }

  return (
    <div className={className}>
      {config.FieldType !== 'Boolean' &&
        <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900" title={config.Description}>{config.Name ?? config.GlobalType}</span>
      }
      {getInput()}
    </div>
  )
}

export default Property
