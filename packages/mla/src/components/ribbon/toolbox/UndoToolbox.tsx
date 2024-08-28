// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import useMainStore from '../../../store/main-store'
import RibbonMenuButtonGroup from '../RibbonMenuButtonGroup'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import RibbonMenuSection from '../RibbonMenuSection'

interface Props {
  show?: boolean
}

export default function UndoTool (props: Props) {
  const undo = useMainStore((state) => state.undo)
  const canUndo = useMainStore((state) => state.canUndo)
  const redo = useMainStore((state) => state.redo)
  const canRedo = useMainStore((state) => state.canRedo)

  if (props.show === false) {
    return null
  }

  return (<>
    <RibbonMenuSection title='Ångra' >
      <RibbonMenuButtonGroup>
        <RibbonMenuIconButton label='Föregående' disabled={!canUndo} onClick={undo} icon="outlined_undo" />
        <RibbonMenuIconButton label='Nästa' disabled={!canRedo} onClick={redo} icon="outlined_redo" />
      </RibbonMenuButtonGroup>
    </RibbonMenuSection>
    <RibbonMenuDivider />
  </>
  )
}
