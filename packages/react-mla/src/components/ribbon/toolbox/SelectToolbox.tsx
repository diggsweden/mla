// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useTranslation } from 'react-i18next'
import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuSection from '../RibbonMenuSection'

interface Props {
  show?: boolean
}

export default function SelectTool (props: Props) {
  const { t } = useTranslation()
  const selection = useMainStore((state) => state.selectedIds)
  const setSelected = useMainStore((state) => state.setSelected)
  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)

  function invert () {
    const inverse = [...Object.keys(entities), ...Object.keys(links)].filter(id => !selection.includes(id))
    setSelected(inverse)
  }

  function selectAll () {
    setSelected([...Object.keys(entities), ...Object.keys(links)])
  }

  if (props.show === false) {
    return null
  }

  return (<>
    <RibbonMenuSection title={t('select')}>
      <RibbonMenuButton disabled={selection.length === 0} onClick={() => { invert() }} label={t('invert')} title={t('invert desc')} iconName="deselect"></RibbonMenuButton>
      <RibbonMenuButton onClick={() => { selectAll() }} label={t('all')} title={t('all desc')} iconName="select_all"></RibbonMenuButton>
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </>
  )
}
