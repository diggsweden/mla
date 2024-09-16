// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useState } from 'react'

import configService from './services/configurationService'
import iconService from './services/iconService'
import viewService from './services/viewService'
import workflowService from './services/workflowService'
import { getContextValue } from './utils/utils'
import queryService from './services/queryService'
import useMainStore from './store/main-store'
import Spinner from './components/common/Spinner'
import ErrorBoundary from './components/common/ErrorBoundary'
import App from './App'

import './MLA.scss'
import { useTranslation } from 'react-i18next'

import i18n from "i18next";
import { initReactI18next } from 'react-i18next'
import en from '../i18n/en.json'
import sv from '../i18n/sv.json'

i18n
.use(initReactI18next)
.init({
  resources: {
    en: { translation: en },
    sv: { translation: sv }
  },
  fallbackLng: "sv",
  interpolation: {
    escapeValue: false // react already safes from xss
  }
});

export interface MlaProps {
  config?: string
  configSrc?: string
  context?: string
  publicUrl?: string
  workflowId?: string
}

export function MLA (props: MlaProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init () {
      if (configService.isConfigured()) {
        return
      }

      if (props.config) {
        await configService.init(props.config, props.context, props.publicUrl)
      } else if (props.configSrc) {
        await configService.init_src(props.configSrc, props.context, props.publicUrl)
      } else {
        throw new Error('missing config or configSrc')
      }

      useMainStore.getState().setContext(props.context ?? '')
      viewService.init()
      await iconService.init()

      const fileId = getContextValue(props.context ?? '', 'fileId')
      if (fileId) {
        const result = await queryService.OpenFile()
        if (result) {
          useMainStore.getState().open(result)
        }
      }

      if (props.workflowId) {
        void workflowService.Execute(props.workflowId)
      }

      setReady(true)
    }

    void init()
  }, [props])

  const { t } = useTranslation()
  return (
    <div className='mla-component'>
      { !ready &&
        <div id="loader">
          <h1>{t('starting')}</h1>
          <div className="m-h-16 m-w-16 m-m-auto">
            <Spinner />
          </div>
        </div>
      }
      { ready &&
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
      }
    </div>
  )
}
