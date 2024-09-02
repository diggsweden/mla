// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { produce } from 'immer'
import useMainStore from '../../../store/main-store'
import viewService from '../../../services/viewService'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import RibbonMenuDropDownIconButton from '../RibbonMenuDropDownIconButton'
import { type LinkDashStyle } from '../../../interfaces/data-models'

function StyleTabPanel () {
  const config = viewService.getTheme()
  const selection = useMainStore((state) => state.selectedIds)
  const selectedEntities = useMainStore((state) => state.selectedEntities())
  const selectedLinks = useMainStore((state) => state.selectedLinks())

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
    <RibbonMenuSection title='Utseende' >
      <RibbonMenuButtonGroup>
        <RibbonMenuDropDownIconButton disabled={selection.length === 0} label="Kontur" icon="outlined_radio_button_unchecked">
          {(config.CustomContourColorPicklist != null && config.CustomContourColorPicklist.length > 0) &&
            <div>
              <div className="m-bg-gray-200 m-py-1 m-px-2 m-text-sm m-font-semibold m-border-none">Temafärger</div>
              <div className="m-grid m-grid-cols-6 m-gap-1 m-p-1">
                { config.CustomContourColorPicklist.map(c => (
                  <div key={c.Name} title={c.Name} onClick={() => { setContourColor(c.Color) } } className={colorClass} style={ { backgroundColor: c.Color } }></div>
                ))}
              </div>
            </div>
          }
          <div className="m-bg-gray-200 m-py-1 m-px-2 m-text-sm m-font-semibold">Standardfärger</div>
          <div className="m-flex m-gap-1 m-p-1">
            <div key={'Blue'} title={'Blå'} onClick={() => { setContourColor('#4169E1') } } className={colorClass} style={ { backgroundColor: '#4169E1' } }></div>
            <div key={'Green'} title={'Grön'} onClick={() => { setContourColor('#008000') } } className={colorClass} style={ { backgroundColor: '#008000' } }></div>
            <div key={'Red'} title={'Röd'} onClick={() => { setContourColor('#FF4040') } } className={colorClass} style={ { backgroundColor: '#FF4040' } }></div>
            <div key={'Yellow'} title={'Gul'} onClick={() => { setContourColor('#FFD700') } } className={colorClass} style={ { backgroundColor: '#FFD700' } }></div>
            <div key={'Purple'} title={'Lila'} onClick={() => { setContourColor('#800080') } } className={colorClass} style={ { backgroundColor: '#800080' } }></div>
            <div key={'Organge'} title={'Organge'} onClick={() => { setContourColor('#FFA500') } } className={colorClass} style={ { backgroundColor: '#FFA500' } }></div>
          </div>
          <div className="m-flex m-text-sm m-text-left m-border-none hover:m-bg-blue-100 m-text-gray-700 m-p-1 m-whitespace-nowrap" onClick={() => { setContourColor(undefined) } } >
            <div className="m-w-4 m-h-4 m-border m-bg-gray-100 m-border-gray-400 m-mr-2"></div>
            Återställ färg
          </div>
        </RibbonMenuDropDownIconButton>
        <RibbonMenuDropDownIconButton disabled={selection.length === 0} label="Ikonfärg" icon="outlined_border_color">
          {(config.CustomIconColorPicklist != null && config.CustomIconColorPicklist.length > 0) &&
            <div>
              <div className="m-bg-gray-200 m-py-1 m-px-2 m-text-sm m-font-semibold m-border-none">Temafärger</div>
              <div className="m-grid m-grid-cols-6 m-gap-1 m-p-1">
                { config.CustomIconColorPicklist.map(c => (
                  <div key={c.Name} title={c.Name} onClick={() => { setIconColor(c.Color) } } className={colorClass} style={ { backgroundColor: c.Color } }></div>
                ))}
              </div>
            </div>
          }
          <div className="m-bg-gray-200 m-py-1 m-px-2 m-text-sm m-font-semibold">Standardfärger</div>
          <div className="m-flex m-gap-1 m-p-1">
            <div key={'Blue'} title={'Blå'} onClick={() => { setIconColor('#4169E1') } } className={colorClass} style={ { backgroundColor: '#4169E1' } }></div>
            <div key={'Green'} title={'Grön'} onClick={() => { setIconColor('#008000') } } className={colorClass} style={ { backgroundColor: '#008000' } }></div>
            <div key={'Red'} title={'Röd'} onClick={() => { setIconColor('#FF4040') } } className={colorClass} style={ { backgroundColor: '#FF4040' } }></div>
            <div key={'Yellow'} title={'Gul'} onClick={() => { setIconColor('#FFD700') } } className={colorClass} style={ { backgroundColor: '#FFD700' } }></div>
            <div key={'Purple'} title={'Lila'} onClick={() => { setIconColor('#800080') } } className={colorClass} style={ { backgroundColor: '#800080' } }></div>
            <div key={'Organge'} title={'Organge'} onClick={() => { setIconColor('#FFA500') } } className={colorClass} style={ { backgroundColor: '#FFA500' } }></div>
          </div>
          <div className="flex text-sm text-left border-none hover:bg-blue-100 text-gray-700 p-1 whitespace-nowrap" onClick={() => { setIconColor(undefined) } } >
            <div className="m-w-4 m-h-4 m-border m-bg-gray-100 m-border-gray-400 m-mr-2"></div>
            Återställ färg
          </div>
        </RibbonMenuDropDownIconButton>
      </RibbonMenuButtonGroup>

      <RibbonMenuButtonGroup>
        <RibbonMenuIconButton disabled={selectedLinks.length === 0} onClick={() => { setLinkStyle('LINE') }} label="Heldragen länk" icon="line_style" />
        <RibbonMenuIconButton disabled={selectedLinks.length === 0} onClick={() => { setLinkStyle('DASHED') }} label="Streckad länk" icon="line_style" />
        <RibbonMenuIconButton disabled={selectedLinks.length === 0} onClick={() => { setLinkStyle('DOTTED') }} label="Prickad länk" icon="line_style" />
      </RibbonMenuButtonGroup>

    </RibbonMenuSection>

    <RibbonMenuDivider />
  </div>
}
export default StyleTabPanel
