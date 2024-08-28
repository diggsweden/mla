// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import useMainStore from '../../store/main-store'
import { getId } from '../../utils/utils'
import Icon from './Icon'

function Footer () {
  const selectedEntities = useMainStore((state) => state.selectedEntities())
  const dirty = useMainStore((state) => state.dirty)
  const network = useMainStore((state) => state.network)

  function fit (selection: boolean) {
    if (network) {
      network.fit(selection ? { nodes: selectedEntities.map(e => getId(e)) } : undefined)
    }
  }

  return (
    <footer className="h-5 flex flex-row w-full border-t border-gray-300 bg-gray-50">
      <span className={(!dirty ? 'hidden ' : '') + 'ml-1'}>Det finns osparade ändringar,</span>
      <div className='flex-1'></div>
      <span className=''>
        <button className="pr-3" onClick={() => { fit(false) }}><Icon className='h-3 inline-block mr-1' name="monitor" />Visa allt</button>
        <button disabled={selectedEntities.length === 0} className='disabled:opacity-50 mr-2' onClick={() => { fit(true) }}><Icon className='h-3 inline-block mr-1' name="screenshot_monitor" />Visa markerade</button>
      </span>
    </footer>
  )
}

export default Footer
