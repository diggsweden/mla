// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

// A field of an older version: when the latest version has another value, the field gets a light yellow tone and the value below it
function LaterValue (props: { later?: string, children: ReactNode }) {
  const { t } = useTranslation()
  if (props.later == null) {
    return <div>{props.children}</div>
  }
  return (
    <div className="m:[&_input]:bg-amber-50 m:[&_select]:bg-amber-50 m:[&_textarea]:bg-amber-50">
      {props.children}
      <p className="m:mt-1 m:text-[12px] m:text-amber-900">{t('later value', { value: props.later || t('empty value') })}</p>
    </div>
  )
}

export default LaterValue
