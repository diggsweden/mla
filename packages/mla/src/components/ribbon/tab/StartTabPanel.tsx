// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import CreateToolbox from '../toolbox/CreateToolbox'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuDivider from '../RibbonMenuDivider'
import GraphToolbox from '../toolbox/GraphToolbox'
import useMainStore from '../../../store/main-store'
import configService from '../../../services/configurationService'
import UndoToolbox from '../toolbox/UndoToolbox'

function StartTabPanel () {
  const config = configService.getConfiguration()
  const network = useMainStore((state) => state.network)

  function fit () {
    if (network) {
      network.fit()
    }
  }

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <CreateToolbox show={config.Menu?.Start?.Create} />
    <UndoToolbox show={config.Menu?.Start?.Undo} />
    <GraphToolbox show={config.Menu?.Start?.Tools} />

    <RibbonMenuSection title='Visa' visible={config.Menu?.Start?.ViewAll ?? true}>
      <RibbonMenuButton label='Visa allt' onClick={() => { fit() }} iconName="center_focus_strong"/>
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </div>
}
export default StartTabPanel
