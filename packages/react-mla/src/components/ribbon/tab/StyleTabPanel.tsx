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
import RibbonMenuDropDownIconButton from '../RibbonMenuDropDownIconButton'
import { type LinkDashStyle } from '../../../interfaces/data-models'
import { useTranslation } from 'react-i18next'

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

  const colorClass = "m-w-4 m-h-4 m-outline-1 m-outline-blue-400 hover:m-outline"
  return <div className="m-flex m-text-center m-h-full m-p-1">
    <RibbonMenuSection title={t('look feel')} >
      <RibbonMenuButtonGroup>
        <RibbonMenuDropDownIconButton disabled={selection.length === 0} label={t('outline')} icon="outlined_radio_button_unchecked">
          {(config.CustomContourColorPicklist != null && config.CustomContourColorPicklist.length > 0) &&
            <div>
              <div className="m-bg-gray-200 m-py-1 m-px-2 m-text-sm m-font-semibold m-border-none">{t('theme colors')}</div>
              <div className="m-grid m-grid-cols-6 m-gap-1 m-p-1">
                { config.CustomContourColorPicklist.map(c => (
                  <div key={c.Name} title={c.Name} onClick={() => { setContourColor(c.Color) } } className={colorClass} style={ { backgroundColor: c.Color } }></div>
                ))}
              </div>
            </div>
          }
          <div className="m-bg-gray-200 m-py-1 m-px-2 m-text-sm m-font-semibold">{('default colors')}</div>
          <div className="m-flex m-gap-1 m-p-1">
            <div key={'blue'} title={t('blue')} onClick={() => { setContourColor('#4169E1') } } className={colorClass} style={ { backgroundColor: '#4169E1' } }></div>
            <div key={'green'} title={t('green')} onClick={() => { setContourColor('#008000') } } className={colorClass} style={ { backgroundColor: '#008000' } }></div>
            <div key={'red'} title={t('red')} onClick={() => { setContourColor('#FF4040') } } className={colorClass} style={ { backgroundColor: '#FF4040' } }></div>
            <div key={'yellow'} title={t('yellow')} onClick={() => { setContourColor('#FFD700') } } className={colorClass} style={ { backgroundColor: '#FFD700' } }></div>
            <div key={'purple'} title={t('purple')} onClick={() => { setContourColor('#800080') } } className={colorClass} style={ { backgroundColor: '#800080' } }></div>
            <div key={'organge'} title={t('organge')} onClick={() => { setContourColor('#FFA500') } } className={colorClass} style={ { backgroundColor: '#FFA500' } }></div>
          </div>
          <div className="m-flex m-text-sm m-text-left m-border-none hover:m-bg-blue-100 m-text-gray-700 m-p-1 m-whitespace-nowrap" onClick={() => { setContourColor(undefined) } } >
            <div className="m-w-4 m-h-4 m-border m-bg-gray-100 m-border-gray-400 m-mr-2"></div>
            {t('reset color')}
          </div>
        </RibbonMenuDropDownIconButton>
        <RibbonMenuDropDownIconButton disabled={selection.length === 0} label={t('icon color')} icon="outlined_border_color">
          {(config.CustomIconColorPicklist != null && config.CustomIconColorPicklist.length > 0) &&
            <div>
              <div className="m-bg-gray-200 m-py-1 m-px-2 m-text-sm m-font-semibold m-border-none">{t('theme colors')}</div>
              <div className="m-grid m-grid-cols-6 m-gap-1 m-p-1">
                { config.CustomIconColorPicklist.map(c => (
                  <div key={c.Name} title={c.Name} onClick={() => { setIconColor(c.Color) } } className={colorClass} style={ { backgroundColor: c.Color } }></div>
                ))}
              </div>
            </div>
          }
          <div className="m-bg-gray-200 m-py-1 m-px-2 m-text-sm m-font-semibold">{t('default colors')}</div>
          <div className="m-flex m-gap-1 m-p-1">
          <div key={'blue'} title={t('blue')} onClick={() => { setIconColor('#4169E1') } } className={colorClass} style={ { backgroundColor: '#4169E1' } }></div>
            <div key={'green'} title={t('green')} onClick={() => { setIconColor('#008000') } } className={colorClass} style={ { backgroundColor: '#008000' } }></div>
            <div key={'red'} title={t('red')} onClick={() => { setIconColor('#FF4040') } } className={colorClass} style={ { backgroundColor: '#FF4040' } }></div>
            <div key={'yellow'} title={t('yellow')} onClick={() => { setIconColor('#FFD700') } } className={colorClass} style={ { backgroundColor: '#FFD700' } }></div>
            <div key={'purple'} title={t('purple')} onClick={() => { setIconColor('#800080') } } className={colorClass} style={ { backgroundColor: '#800080' } }></div>
            <div key={'organge'} title={t('organge')} onClick={() => { setIconColor('#FFA500') } } className={colorClass} style={ { backgroundColor: '#FFA500' } }></div>
          </div>
          <div className="flex text-sm text-left border-none hover:bg-blue-100 text-gray-700 p-1 whitespace-nowrap" onClick={() => { setIconColor(undefined) } } >
            <div className="m-w-4 m-h-4 m-border m-bg-gray-100 m-border-gray-400 m-mr-2"></div>
            {t('reset color')}
          </div>
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
