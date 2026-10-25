// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useState } from 'react'

import './i18n'
import configService from './services/configurationService'
import iconService from './services/iconService'
import viewService from './services/viewService'
import workflowService from './services/workflowService'
import { getContextValue } from './utils/context'
import queryService from './services/queryService'
import useMainStore from './store/main-store'
import useAppStore from './store/app-store'
import Spinner from './components/common/Spinner'
import ErrorBoundary from './components/common/ErrorBoundary'
import App from './App'

import './MLA.css'
import { useTranslation } from 'react-i18next'

export interface MlaProps {
  config?: string
  configSrc?: string
  context?: string
  publicUrl?: string
  workflowId?: string
}

async function load (props: MlaProps) {
  if (props.config) {
    await configService.init(props.config, props.publicUrl)
  } else if (props.configSrc) {
    await configService.initFromUrl(props.configSrc, props.publicUrl)
  } else {
    throw new Error('missing config or configSrc')
  }

  useMainStore.getState().setContext(props.context ?? '')
  viewService.init()
  useAppStore.getState().setView('default')
  iconService.init()
  await viewService.preloadIcons()

  const fileId = getContextValue(props.context ?? '', 'fileId')
  if (fileId) {
    const result = await queryService.openFile()
    if (result) {
      useMainStore.getState().open(result)
    }
  }

  if (props.workflowId) {
    void workflowService.execute(props.workflowId)
  }
}

// The services and the stores are shared, so the component is only loaded once, also when React mounts it twice
let loading: Promise<void> | undefined
async function start (props: MlaProps) {
  if (configService.isConfigured()) {
    return
  }

  loading ??= load(props).finally(() => { loading = undefined })
  await loading
}

export function MLA (props: MlaProps) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    start(props)
      .then(() => { setReady(true) })
      .catch((e: unknown) => {
        console.error(e)
        setError(e instanceof Error ? e.message : String(e))
      })
  }, [props])

  const { t } = useTranslation()
  return (
    <div className='mla-component'>
      { !ready &&
        <div id="loader">
          <h1>{error == null ? t('starting') : t('start failed')}</h1>
          {error != null && <p>{error}</p>}
          {error == null &&
            <div className="m:h-16 m:w-16 m:m-auto">
              <Spinner />
            </div>
          }
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
