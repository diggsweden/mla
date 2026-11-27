// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IChartBase, IEntity, ILink } from '../../interfaces/data-models'
import useMainStore from '../../store/main-store'
import useAppStore from '../../store/app-store'
import { internalRemove } from '../../store/internal-actions'
import configService from '../../services/configurationService'
import viewService from '../../services/viewService'
import { getId } from '../../utils/utils'
import { shortDate } from '../../utils/date'
import { changesBetween } from '../../utils/properties'
import { nameOf } from '../modal/link-utils'
import Icon from '../common/Icon'
import Modal from '../common/Modal'
import Delete from '../modal/Delete'
import EntityProperties from './EntityProperties'
import LinkProperties from './LinkProperties'
import HistoryProperties from './HistoryProperties'
import EventListProperties from './EventListProperties'

interface Props {
  className?: string
}

// What an item in the chart is called, and what it is, as the panel and its list show it
interface Described {
  id: string
  kind: 'entity' | 'link' | 'event'
  name: string
  type: string
  icon: string
  color?: string
  source?: string
}

function describe (id: string, t: (key: string) => string): Described | undefined {
  const state = useMainStore.getState()
  const entity = state.getCurrentEntity(id)
  if (entity != null) {
    // The icon and color the chart gives it, also by the rules of the view
    const view = viewService.getView(entity.TypeId, entity.GlobalType)
    const rule = viewService.getRule(entity, useAppStore.getState().currentViewConfiguration)
    return { id, kind: 'entity', name: nameOf(entity), type: configService.getTypeName(entity), icon: rule?.Icon ?? view.Icon, color: entity.Color ?? rule?.Color ?? view.Color, source: entity.SourceSystemId }
  }
  const link = state.getCurrentLink(id)
  if (link != null) {
    const from = state.getCurrentEntity(link.FromEntityId + link.FromEntityTypeId)
    const to = state.getCurrentEntity(link.ToEntityId + link.ToEntityTypeId)
    // A relation is named by its own label, or its type, and the line below tells which entities it is between and which way it points,
    // so that it is not taken for one of them
    const typeName = configService.getTypeName(link)
    const own = link.LabelShort?.trim()
    const name = own ? own : typeName
    const arrow = link.Direction === 'TO' ? ' → ' : link.Direction === 'FROM' ? ' ← ' : link.Direction === 'BOTH' ? ' ↔ ' : ' – '
    const between = from != null && to != null ? nameOf(from) + arrow + nameOf(to) : typeName
    return { id, kind: 'link', name, type: own && own !== typeName ? typeName + ' · ' + between : between, icon: 'link', source: link.SourceSystemId }
  }
  const computed = state.computedLinks.find(l => getId(l) === id)
  if (computed != null) {
    return { id, kind: 'event', name: configService.getEventConfiguration(computed.EventTypeId)?.Name ?? t('event'), type: t('event'), icon: 'date_range' }
  }
  return undefined
}

function IconButton (props: { label: string, onClick: () => void, active?: boolean, children: ReactNode, disabled?: boolean }) {
  return (
    <button type="button" aria-label={props.label} title={props.label} aria-pressed={props.active} disabled={props.disabled} onClick={props.onClick}
      className={'m:w-7 m:h-7 m:shrink-0 m:flex m:items-center m:justify-center m:rounded m:border m:cursor-pointer m:disabled:opacity-40 m:disabled:cursor-default ' +
        (props.active ? 'm:border-blue-300 m:bg-blue-50 m:text-primary' : 'm:border-gray-300 m:bg-white m:text-gray-600 m:enabled:hover:bg-gray-100')}>
      {props.children}
    </button>
  )
}

