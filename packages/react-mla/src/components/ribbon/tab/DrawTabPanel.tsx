// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import { useTranslation } from 'react-i18next'

function DrawTabPanel () {
  const { t } = useTranslation();

  const fabric = useMainStore((state) => state.fabric)

  console.log(fabric)
 
  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title={t('diagram')} >
      <RibbonMenuButton label={t('save')} onClick={() => {}} iconName="save" />
    </RibbonMenuSection>
    <RibbonMenuDivider />

    <RibbonMenuSection title={t('share')} >
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </div>
}
export default DrawTabPanel
