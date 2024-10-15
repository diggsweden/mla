// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from 'react-i18next'
import useMainStore from '../../store/main-store'
import { getId } from '../../utils/utils'
import Icon from './Icon'

function Footer () {
  const { t } = useTranslation()
  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const dirty = useMainStore((state) => state.dirty)
  const network = useMainStore((state) => state.network)

  function fit (selection: boolean) {
    if (network) {
      network.fit(selection ? { nodes: selectedEntities.map(e => getId(e)) } : undefined)
    }
  }

  return (
    <footer className="m-h-5 m-flex m-flex-row m-w-full m-border-t m-border-gray-300 m-bg-gray-50">
      <span className={(!dirty ? 'm-hidden ' : '') + 'm-ml-1'}>{t('unsaved changes')}</span>
      <div className="m-flex-1"></div>
      <span className=''>
        <button className="m-pr-3" onClick={() => { fit(false) }}><Icon className="m-h-3 m-inline-block m-mr-1" name="monitor" />{t('show all')}</button>
        <button disabled={selectedEntities.length === 0} className='disabled:opacity-50 m-mr-2' onClick={() => { fit(true) }}><Icon className="m-h-3 m-inline-block m-mr-1" name="screenshot_monitor" />{t('show selected')}</button>
      </span>
    </footer>
  )
}

export default Footer