const PinIcon = (props: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={props.filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 17v5M5 17h14l-2-5V4H7v8z" /></svg>
)
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
)
const Chevron = (props: { left?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={props.left ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} /></svg>
)

function Badge (props: { icon: string, color?: string, size?: number }) {
  const size = props.size ?? 32
  return (
    <span className="m:shrink-0 m:rounded-full m:bg-gray-100 m:flex m:items-center m:justify-center" style={{ width: size, height: size }}>
      <Icon name={props.icon} color={props.color} className="m:h-4 m:w-4" />
    </span>
  )
}

// The version of an item that is shown, when it is not the latest: when it holds, and what the latest has in its fields instead
function olderVersion (item: IChartBase, history: IChartBase[] | undefined, yes: string, no: string) {
  const latest = history?.at(-1)
  if (latest == null || latest.InternalId === item.InternalId) {
    return undefined
  }
  const configs = configService.getProperties(item).map(p => p.propertyConfiguration)
  const later: Record<string, string> = {}
  changesBetween(item, latest, configs, yes, no).forEach(c => { later[c.config.TypeId] = c.after })
  return { latest, later }
}

// The panel of properties to the right of the chart: what is selected, one at a time, or a list when more are
function PropertiesPanel (props: Props) {
  const { t } = useTranslation()
  const config = configService.getConfiguration()

  const selectedIds = useMainStore((state) => state.selectedIds)
  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const selectedLinks = useMainStore((state) => state.selectedLinks)
  const entityCount = useMainStore((state) => Object.keys(state.entities).length)
  const linkCount = useMainStore((state) => Object.keys(state.links).length)
  const setDate = useMainStore((state) => state.setDateAndTime)
  // The panel changes with the data too, such as a name that is changed, and with the date, which decides the version that is shown
  useMainStore((state) => state.entities)
  useMainStore((state) => state.links)
  useMainStore((state) => state.currentDate)

  const pinned = useAppStore((state) => state.propertiesPinned)
  const setPinned = useAppStore((state) => state.setPropertiesPinned)
  const closed = useAppStore((state) => state.propertiesClosed)
  const setClosed = useAppStore((state) => state.setPropertiesClosed)
  const setFocusedId = useAppStore((state) => state.setFocusedId)

  // The one of several selected that is opened from the list, and the one the pointer is on in the list
  const [opened, setOpened] = useState<string>()
  const [hovered, setHovered] = useState<string>()
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Selecting something opens a closed panel again. A click on the chart that selects nothing leaves it closed
  const [selection, setSelection] = useState(selectedIds)
  if (selection !== selectedIds) {
    setSelection(selectedIds)
    if (closed && selectedIds.length > 0) setClosed(false)
  }

  const many = selectedIds.length > 1
  const display = selectedIds.length === 1 ? selectedIds[0] : (opened != null && selectedIds.includes(opened) ? opened : undefined)
  const showList = many && display == null
  const visible = !closed && (selectedIds.length > 0 || pinned)

  // The chart shows which of the selected the panel is about
  const focus = hovered ?? display
  useEffect(() => {
    setFocusedId(focus)
    return () => { setFocusedId(undefined) }
  }, [focus, setFocusedId])

  const state = useMainStore.getState()
  const entity = display ? state.getCurrentEntity(display) : undefined
  const link = display ? state.getCurrentLink(display) : undefined
  const computedLink = display ? state.computedLinks.find(l => getId(l) === display) : undefined
  const described = display ? describe(display, t) : undefined
  const item: IEntity | ILink | undefined = entity ?? link
  const history = entity ? state.getEntityHistory(getId(entity)) : link ? state.getLinkHistory(getId(link)) : undefined
  const older = item != null ? olderVersion(item, history, t('yes'), t('no')) : undefined
  const index = display ? selectedIds.indexOf(display) : -1

  // The selected, entities first and then relations and events, each with a heading when there is more than one kind
  const describedAll = showList ? selectedIds.map(id => describe(id, t)).filter((d): d is Described => d != null) : []
  const listGroups = ([
    { kind: 'entity', title: t('n entities', { count: describedAll.filter(d => d.kind === 'entity').length }) },
    { kind: 'link', title: t('n relations', { count: describedAll.filter(d => d.kind === 'link').length }) },
    { kind: 'event', title: t('n events', { count: describedAll.filter(d => d.kind === 'event').length }) }
  ] as const).map(g => ({ ...g, items: describedAll.filter(d => d.kind === g.kind) })).filter(g => g.items.length > 0)

  const step = (by: number) => {
    setOpened(selectedIds[(index + by + selectedIds.length) % selectedIds.length])
  }
  const toLatest = () => {
    const latest = older?.latest
    if (latest != null) setDate(latest.DateFrom ?? latest.DateTo!)
  }
  const period = (thing: IChartBase) => (thing.DateFrom != null ? shortDate(thing.DateFrom) : '…') + ' – ' + (thing.DateTo != null ? shortDate(thing.DateTo) : t('until further notice'))

  const pinButton = (
    <IconButton label={pinned ? t('unpin panel') : t('pin panel')} active={pinned} onClick={() => { setPinned(!pinned) }}><PinIcon filled={pinned} /></IconButton>
  )
  const closeButton = (
    <IconButton label={t('close panel')} onClick={() => { setClosed(true); setOpened(undefined) }}><CloseIcon /></IconButton>
  )

  let header: ReactNode
  if (described != null) {
    header = <>
      <Badge icon={described.icon} color={described.color} size={34} />
      <div className="m:flex m:flex-col m:min-w-0 m:flex-1">
        <span className="m:text-[15px] m:font-bold m:leading-tight m:truncate" title={described.name}>{described.name}</span>
        <span className="m:text-[12px] m:text-gray-600 m:truncate">{described.type}</span>
      </div>
      {described.source && <span title={t('source system')} className="m:text-[11px] m:font-semibold m:text-gray-600 m:bg-gray-100 m:rounded-full m:px-2 m:py-0.5 m:max-w-24 m:truncate">{described.source}</span>}
    </>
  } else if (showList) {
    header = <div className="m:flex m:flex-col m:min-w-0 m:flex-1">
      <span className="m:text-[15px] m:font-bold m:leading-tight">{t('n selected', { count: selectedIds.length })}</span>
      <span className="m:text-[12px] m:text-gray-600 m:truncate">{listGroups.map(g => g.title).join(' · ')}</span>
    </div>
  } else {
    header = <span className="m:text-[15px] m:font-bold m:flex-1">{t('properties panel')}</span>
  }

  return (
    <aside aria-label={t('properties panel')} className={'m:flex m:flex-col m:ease-in-out m:duration-300 m:bg-white ' + (visible
      // A soft shadow to the left lifts the panel off the chart, only while it is seen, so that a hidden one leaves no trace at the edge
      ? 'm:translate-x-0 m:shadow-[-8px_0_20px_-6px_rgba(28,36,48,0.22)] '
      : 'm:translate-x-full ') + props.className}>
      <div className="m:flex m:items-center m:gap-2 m:px-3 m:py-2.5 m:border-b m:border-gray-200 m:select-none">
        {header}
        {pinButton}
        {closeButton}
      </div>

      {many && display != null && (
        <div className="m:flex m:items-center m:justify-between m:px-2 m:py-1.5 m:border-b m:border-gray-200 m:bg-gray-50">
          <button type="button" onClick={() => { setOpened(undefined) }} className="m:flex m:items-center m:gap-1 m:text-[13px] m:font-semibold m:text-blue-700 m:px-1 m:py-0.5 m:rounded m:hover:bg-blue-50 m:cursor-pointer">
            <Chevron left />{t('n selected', { count: selectedIds.length })}
          </button>
          <div className="m:flex m:items-center m:gap-1">
            <IconButton label={t('previous')} onClick={() => { step(-1) }}><Chevron left /></IconButton>
            <span className="m:text-[13px] m:text-gray-600 m:min-w-12 m:text-center">{t('n of m', { n: index + 1, m: selectedIds.length })}</span>
            <IconButton label={t('next')} onClick={() => { step(1) }}><Chevron /></IconButton>
          </div>
        </div>
      )}

      {older != null && item != null && (
        <div role="status" className="m:flex m:items-center m:gap-2 m:px-3 m:py-2 m:bg-amber-50 m:border-b m:border-amber-300">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a4b0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="m:shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          <span className="m:text-[12px] m:text-amber-950 m:leading-snug">{t('older version shown', { period: period(item) })}</span>
          <button type="button" onClick={toLatest} className="m:ml-auto m:text-[12px] m:font-semibold m:text-blue-700 m:whitespace-nowrap m:cursor-pointer m:hover:underline">{t('to latest')}</button>
        </div>
      )}

      <div className="mla-form-fields m:grow m:overflow-y-auto">
        {showList && (
          <div aria-label={t('n selected', { count: selectedIds.length })} role="list" className="m:flex m:flex-col m:gap-2 m:p-2">
            {listGroups.map(group => (
              <div key={group.kind} role="group" aria-label={group.title} className="m:flex m:flex-col m:gap-0.5">
                {listGroups.length > 1 && <span className="m:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600 m:px-2 m:pt-1">{group.title}</span>}
                {group.items.map(d => (
                  <div key={d.id} role="listitem">
                    <button type="button" onClick={() => { setOpened(d.id); setHovered(undefined) }}
                      onMouseEnter={() => { setHovered(d.id) }} onMouseLeave={() => { setHovered(undefined) }}
                      onFocus={() => { setHovered(d.id) }} onBlur={() => { setHovered(undefined) }}
                      className="m:w-full m:flex m:items-center m:gap-2.5 m:text-left m:px-2 m:py-1.5 m:rounded-md m:border m:border-transparent m:hover:border-blue-200 m:hover:bg-blue-50 m:focus-visible:border-blue-300 m:cursor-pointer">
                      <Badge icon={d.icon} color={d.color} />
                      <span className="m:flex m:flex-col m:min-w-0 m:flex-1">
                        <span className="m:text-[14px] m:font-semibold m:truncate">{d.name}</span>
                        <span className="m:text-[12px] m:text-gray-600 m:truncate" title={d.type}>{d.type}</span>
                      </span>
                      <span className="m:text-gray-400"><Chevron /></span>
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {showList && <p className="m:mx-4 m:text-[12px] m:text-gray-600">{t('open from list')}</p>}

        {computedLink && <EventListProperties eventLink={computedLink} />}
        {entity && <EntityProperties key={entity.InternalId} entity={entity} later={older?.later} />}
        {link && <LinkProperties key={link.InternalId} link={link} later={older?.later} />}
        {item && config.TimeAnalysis &&
          <HistoryProperties
            // Each item starts with its own open and closed parts
            key={getId(item)}
            className="m:w-full"
            entityId={entity ? getId(entity) : undefined}
            linkId={link ? getId(link) : undefined} />
        }

        {selectedIds.length === 0 && (
          <div className="m:flex m:flex-col m:items-center m:justify-center m:gap-3 m:text-center m:px-6 m:py-16">
            <span className="m:w-12 m:h-12 m:rounded-full m:bg-gray-100 m:text-gray-400 m:flex m:items-center m:justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4l7 17 2.5-7.5L21 11z" /></svg>
            </span>
            <span className="m:text-[15px] m:font-semibold">{t('nothing selected')}</span>
            <span className="m:text-[13px] m:text-gray-600 m:leading-relaxed">{t('nothing selected help')}</span>
          </div>
        )}
      </div>

      {showList && (
        <div className="m:flex m:flex-col m:gap-2 m:px-3 m:py-3 m:border-t m:border-gray-200">
          <span className="m:text-[12px] m:font-bold m:tracking-wider m:uppercase m:text-gray-600">{t('for all n', { count: selectedIds.length })}</span>
          <button type="button" onClick={() => { setConfirmDelete(true) }}
            className="m:text-[13px] m:px-3 m:py-1.5 m:rounded m:border m:border-red-200 m:bg-white m:text-red-700 m:hover:bg-red-50 m:cursor-pointer">{t('delete')}</button>
        </div>
      )}
      {selectedIds.length === 0 && (
        <div className="m:flex m:justify-between m:px-3 m:py-2.5 m:border-t m:border-gray-200 m:text-[13px] m:text-gray-600">
          <span>{t('in the chart')}</span>
          <span>{t('n entities and links', { entities: entityCount, links: linkCount })}</span>
        </div>
      )}

      {confirmDelete &&
        <Modal mode="accept" show={true} title={t('delete')} onNegative={() => { setConfirmDelete(false) }}
          onPositive={() => { internalRemove(true, selectedEntities, selectedLinks, []); setConfirmDelete(false) }}>
          <Delete entities={selectedEntities} links={selectedLinks} shapes={[]} />
        </Modal>
      }
    </aside>
  )
}

export default PropertiesPanel
