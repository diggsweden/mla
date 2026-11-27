// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import { type IEntity } from '../../../interfaces/data-models'
import configService from '../../../services/configurationService'
import { setShownOnMap } from '../../../utils/chart-actions'
import { useTranslation } from 'react-i18next'

function MapTabPanel () {
  const { t } = useTranslation();
  const config = configService.getConfiguration()

  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const entities = useMainStore((state) => state.entities)

  const setShowMap = useAppStore((state) => state.setShowMap)
  const showMap = useAppStore((state) => state.showMap)

  if (config.MapConfiguration == null) {
    return null
  }

  function set (ids: IEntity[], show: boolean) {
    setShownOnMap(ids, show)
  }

  return <div className="m:flex m:text-center m:h-full m:p-1">
    <RibbonMenuSection title={t('map')} >
      <RibbonMenuButton active={showMap} label={t('map mode')} title={t('show map')} onClick={() => { setShowMap(!showMap) }} iconName="public" />
    </RibbonMenuSection>
    <RibbonMenuDivider />
    <RibbonMenuSection title={t('display')} >
      <RibbonMenuButton label={t('show')} disabled={(selectedEntities.length === 0) || !selectedEntities.some(e => e.ShowOnMap === false)} onClick={() => { set(selectedEntities, true) }} iconName="add_location_alt_fill" />
      <RibbonMenuButton label={t('hide')} disabled={(selectedEntities.length === 0) || !selectedEntities.some(e => e.ShowOnMap === true)} onClick={() => { set(selectedEntities, false) }} iconName="outlined_wrong_location" />
      <RibbonMenuButton label={t('show all')} onClick={() => { set(Object.values(entities).map(e => e[0]), true) }} iconName="add_location_alt_fill" />
      <RibbonMenuButton label={t('hide all')} onClick={() => { set(Object.values(entities).map(e => e[0]), false) }} iconName="wrong_location_fill" />
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </div>
}
export default MapTabPanel
