// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { createRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { type IPropertyConfiguration } from '../../interfaces/configuration'
import Toggle from './Toggle'
import DateField from './DateField'
import { useTranslation } from 'react-i18next'
import { helpOf } from '../../utils/properties'

interface Props {
  config: IPropertyConfiguration
  className?: string
  value?: string | number | boolean
  autofocus?: boolean
  readOnly?: boolean
  onChange?: (newValue: string | number | boolean | undefined) => void
  validChanged?: (newValue: boolean) => void
  // Whether the explanation of the field is shown, until the user opens or closes it with its button. It follows when it changes
  helpOpen?: boolean
  // The explanation under the field instead of under its name, so that fields side by side stay level
  helpBelow?: boolean
  // The classes of the name and the field, without the explanation under it, like a width
  fieldClassName?: string
}

function Property (props: Props) {
  const { t } = useTranslation()
  const inputRef = createRef<HTMLInputElement>()
  const textRef = createRef<HTMLTextAreaElement>()
  const selectRef = createRef<HTMLSelectElement>()
  const didFocus = useRef(false)

  const [value, setValue] = useState(props.value)
  const [valid, setValid] = useState(false)

  const { config, className, autofocus, readOnly, onChange, validChanged } = props
  const key = "prop-" + config.TypeId

  // The explanation of the field, from its description, unless it only says its name again
  const help = helpOf(config.Name, config.Description)
  const [helpShown, setHelpShown] = useState(props.helpOpen ?? false)
  const [helpOpen, setHelpOpen] = useState(props.helpOpen)
  if (helpOpen !== props.helpOpen) {
    setHelpOpen(props.helpOpen)
    setHelpShown(props.helpOpen ?? false)
  }

  useLayoutEffect(() => {
    const test = inputRef.current?.validity.valid ?? true
    setValid(test)
  }, [inputRef])

  useEffect(() => {
    if (validChanged) {
      validChanged(valid)
    }
  }, [valid, validChanged])

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

  // A date as the field holds it, like 2025-02-12, or nothing when it was emptied
  function handleChangeDate (date: string) {
    setValue(date)
    const test = inputRef.current?.validity.valid ?? true
    setValid(test)
    if (test && onChange) {
      onChange(date)
    }
  }

  function handeFileUpload (event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files != null && event.target.files.length > 0) {
      const file = event.target.files[0]
      const reader = new FileReader()

      if (file && reader && onChange) {
        reader.onload = (e) => {
          const result = e.target?.result
          onChange(typeof result === 'string' ? result : undefined)
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

  // A value that is filled in but does not match the format of the field, which is told below it. An empty field that must be filled in is only marked
  // A date says itself when it is half typed
  const mismatch = !valid && value != null && value !== '' && config.FieldType !== 'File' && config.FieldType !== 'Date'

  // A screen reader reads the explanation when the field gets the focus, also when it is not shown
  const describedBy = [help != null ? key + '-help' : undefined, mismatch ? key + '-error' : undefined].filter(x => x != null).join(' ') || undefined

  function getInput () {
    // The fields have their own size of text, as they take the size of where they are, which is larger in a dialog than in the panels
    const inputClass = (valid ? 'm:border-gray-300 ' : 'm:border-red-500 m:bg-red-200 ') + 'm:bg-white m:border m:text-gray-900 m:text-[14px] m:rounded-lg m:focus:ring-blue-500 m:block m:w-full m:p-1'
    switch (config.FieldType) {
      case 'String': return <input id={key} ref={inputRef} readOnly={readOnly ?? false} type="text" required={config.Required} pattern={config.FieldValidation} aria-invalid={mismatch} aria-describedby={describedBy} value={value?.toString() ?? ''} onChange={(e) => { handleChange(e.target.value) }} className={inputClass}></input>
      case 'Multiline': return <textarea id={key} ref={textRef} aria-describedby={describedBy} readOnly={readOnly ?? false} required={config.Required} value={value?.toString() ?? ''} onChange={(e) => { handleChange(e.target.value) }} className={inputClass + ' min-h-[48px] max-h-[200px] overflow-y-auto'}></textarea>
      // A date that is half typed, or cleared, does not change the value, so its validity is checked as it is typed and when it is left.
      // An empty date that is valid hides the format the browser shows, which looked like a date that was already chosen
      // The same field of a date as everywhere: it says itself when a date is half typed
      case 'Date': return <DateField id={key} ref={inputRef} name={config.Name} value={value?.toString()} required={config.Required} readOnly={readOnly}
        describedBy={describedBy} invalidMessage={config.FieldValidationMessage || undefined} className={inputClass}
        onValidity={setValid} onChange={(date) => { handleChangeDate(date) }} />
      case 'Number': return <input id={key} ref={inputRef} readOnly={readOnly ?? false} type="number" aria-describedby={describedBy} required={config.Required} value={value != null && value !== '' ? Number(value) : ''} onChange={(e) => { handleChange(e.target.value ? Number(e.target.value) : undefined) }} className={inputClass}></input>
      case 'Boolean': return <Toggle title={config.Name} readOnly={readOnly ?? false} value={value === true} onChange={(e) => { handleChange(e) }} yesNo className="m:mt-2" />
      case 'Select': return <select id={key} ref={selectRef} aria-describedby={describedBy} required={config.Required} value={value?.toString() ?? (config.Required ? undefined : '0')} onChange={(e) => { handleChange(e.target.value) }} className={inputClass + (readOnly ?? false ? ' pointer-events-none' : '')}>
        {!config.Required && !config.FieldOptions?.some(x => x.Value === '0') &&
          <option value={undefined}></option>
        }
        {config.FieldOptions?.map(opt =>
          <option key={opt.Value} value={opt.Value}>{opt.Name}</option>
        )}
      </select>
      case 'File': return <input id={key} ref={inputRef} accept={config.FieldValidation} required={config.Required} type="file" onChange={(e) => { handeFileUpload(e) }} className={inputClass}></input>
      default: throw Error('Unsupported config: ' + String(config.FieldType))
    }
  }

  const name = config.Name ?? config.GlobalType
  const helpButton = help != null && (
    <button type="button" aria-expanded={helpShown} aria-controls={key + '-help'} aria-label={t('explain field', { name })} title={t('explain field', { name })}
      onClick={() => { setHelpShown(!helpShown) }}
      className={'m:w-5 m:h-5 m:shrink-0 m:flex m:items-center m:justify-center m:rounded-full m:cursor-pointer ' + (helpShown ? 'm:bg-blue-50 m:text-primary' : 'm:text-gray-500 m:hover:text-primary m:hover:bg-blue-50')}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
    </button>
  )
  // Kept in the page also when it is hidden, so that the field is still described by it
  const helpText = help != null && (
    <p id={key + '-help'} hidden={!helpShown} className={'m:text-[12px] m:leading-snug m:text-gray-600 ' + (props.helpBelow ? 'm:mt-1' : 'm:mb-1.5')}>{help}</p>
  )

  return (
    <div className={className}>
      <div className={props.fieldClassName}>
        {config.FieldType !== 'Boolean' &&
          // The button of the explanation is at the right end of the row of the name, so that the names stay a calm column
          <div className="m:flex m:items-center m:gap-2 m:mb-1">
            <label htmlFor={key} className="m:text-sm m:font-medium m:text-gray-900">{name}</label>
            {helpButton !== false && <span className="m:ml-auto">{helpButton}</span>}
          </div>
        }
        {!props.helpBelow && helpText}
        {config.FieldType === 'Boolean' && help != null
          ? <div className="m:flex m:items-center m:gap-2">{getInput()}<span className="m:mt-2 m:ml-auto">{helpButton}</span></div>
          : getInput()}
      </div>
      {props.helpBelow && helpText}
      {mismatch &&
        <p id={key + '-error'} className="m:mt-1 m:flex m:items-center m:gap-1 m:text-[12px] m:text-red-700">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className="m:shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16h.01" /></svg>
          {config.FieldValidationMessage || t('invalid format')}
        </p>
      }
    </div>
  )
}

export default Property
