// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { fitViewportToNodes } from '@sigma/utils'
import { useTranslation } from 'react-i18next'
import configService from '../../../services/configurationService'
import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuSection from '../RibbonMenuSection'
import CreateToolbox from '../toolbox/CreateToolbox'
import GraphToolbox from '../toolbox/GraphToolbox'
import UndoToolbox from '../toolbox/UndoToolbox'

function StartTabPanel() {
  const { t } = useTranslation();
  const config = configService.getConfiguration()
  const sigma = useMainStore((state) => state.sigma)
  const graph = useMainStore((state) => state.graph)

  function fit() {
    if (sigma && graph && graph.nodes().length) {
      fitViewportToNodes(
        sigma,
        graph.filterNodes(() => true),
        { animate: true },
      );
    }
  }

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <CreateToolbox show={config.Menu?.Start?.Create} />
    <UndoToolbox show={config.Menu?.Start?.Undo} />
    <GraphToolbox show={config.Menu?.Start?.Tools} />

    <RibbonMenuSection title={t('show')} visible={config.Menu?.Start?.ViewAll ?? true}>
      <RibbonMenuButton label={t('show all')} onClick={() => { fit() }} iconName="center_focus_strong" />
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </div>
}
export default StartTabPanel
