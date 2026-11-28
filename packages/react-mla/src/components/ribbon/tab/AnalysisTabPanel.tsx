// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useRef, useState } from 'react'
import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import Modal from '../../common/Modal'
import useAnalysisStore from '../../../store/analysis-store'
import PhaseDialog from '../../modal/PhaseDialog'
import GraphToolbox from '../toolbox/GraphToolbox'
import configService from '../../../services/configurationService'
import EventFilterTool from '../../tools/EventFilterTool'
import type { IEventFilter } from '../../../interfaces/configuration/event-operations'
import TableTool from '../../tools/TableTool'
import { useTranslation } from 'react-i18next'

function AnalysisTabPanel () {
  const { t } = useTranslation();
  const config = configService.getConfiguration()
  const history = useAppStore((state) => state.historyMode)
  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const selectedLinks = useMainStore((state) => state.selectedLinks)
  const setHistory = useAppStore((state) => state.setHistoryMode)
  const min = useMainStore((state) => state.minDate)
  const setDate = useMainStore((state) => state.setDate)
  const setSelected = useMainStore((state) => state.setSelected)
  const events = useMainStore((state) => state.events)
  const setFilter = useMainStore((state) => state.setEventFilter)

  const analysisView = useAnalysisStore((state) => state.view)
  const openView = useAnalysisStore((state) => state.open)
  const closeView = useAnalysisStore((state) => state.close)
  // The time line, the phase analysis and the event flow are shown one at a time
  const toggleView = (view: 'phase' | 'timeline') => {
    if (analysisView === view) {
      closeView()
    } else {
      if (history) setHistory(false)
      openView(view)
    }
  }
  const [showPhaseEventModal, setShowModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showTableTool, setShowTableTool] = useState(false)

  function toggleHistory () {
    if (!history) closeView()
    setHistory(!history)
    // The timeline starts at the first date, with nothing selected
    setSelected([])
    setDate(min)
  }

  const updatedFilter = useRef<Record<string, IEventFilter[] | undefined>>({})
  function filterChanged (e: Record<string, IEventFilter[] | undefined>) {
    updatedFilter.current = e
  }

  function saveFilter () {
    setFilter(updatedFilter.current)
  }

  return (<>
    <div className="m:flex m:text-center m:h-full m:p-1">
      <GraphToolbox />

      <RibbonMenuSection title={t('show as table')} >
        <RibbonMenuButton label={t('entities')} title={t('entities as table')} disabled={selectedEntities.length === 0} onClick={() => { setShowTableTool(true) }} iconName="apps" />
        <RibbonMenuButton label={t('events')} title={t('events as table')} disabled={Object.keys(events).length === 0} onClick={() => { setShowEventModal(true) }} iconName="date_range" />
      </RibbonMenuSection>
      <RibbonMenuDivider />

      {config.TimeAnalysis != null && <>
        <RibbonMenuSection title={t('time analysis')} >
          <RibbonMenuButton label={t('timeline')} active={history} onClick={() => { toggleHistory() }} iconName="straighten" />
          <RibbonMenuButton label={t('phases')} onClick={() => { setShowModal(true) }} iconName="add_column_right" />
          <RibbonMenuButton label={t('phase analysis')} active={analysisView === 'phase'} onClick={() => { toggleView('phase') }} iconName="outlined_view_week" />
          <RibbonMenuButton label={t('event flow')} active={analysisView === 'timeline'} onClick={() => { toggleView('timeline') }} iconName="view_timeline" />
        </RibbonMenuSection>

        <RibbonMenuDivider />
      </>}

      {showPhaseEventModal && <PhaseDialog onClose={() => { setShowModal(false) }} />}
      {showEventModal &&
        <Modal mode='save' wide={true} show={showEventModal} title={t('events')} onNegative={() => { setShowEventModal(false) }} onPositive={() => { saveFilter(); setShowEventModal(false) }}>
          <EventFilterTool items={Object.values(events).flat()} onChange={filterChanged} />
        </Modal>
      }
    </div>
    { showTableTool &&
      <Modal mode={'ok'} wide={true} show={showTableTool} title={t('table data')} onNegative={() => { setShowTableTool(false) }} onPositive={() => { setShowTableTool(false) }}>
        <TableTool items={[...selectedEntities, ...selectedLinks]} />
      </Modal>
    }
  </>)      
  }
export default AnalysisTabPanel
