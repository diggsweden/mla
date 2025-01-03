// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type ChangeEvent, useRef, useState } from 'react'
import type { IPhaseEvent } from '../../../interfaces/data-models'
import useAppStore from '../../../store/app-store'
import useMainStore from '../../../store/main-store'
import RibbonMenuButton from '../RibbonMenuButton'
import RibbonMenuSection from '../RibbonMenuSection'
import RibbonMenuDivider from '../RibbonMenuDivider'
import Modal from '../../common/Modal'
import ActivityAnalysis from '../../modal/ActivityAnalysis'
import PhaseCreator from '../../modal/PhaseCreator'
import GraphToolbox from '../toolbox/GraphToolbox'
import configService from '../../../services/configurationService'
import { toDateString } from '../../../utils/date'
import EventFilterTool from '../../tools/EventFilterTool'
import type { IEventFilter } from '../../../interfaces/configuration/event-operations'
import TableTool from '../../tools/TableTool'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'

type IntervalType = 'day' | 'week' | 'month' | 'custom'

function AnalysisTabPanel () {
  const { t } = useTranslation();
  const config = configService.getConfiguration()
  const history = useAppStore((state) => state.historyMode)
  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const selectedLinks = useMainStore((state) => state.selectedLinks)
  const setHistory = useAppStore((state) => state.setHistoryMode)
  const date = useMainStore((state) => state.currentDate)
  const min = useMainStore((state) => state.minDate)
  const max = useMainStore((state) => state.maxDate)
  const setDate = useMainStore((state) => state.setDate)
  const interval = useMainStore((state) => state.interval)
  const setInterval = useMainStore((state) => state.setInterval)
  const setTimespan = useMainStore((state) => state.setTimespan)
  const events = useMainStore((state) => state.events)
  const setFilter = useMainStore((state) => state.setEventFilter)

  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [showPhaseEventModal, setShowModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showTableTool, setShowTableTool] = useState(false)

  const setEvent = useMainStore((state) => state.setPhaseEvent)
  const [updateEvent, setUpdateEvent] = useState(undefined as undefined | IPhaseEvent)

  function toggleHistory () {
    setHistory(!history)
  }

  function addEvent () {
    if (updateEvent) {
      setEvent(updateEvent)
    }
    setUpdateEvent(undefined)
    setShowModal(false)
  }

  function dateChanged (e: ChangeEvent<HTMLInputElement>) {
    if (e.target.valueAsDate != null) {
      setDate(DateTime.fromJSDate(e.target.valueAsDate))
    }
  }

  function dateToChanged (e: ChangeEvent<HTMLInputElement>) {
    if (e.target.valueAsDate != null) {
      setTimespan({ DateFrom: date.DateFrom, DateTo: DateTime.fromJSDate(e.target.valueAsDate) })
    }
  }

  const updatedFilter = useRef<Record<string, IEventFilter[] | undefined>>({})
  function filterChanged (e: Record<string, IEventFilter[] | undefined>) {
    updatedFilter.current = e
  }

  function saveFilter () {
    setFilter(updatedFilter.current)
  }

  const timePickerClass = "m-bg-white m-border m-border-gray-300 m-text-gray-900 m-rounded-lg focus:m-ring-blue-500 focus:m-border-blue-500 m-block m-w-full m-px-1 m-cursor-pointer"
  return (<>
    <div className="m-flex m-text-center m-h-full m-p-1">
      <GraphToolbox />

      <RibbonMenuSection title={t('show as table')} >
        <RibbonMenuButton label={t('entities')} title={t('entities as table')} disabled={selectedEntities.length === 0} onClick={() => { setShowTableTool(true) }} iconName="apps" />
        <RibbonMenuButton label={t('events')} title={t('events as table')} disabled={Object.keys(events).length === 0} onClick={() => { setShowEventModal(true) }} iconName="date_range" />
      </RibbonMenuSection>
      <RibbonMenuDivider />

      {config.TimeAnalysis != null && <>
        <RibbonMenuSection title={t('time analysis')} >
          <RibbonMenuButton label={t('timeline')} active={history} onClick={() => { toggleHistory() }} iconName="straighten" />
          {config.TimeAnalysis.PhaseAnalysis && <>
            <RibbonMenuButton label={t('add phase')} onClick={() => { setShowModal(true) }} iconName="add_column_right" />
            <RibbonMenuButton label={t('phase analysis')} onClick={() => { setShowAnalysisModal(true) }} iconName="outlined_view_week" />
          </>
          }
        </RibbonMenuSection>

        <RibbonMenuSection title={t('select time interval')} >
          <div className="m-text-left m-px-1">
            <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900">{t('from')} - {t('to')}</span>
            <input type='Date' required min={toDateString(min)} value={toDateString(date.DateFrom)} onChange={dateChanged} className={timePickerClass}></input>
            <input type='Date' min={toDateString(date.DateFrom)} max={toDateString(max)} required readOnly={interval !== 'custom'} value={toDateString(date.DateTo)} onChange={dateToChanged} className={timePickerClass}></input>
          </div>
          <div className="m-px-1">
            <span className="m-mb-1 m-text-sm m-font-medium m-text-gray-900">{t('time interval')}</span>
            <select required value={interval} onChange={(e) => { setInterval(e.target.value as IntervalType) }} className={timePickerClass}>
              <option value={'day'}>{t('day')}</option>
              <option value={'week'}>{t('week')}</option>
              <option value={'month'}>{t('month')}</option>
              <option value={'custom'}>{t('custom')}</option>
            </select>
          </div>
        </RibbonMenuSection>
        <RibbonMenuDivider />
      </>}

      {showAnalysisModal && config.TimeAnalysis?.PhaseAnalysis != null &&
        <Modal mode="accept" wide show={showAnalysisModal} title={t('phase analysis')} onNegative={() => { setShowAnalysisModal(false) }}>
          <ActivityAnalysis config={config.TimeAnalysis.PhaseAnalysis} />
        </Modal>
      }
      {showPhaseEventModal &&
        <Modal mode="save" show={showPhaseEventModal} title={t('add phase')} onNegative={() => {
          setShowModal(false)
          setUpdateEvent(undefined)
        }} onPositive={addEvent}>
          <PhaseCreator onChange={(e) => { setUpdateEvent(e) }} />
        </Modal>
      }
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
