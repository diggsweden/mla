// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from 'react-i18next'
import type { IPropertyConfiguration } from '../../interfaces/configuration'
import useAppStore from '../../store/app-store'
import { helpOf } from '../../utils/properties'

export const sectionLabel = 'm:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600'

// The heading of the fields in the panel, with the button that shows the explanations of all of them, when any has one
export default function DetailsHeading (props: { configs: IPropertyConfiguration[] }) {
  const { t } = useTranslation()
  const shown = useAppStore((state) => state.fieldHelp)
  const setShown = useAppStore((state) => state.setFieldHelp)
  const anyHelp = props.configs.some(c => helpOf(c.Name, c.Description) != null)
  return (
    <div className="m:flex m:items-center m:min-h-6">
      <h3 className={sectionLabel}>{t('details')}</h3>
      {anyHelp &&
        <button type="button" aria-pressed={shown} onClick={() => { setShown(!shown) }}
          className={'m:ml-auto m:flex m:items-center m:gap-1 m:text-[12px] m:text-primary m:px-1.5 m:py-0.5 m:rounded m:cursor-pointer ' + (shown ? 'm:bg-blue-50 m:font-semibold' : 'm:hover:bg-blue-50')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01" /></svg>
          {t('show explanations')}
        </button>}
    </div>
  )
}
