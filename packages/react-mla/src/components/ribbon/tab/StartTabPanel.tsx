// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import CreateToolbox from '../toolbox/CreateToolbox'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuDivider from '../RibbonMenuDivider'
import GraphToolbox from '../toolbox/GraphToolbox'
import useMainStore from '../../../store/main-store'
import configService from '../../../services/configurationService'
import UndoToolbox from '../toolbox/UndoToolbox'
import { useTranslation } from 'react-i18next'

function StartTabPanel () {
  const { t } = useTranslation();
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

    <RibbonMenuSection title={t('show')} visible={config.Menu?.Start?.ViewAll ?? true}>
      <RibbonMenuButton label={t('show all')} onClick={() => { fit() }} iconName="center_focus_strong"/>
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </div>
}
export default StartTabPanel
