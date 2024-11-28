// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { produce } from 'immer'
import useMainStore from '../../../store/main-store'
import viewService from '../../../services/viewService'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import { type LinkDashStyle } from '../../../interfaces/data-models'
import { useTranslation } from 'react-i18next'
import RibbonMenuColorPickerButton from '../RibbonMenuColorPickerButton'

function StyleTabPanel () {
  const { t } = useTranslation();
  const config = viewService.getTheme()
  const selection = useMainStore((state) => state.selectedIds)
  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const selectedLinks = useMainStore((state) => state.selectedLinks)

  const updateEntity = useMainStore((state) => state.updateEntity)
  const updateLink = useMainStore((state) => state.updateLink)

  function setIconColor (color: string | undefined) {
    updateEntity(
      ...selectedEntities.map(e => produce(e, draft => {
        draft.Color = color
      }))
    )
    updateLink(
      ...selectedLinks.map(e => produce(e, draft => {
        draft.Color = color
      }))
    )
  }

  function setContourColor (color: string | undefined) {
    console.log(color)
    updateEntity(
      ...selectedEntities.map(e => produce(e, draft => {
        draft.MarkColor = color
        draft.MarkIcon = color !== undefined ? 'outlined_circle' : undefined
      }))
    )
    updateLink(
      ...selectedLinks.map(e => produce(e, draft => {
        draft.MarkColor = color
      }))
    )
  }

  function setLinkStyle (style: LinkDashStyle | undefined) {
    updateLink(
      ...selectedLinks.map(e => produce(e, draft => {
        draft.Style = style
      }))
    )
  }

  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title={t('look feel')} >
      <RibbonMenuButtonGroup>
        <RibbonMenuColorPickerButton disabled={selection.length === 0} label={t('outline')} colors={ config.CustomContourColorPicklist } onColorSelected={(color) => { setContourColor(color) }} icon="outlined_radio_button_unchecked"></RibbonMenuColorPickerButton>
        <RibbonMenuColorPickerButton disabled={selection.length === 0} label={t('icon color')} colors={ config.CustomIconColorPicklist } onColorSelected={(color) => { setIconColor(color) }}  icon="outlined_border_color"></RibbonMenuColorPickerButton>
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
