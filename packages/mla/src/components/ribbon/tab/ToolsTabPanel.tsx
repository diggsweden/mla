// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import configService from '../../../services/configurationService'
import useMainStore from '../../../store/main-store'
import { arrayDistinct, getId } from '../../../utils/utils'
import SelectToolbox from '../toolbox/SelectToolbox'

function ToolsTabPanel () {
  const selection = useMainStore((state) => state.selectedIds)
  const setSelected = useMainStore((state) => state.setSelected)
  const entities = useMainStore((state) => state.entities)

  function selectType (typeId: string) {
    const ids = Object.values(entities).filter(e => e[0].TypeId === typeId).map(e => getId(e[0]))
    const update = arrayDistinct([...ids, ...selection])
    setSelected(update)
  }

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title='Markera typ'>
      <RibbonMenuButtonGroup>
        {configService.getConfiguration().Domain.EntityTypes.filter(e => e.Internal !== true).map(e => (
          <RibbonMenuIconButton key={e.TypeId} onClick={() => { selectType(e.TypeId) }} label={(e.Name)} icon="location_searching"></RibbonMenuIconButton>
        ))}
      </RibbonMenuButtonGroup>
    </RibbonMenuSection>

    <RibbonMenuDivider />

    <SelectToolbox />
  </div>
}
export default ToolsTabPanel
