// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from 'react-i18next'

// The parts that the tools of the left panel share

export const sectionLabel = 'm:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600'
export const primaryButton = 'm:w-full m:h-[34px] m:rounded-md m:bg-primary m:text-white m:text-[13px] m:font-semibold m:cursor-pointer m:enabled:hover:brightness-110 m:disabled:opacity-50 m:disabled:cursor-default'
export const secondaryButton = 'm:text-[12px] m:font-semibold m:px-2.5 m:py-1 m:rounded m:border m:border-gray-300 m:bg-white m:text-gray-900 m:hover:bg-gray-100 m:cursor-pointer'

// While the service is asked: cards that look like the results to come
export function LoadingResults () {
  const { t } = useTranslation()
  return (
    <div role="status" aria-label={t('searching')} className="m:flex m:flex-col m:gap-2 m:px-3 m:py-3">
      <span className={sectionLabel}>{t('searching')}</span>
      {[70, 60, 75].map(w => (
        <div key={w} className="m:flex m:items-center m:gap-2 m:border m:border-gray-100 m:rounded-md m:p-2 m:animate-pulse">
          <span className="m:w-[26px] m:h-[26px] m:rounded-full m:bg-gray-100" />
          <span className="m:flex m:flex-col m:gap-1.5 m:flex-1">
            <span className="m:h-[7px] m:rounded m:bg-gray-100" style={{ width: w + '%' }} />
            <span className="m:h-[7px] m:rounded m:bg-gray-100" style={{ width: w / 2 + '%' }} />
          </span>
        </div>
      ))}
    </div>
  )
}

// A message of a service that found something, such as a word on the data. It is not an error, so it is told calmly
export function ResultNotice (props: { message: string }) {
  const { t } = useTranslation()
  return (
    <div role="status" className="m:flex m:gap-2.5 m:items-start m:mx-3 m:mt-3 m:px-3 m:py-2.5 m:rounded-md m:border m:border-blue-200 m:bg-blue-50">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f5f99" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="m:shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
      <span className="m:flex m:flex-col m:gap-0.5 m:min-w-0">
        <span className="m:text-[12px] m:font-semibold m:text-blue-950">{t('message from service')}</span>
        <span className="m:text-[12px] m:text-blue-950 m:break-words">{props.message}</span>
      </span>
    </div>
  )
}

// An error of the service, with its own text, and a way to try again
export function ResultError (props: { message: string, onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="m:flex m:gap-2.5 m:items-start m:mx-3 m:my-3 m:px-3 m:py-2.5 m:rounded-md m:border m:border-red-200 m:bg-red-50">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a3261b" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="m:shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16h.01" /></svg>
      <span className="m:flex m:flex-col m:gap-1.5 m:min-w-0">
        <span className="m:text-[13px] m:font-semibold m:text-red-900">{t('could not get results')}</span>
        <span className="m:text-[12px] m:text-red-900 m:break-words">{props.message}</span>
        {props.onRetry && <button type="button" onClick={props.onRetry} className="m:self-start m:text-[12px] m:font-semibold m:text-blue-700 m:hover:underline m:cursor-pointer">{t('try again')}</button>}
      </span>
    </div>
  )
}

// When the service found nothing
export function NoResults () {
  const { t } = useTranslation()
  return (
    <div className="m:flex m:flex-col m:items-center m:gap-2 m:text-center m:px-4 m:py-6">
      <span className="m:w-10 m:h-10 m:rounded-full m:bg-gray-100 m:text-gray-400 m:flex m:items-center m:justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4M8 11h6" /></svg>
      </span>
      <span className="m:text-[14px] m:font-semibold">{t('no hits')}</span>
      <span className="m:text-[12px] m:text-gray-600 m:leading-relaxed">{t('no hits help')}</span>
    </div>
  )
}
