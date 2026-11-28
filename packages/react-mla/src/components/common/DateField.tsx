// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type ChangeEvent, type FocusEvent, type KeyboardEvent, type Ref, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  id?: string
  ref?: Ref<HTMLInputElement>
  // The date as the field holds it, like 2025-02-12, or nothing
  value?: string
  // The date that was chosen, or nothing when the field was emptied. A half typed date is not a date, and is not told
  onChange: (value: string) => void
  // Whether what is in the field is valid: a date that is half typed is not, nor an empty one that must be filled in
  onValidity?: (valid: boolean) => void
  required?: boolean
  readOnly?: boolean
  min?: string
  max?: string
  // The name of the field: what the button that empties it says, and the name of the field when it has no label of its own
  name: string
  label?: boolean
  describedBy?: string
  className?: string
  // What is said under a half typed date
  invalidMessage?: string
  // Whether the button that empties it is there, when it is not only when there is a date. A field that shows a date it falls back to
  // has nothing to empty when it shows that one
  clearable?: boolean
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

// A small button at the right end of a field, after its own buttons, that empties it
export function ClearButton (props: { label: string, onClick: () => void }) {
  return (
    <button type="button" aria-label={props.label} title={props.label} onClick={props.onClick}
      className="m:absolute m:right-1.5 m:top-1/2 m:-translate-y-1/2 m:w-5 m:h-5 m:flex m:items-center m:justify-center m:rounded-full m:text-gray-500 m:cursor-pointer m:hover:bg-gray-200 m:hover:text-gray-900">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  )
}

// A field of a date, the same everywhere: the format of the browser, but not in an empty field that does not have the focus,
// where it looked like a date that was already chosen; a half typed date that is said to be wrong, also when it is left;
// and a button that empties it, when it does not have to be filled in
export default function DateField (props: Props) {
  const { t } = useTranslation()
  const own = useId()
  const id = props.id ?? own
  const input = useRef<HTMLInputElement | null>(null)
  // A half typed date has no value, so it is only known by the field
  const [half, setHalf] = useState(false)

  // The field is reached also by the one who gave a ref
  const setRef = (element: HTMLInputElement | null) => {
    input.current = element
    if (typeof props.ref === 'function') props.ref(element)
    else if (props.ref != null) (props.ref as { current: HTMLInputElement | null }).current = element
  }

  const check = (e: ChangeEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>) => {
    const validity = e.currentTarget.validity
    setHalf(validity.badInput)
    props.onValidity?.(validity.valid)
  }

  const clear = () => {
    const element = input.current
    if (element != null) element.value = ''
    setHalf(false)
    props.onChange('')
    props.onValidity?.(element?.validity.valid ?? !props.required)
  }

  const empty = (props.value == null || props.value === '') && !half
  const clearable = (props.clearable ?? !empty) && !props.readOnly && !props.required
  const describedBy = [props.describedBy, half ? id + '-invalid' : undefined].filter(x => x != null).join(' ') || undefined

  return (
    <div>
      <div className="m:relative">
        <input id={id} ref={setRef} type="date" value={props.value ?? ''} min={props.min} max={props.max} required={props.required} readOnly={props.readOnly ?? false}
          aria-label={props.label === false ? props.name : undefined} aria-invalid={half || undefined} aria-describedby={describedBy}
          data-empty={empty ? true : undefined}
          onChange={(e) => { check(e); props.onChange(e.target.value) }}
          onKeyUp={check} onBlur={check} onKeyDown={props.onKeyDown}
          // Room at the right end for the button that empties it, so that the one of the calendar is beside it
          className={props.className + (clearable ? ' m:pr-7' : '')} />
        {clearable &&
          <ClearButton label={t('clear field', { name: props.name })} onClick={clear} />}
      </div>
      {half &&
        <p id={id + '-invalid'} className="m:mt-1 m:flex m:items-center m:gap-1 m:text-[12px] m:text-red-700">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className="m:shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16h.01" /></svg>
          {props.invalidMessage ?? t('invalid format')}
        </p>}
    </div>
  )
}
