// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useMainStore from '../../../store/main-store'
import viewService from '../../../services/viewService'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import RibbonMenuDropDownIconButton from '../RibbonMenuDropDownIconButton'
import ColorPalette from '../../common/ColorPalette'
import { type LinkDashStyle } from '../../../interfaces/data-models'
import { useTranslation } from 'react-i18next'
import { setIconColor as setColor, setContourColor as setContour, setLinkStyle as setStyle } from '../../../utils/chart-actions'

function StyleTabPanel () {
  const { t } = useTranslation();
  const config = viewService.getTheme()
  const selection = useMainStore((state) => state.selectedIds)
  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const selectedLinks = useMainStore((state) => state.selectedLinks)

  function setIconColor (color: string | undefined) {
    setColor(selectedEntities, selectedLinks, color)
  }

  function setContourColor (color: string | undefined) {
    setContour(selectedEntities, selectedLinks, color)
  }

  function setLinkStyle (style: LinkDashStyle | undefined) {
    setStyle(selectedLinks, style)
  }

  return <div className="m:flex m:text-center m:h-full m:p-1">
    <RibbonMenuSection title={t('look feel')} >
      <RibbonMenuButtonGroup>
        <RibbonMenuDropDownIconButton disabled={selection.length === 0} label={t('outline')} icon="outlined_radio_button_unchecked">
          <ColorPalette colors={config.CustomContourColorPicklist} onSelect={setContourColor} />
        </RibbonMenuDropDownIconButton>
        <RibbonMenuDropDownIconButton disabled={selection.length === 0} label={t('icon color')} icon="outlined_border_color">
          <ColorPalette colors={config.CustomIconColorPicklist} onSelect={setIconColor} />
        </RibbonMenuDropDownIconButton>
      </RibbonMenuButtonGroup>

      <RibbonMenuButtonGroup>
        <RibbonMenuIconButton disabled={selectedLinks.length === 0} onClick={() => { setLinkStyle('LINE') }} label={(t('line link'))} icon="line_style" />
        <RibbonMenuIconButton disabled={selectedLinks.length === 0} onClick={() => { setLinkStyle('DASHED') }} label={(t('dashed link'))} icon="line_style" />
        <RibbonMenuIconButton disabled={selectedLinks.length === 0} onClick={() => { setLinkStyle('DOTTED') }} label={(t('dotted link'))} icon="line_style" />
      </RibbonMenuButtonGroup>

    </RibbonMenuSection>

    <RibbonMenuDivider />
  </div>
}

export default StyleTabPanel
