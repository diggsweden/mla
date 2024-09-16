// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useMemo } from 'react'
import RibbonMenuDivider from '../RibbonMenuDivider'
import RibbonMenuSection from '../RibbonMenuSection'
import configService from '../../../services/configurationService'
import RibbonMenuIconButton from '../RibbonMenuIconButton'
import useSearchStore from '../../../store/search-state'

interface Props {
  show?: boolean
}

export default function ImportTool (props: Props) {
  const setImportTool = useSearchStore(state => state.setImportTool)

  const config = configService.getConfiguration()

  const importToolsAvailable = useMemo(() => {
    return (config.Integrations?.Import?.length ?? 0) > 0
  }, [config])

  if (props.show === false || !importToolsAvailable) {
    return null
  }

  return (<>
    <RibbonMenuSection title='Importera'>
      { configService.getImportServices().map(e => (
        <RibbonMenuIconButton key={e.Id} label={e.Name} title={e.Name} icon={e.Icon ?? 'upload_file'} onClick={() => { setImportTool(e.Id) }}></RibbonMenuIconButton>
      ))}
    </RibbonMenuSection>
    <RibbonMenuDivider/>
  </>)
}
