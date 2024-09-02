// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import useAppStore from '../../../store/app-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import configService from '../../../services/configurationService'
import type { ChangeEvent } from 'react'

function LayoutTabPanel () {
  const config = configService.getConfiguration()
  const setLayout = useAppStore((state) => state.setLayout)
  const view = useAppStore((state) => state.view)
  const setView = useAppStore((state) => state.setView)
  const layoutId = useAppStore((state) => state.layoutId)

  function changeView (event: ChangeEvent<HTMLSelectElement>) {
    const viewId = event.target.value
    setView(viewId)
  }

  function toggleDynamic () {
    if (layoutId === 'Dynamic') {
      setLayout('reset')
    } else {
      setLayout('Dynamic')
    }
  }

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title='Placering' >
      <RibbonMenuButton label='Upp' onClick={() => { setLayout('UD') }} iconName="outlined_account_tree" iconClassName="-rotate-90 -scale-x-100"/>
      <RibbonMenuButton label='Ner' onClick={() => { setLayout('DU') }} iconName="outlined_account_tree" iconClassName="-rotate-90"/>
      <RibbonMenuButton label='Vänster' onClick={() => { setLayout('LR') }} iconName="outlined_account_tree"/>
      <RibbonMenuButton label='Höger' onClick={() => { setLayout('RL') }} iconName="outlined_account_tree" iconClassName="-rotate-180"/>
      <RibbonMenuButton label={layoutId === 'Dynamic' ? 'Stopp' : 'Dynamisk'} onClick={() => { toggleDynamic() }} iconName="autorenew" iconClassName={layoutId === 'Dynamic' ? 'animate-spin' : ''}/>
    </RibbonMenuSection>
    <RibbonMenuDivider />
    <RibbonMenuSection title='Vyer'>
      <select onChange={changeView} value={view} className="m-bg-white m-border m-border-gray-300 m-text-gray-900 m-rounded-lg focus:m-ring-blue-500 focus:m-border-blue-500 m-block m-w-full m-p-1">
        {config.Display.map(e => (
          <option key={e.Id} value={e.Id}>{e.Name}</option>
        ))}
      </select>
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </div>
}
export default LayoutTabPanel
