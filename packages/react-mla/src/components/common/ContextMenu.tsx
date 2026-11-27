// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type KeyboardEvent, type ReactNode, type SyntheticEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useAppStore from '../../store/app-store'
import useMainStore from '../../store/main-store'
import useSearchStore from '../../store/search-state'
import configService from '../../services/configurationService'
import viewService from '../../services/viewService'
import type { IEntity, ILink, LinkDashStyle } from '../../interfaces/data-models'
import type { IColor } from '../../interfaces/configuration/theme-configuration'
import { getId } from '../../utils/utils'
import { shortestPath } from '../../utils/dijkstra'
import { newEntity } from '../../utils/new-entity'
import {
  endsOf, neighboursOf, selectType, serviceChoices, setContourColor, setIconColor, setLinkStyle, setShownOnMap
} from '../../utils/chart-actions'
import { allows, nameOf } from '../modal/link-utils'
import { DirectionButtons } from '../modal/link-parts'
import type { LinkDirection } from '../modal/link-utils'
import ColorPalette from './ColorPalette'
import Icon from './Icon'

interface Props {
  delete?: () => void
  copy?: () => void
  paste?: () => void
}

// Ctrl on Windows and Linux, ⌘ on a Mac, as the shortcuts take either
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const control = (key: string) => (isMac ? '⌘' : 'Ctrl+') + key

const toChoice: Record<ILink['Direction'], LinkDirection> = { TO: 'end', FROM: 'start', BOTH: 'both', NONE: 'none' }
const toDirection: Record<LinkDirection, ILink['Direction']> = { end: 'TO', start: 'FROM', both: 'BOTH', none: 'NONE' }

interface ItemProps {
  icon?: string
  // Drawn instead of the icon, like the look of a line
  picture?: ReactNode
  iconColor?: string
  label: string
  // A shortcut or a number, to the right
  hint?: string
  // Why it cannot be chosen. It is then shown grayed out, with the reason, instead of being left out
  reason?: string
  title?: string
  danger?: boolean
  checked?: boolean
  // A menu of its own, opened to the side
  submenu?: boolean
  open?: boolean
  onClick?: () => void
  // The pointer came onto it, or it was clicked: opens its menu, or closes the one of another
  onOpen?: (e: SyntheticEvent) => void
}

const sectionLabel = 'm:px-2.5 m:pt-2 m:pb-0.5 m:text-[10.5px] m:font-bold m:tracking-wider m:uppercase m:text-gray-500'

function Section (props: { label: string }) {
  return <div role="presentation" className={sectionLabel}>{props.label}</div>
}

function Separator () {
  return <div role="separator" className="m:h-px m:bg-gray-200 m:my-1 m:-mx-1" />
}

function Item (props: ItemProps) {
  const disabled = props.reason != null
  const color = props.danger ? 'm:text-red-700' : disabled ? 'm:text-gray-400' : 'm:text-gray-900'
  return (
    <button type="button" role="menuitem" data-menu-item="" aria-disabled={disabled || undefined} title={props.reason ?? props.title}
      aria-haspopup={props.submenu || undefined} aria-expanded={props.submenu ? props.open === true : undefined}
      onMouseEnter={props.onOpen}
      onClick={(e) => {
        if (props.submenu) {
          props.onOpen?.(e)
        } else if (!disabled) {
          props.onClick?.()
        }
      }}
      className={'m:flex m:items-center m:gap-2.5 m:h-7 m:px-2.5 m:rounded m:text-left m:text-[13px] m:w-full m:cursor-pointer m:outline-none ' + color + ' ' +
        (disabled ? 'm:cursor-default ' : '') +
        (props.open ? 'm:bg-blue-50 ' : '') +
        (props.danger ? 'm:hover:bg-red-50 m:focus-visible:bg-red-50' : 'm:hover:bg-blue-50 m:focus-visible:bg-blue-50')}>
      <span className={'m:w-4 m:h-4 m:shrink-0 m:flex m:items-center m:justify-center ' + (disabled ? 'm:opacity-50' : '')}>
        {props.picture ?? (props.icon != null && <Icon name={props.icon} color={props.iconColor} className="m:w-4 m:h-4" />)}
      </span>
      <span className="m:flex-1 m:truncate">{props.label}</span>
      {props.checked && <Icon name="check" className="m:w-4 m:h-4 m:text-primary" />}
      {disabled && <span className="m:text-[11.5px] m:text-gray-400 m:truncate m:max-w-[45%]">{props.reason}</span>}
      {!disabled && props.hint != null && <span className="m:text-[12px] m:text-gray-500 m:tabular-nums">{props.hint}</span>}
      {props.submenu && <Icon name="chevron_right" className="m:w-4 m:h-4 m:text-gray-400" />}
    </button>
  )
}

// A menu to the side of the row it was opened from, or to the other side when there is no room
function Submenu (props: { anchor: HTMLElement | null, children: ReactNode, onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ left: number, top: number } | undefined>()
  useLayoutEffect(() => {
    if (props.anchor == null || ref.current == null) return
    const row = props.anchor.getBoundingClientRect()
    const { width, height } = ref.current.getBoundingClientRect()
    const left = row.right + width + 4 > window.innerWidth ? row.left - width - 4 : row.right + 4
    const top = Math.max(8, Math.min(row.top - 5, window.innerHeight - height - 8))
    setPosition({ left, top })
  }, [props.anchor])

  function onKeyDown (e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'ArrowLeft') {
      e.preventDefault()
      e.stopPropagation()
      props.onClose()
      props.anchor?.focus()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Up and down between its choices, when it has any
      const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-menu-item]') ?? [])
      if (items.length === 0) return
      e.preventDefault()
      e.stopPropagation()
      const index = items.indexOf(e.target as HTMLElement)
      items[(index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
    }
  }

  return (
    <div ref={ref} data-submenu="" role="menu" onKeyDown={onKeyDown}
      style={{ left: position?.left ?? -9999, top: position?.top ?? -9999 }}
      className="m:fixed m:z-50 m:bg-white m:border m:border-gray-300 m:rounded-lg m:shadow-lg m:p-1 m:text-gray-900">
      {props.children}
    </div>
  )
}

// How a line of the style looks, as the chart draws it
const DASHES: Record<LinkDashStyle, string | undefined> = { LINE: undefined, DASHED: '4 2', DOTTED: '1.5 2' }
function LinePicture (props: { style: LinkDashStyle }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray={DASHES[props.style]} />
    </svg>
  )
}

// The header of the menu: what it is for, as in the panel of properties
function Header (props: { icon?: string, color?: string, text?: string, name: string, type?: string }) {
  return (
    <div className="m:flex m:items-center m:gap-2.5 m:px-2.5 m:pt-1.5 m:pb-2.5 m:mb-1 m:-mx-1 m:border-b m:border-gray-200">
      <span className="m:w-7 m:h-7 m:shrink-0 m:rounded-full m:bg-gray-100 m:flex m:items-center m:justify-center m:text-[13px] m:font-bold m:text-primary">
        {props.icon != null ? <Icon name={props.icon} color={props.color} className="m:w-4 m:h-4" /> : props.text}
      </span>
      <span className="m:flex m:flex-col m:min-w-0">
        <span className="m:text-[14px] m:font-semibold m:leading-tight m:truncate m:text-gray-900">{props.name}</span>
        {props.type != null && <span className="m:text-[12px] m:text-gray-600 m:truncate">{props.type}</span>}
      </span>
    </div>
  )
}

// The types of the entities, with how many of each: "2 Person · 1 Bolag"
function typeCounts (entities: IEntity[]): string {
  const counts = new Map<string, number>()
  for (const e of entities) {
    const name = configService.getTypeName(e)
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts].map(([name, count]) => count + ' ' + name).join(' · ')
}

// The menu of the chart and the map, opened with the right button. It is for what was right clicked: the entities, the relations,
// the shapes, an area of the map or the empty chart. Choices that are there but cannot be used say why
export default function ContextMenu (props: Props) {
  const { t } = useTranslation()
  const position = useAppStore((state) => state.contextmenuPosition)
  const chartPosition = useAppStore((state) => state.contextmenuChartPosition)
  const hideContextMenu = useAppStore((state) => state.hideContextMenu)
  const geoFeature = useAppStore((state) => state.selectedGeoFeature)
  const setPropertiesClosed = useAppStore((state) => state.setPropertiesClosed)
  const startLinkFrom = useAppStore((state) => state.startLinkFrom)
  const setDrawnLink = useAppStore((state) => state.setDrawnLink)

  const selectedIds = useMainStore((state) => state.selectedIds)
  const selectedEntities = useMainStore((state) => state.selectedEntities)
  const selectedLinks = useMainStore((state) => state.selectedLinks)
  const selectedShapeIds = useMainStore((state) => state.selectedShapeIds)
  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)
  const data = useMainStore((state) => state.data)
  const network = useMainStore((state) => state.network)
  const setSelected = useMainStore((state) => state.setSelected)
  const addEntity = useMainStore((state) => state.addEntity)
  const updateLink = useMainStore((state) => state.updateLink)
  const setExploreTool = useSearchStore((state) => state.setExploreTool)
  const performExplore = useSearchStore((state) => state.explore)

  const config = configService.getConfiguration()
  const theme = viewService.getTheme()
  const canCreate = config.Menu?.Start?.Create !== false
  const canUseTools = config.Menu?.Start?.Tools !== false

  const menu = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<{ left: number, top: number } | undefined>()
  const [submenu, setSubmenu] = useState<{ key: string, anchor: HTMLElement } | undefined>()

  const services = useMemo(() => {
    return configService.getSearchServices().filter(s => s.Parameters.EntityTypes != null || s.Parameters.GeoData != null)
  }, [])
  const choices = useMemo(() => serviceChoices(services, selectedEntities, t), [services, selectedEntities, t])
  const areaServices = useMemo(() => services.filter(s => s.Parameters.GeoData != null), [services])

  const open = position != null

  // Inside the window, and with the first choice in focus. The name that the chart shows next to the mouse is hidden,
  // since the menu is over the chart and the chart does not see the mouse leave
  useLayoutEffect(() => {
    if (!open || menu.current == null) {
      setPlace(undefined)
      setSubmenu(undefined)
      return
    }
    const { width, height } = menu.current.getBoundingClientRect()
    const left = position.x + width > window.innerWidth - 8 ? Math.max(8, position.x - width) : position.x
    const top = position.y + height > window.innerHeight - 8 ? Math.max(8, window.innerHeight - height - 8) : position.y
    setPlace({ left, top })
    document.querySelectorAll<HTMLElement>('.vis-tooltip').forEach(e => { e.style.visibility = 'hidden' })
  }, [open, position])

  // The focus is put on the first choice once the menu is seen, so that the keys work in it. It is shown only when the keys are used
  const shown = place != null
  useEffect(() => {
    if (shown) {
      menu.current?.querySelector<HTMLElement>('[data-menu-item]:not([aria-disabled])')?.focus({ preventScroll: true })
    }
  }, [shown])

  if (position == null) {
    return null
  }

  // The shortcuts of the chart need the focus back on it
  function close () {
    hideContextMenu()
    document.querySelector<HTMLElement>('.vis-network')?.focus({ preventScroll: true })
  }

  function run (action: () => void) {
    return () => {
      close()
      action()
    }
  }

  // A click outside closes the menu, and is passed on to the chart, so that a right click there opens it again for what is there
  function hide (e: React.MouseEvent) {
    e.preventDefault()
    hideContextMenu()
    document.body.dispatchEvent(new CustomEvent('contextMenuClick', {
      detail: { x: e.clientX, y: e.clientY, button: e.button }
    }))
  }

  function openSubmenu (key: string) {
    return (e: SyntheticEvent) => {
      const anchor = e.currentTarget as HTMLElement
      if (submenu?.key !== key) {
        setSubmenu({ key, anchor })
      }
    }
  }
  function closeSubmenu () {
    return () => { setSubmenu(undefined) }
  }

  // Up and down between the choices, right into a menu at the side, Escape out
  function onKeyDown (e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    const target = e.target as HTMLElement
    if (target.closest('[data-submenu]') != null) {
      return
    }
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[data-menu-item]') ?? [])
      .filter(item => item.closest('[data-submenu]') == null)
    const index = items.indexOf(target)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      const next = items[(index + step + items.length) % items.length]
      next?.focus()
      setSubmenu(undefined)
    } else if (e.key === 'ArrowRight' && target.getAttribute('aria-haspopup') != null) {
      e.preventDefault()
      target.click()
      window.setTimeout(() => {
        menu.current?.querySelector<HTMLElement>('[data-submenu] button')?.focus()
      })
    }
  }

  function explore (serviceId: string) {
    setExploreTool(serviceId)
    void performExplore()
  }

  function selectInArea () {
    const result = [] as string[]
    if (geoFeature?.Bounds != null) {
      Object.values(entities).forEach(e => {
        const entity = e[0]
        if (entity.Coordinates != null && geoFeature.Bounds!.contains(entity.Coordinates)) {
          result.push(getId(entity))
        }
      })
    }
    setSelected(result)
  }

  function palette (key: string, colors: IColor[] | undefined, onSelect: (color?: string) => void) {
    return submenu?.key === key && (
      <Submenu anchor={submenu.anchor} onClose={() => { setSubmenu(undefined) }}>
        <ColorPalette colors={colors} onSelect={(color) => { close(); onSelect(color) }} />
      </Submenu>
    )
  }

  const copyLabel = (count: number) => count > 1 ? t('copy') + ' ' + count : t('copy')
  const deleteLabel = (count: number) => count > 1 ? t('delete') + ' ' + count : t('delete')
  const count = selectedEntities.length + selectedLinks.length + selectedShapeIds.length

  const edit = (
    <>
      <Separator />
      {count > 0 && <Item icon="content_copy" label={copyLabel(count)} hint={control('C')} onClick={run(() => props.copy?.())} />}
      <Item icon="content_paste" label={t('paste')} hint={control('V')} onClick={run(() => props.paste?.())} />
      {count > 0 && <>
        <Separator />
        <Item icon="delete" danger label={deleteLabel(count)} hint="Del" onClick={run(() => props.delete?.())} />
      </>}
    </>
  )

  const colors = (
    <>
      <Item icon="palette" label={selectedEntities.length > 0 ? t('icon color') : t('color')} submenu open={submenu?.key === 'color'} onOpen={openSubmenu('color')} />
      {palette('color', theme.CustomIconColorPicklist, (color) => { setIconColor(selectedEntities, selectedLinks, color) })}
      <Item icon="radio_button_unchecked" label={t('outline')} submenu open={submenu?.key === 'outline'} onOpen={openSubmenu('outline')} />
      {palette('outline', theme.CustomContourColorPicklist, (color) => { setContourColor(selectedEntities, selectedLinks, color) })}
    </>
  )

  const properties = <Item icon="info" label={t('properties')} onClick={run(() => { setPropertiesClosed(false) })} onOpen={closeSubmenu()} />

  let content: ReactNode
  if (geoFeature != null) {
    // An area or a point of the map
    content = (
      <>
        <Header icon="location_on" name={geoFeature.Point != null ? geoFeature.Point.lat.toFixed(5) + ', ' + geoFeature.Point.lng.toFixed(5) : t('area')} />
        {areaServices.length > 0 && <>
          <Section label={t('fetch')} />
          {areaServices.map(s => <Item key={s.Id} icon={s.Icon} label={s.Name} title={s.Description} onClick={run(() => { explore(s.Id) })} />)}
        </>}
        {geoFeature.Bounds != null && <>
          <Separator />
          <Item icon="select_all" label={t('select')} onClick={run(selectInArea)} />
        </>}
        {edit}
      </>
    )
  } else if (selectedEntities.length > 0) {
    // One entity alone, and not with relations or shapes, has its own name in the header and can be drawn from
    const one = selectedEntities.length === 1 && count === 1 ? selectedEntities[0] : undefined
    const view = one != null ? viewService.getView(one.TypeId, one.GlobalType) : undefined
    const rule = one != null ? viewService.getRule(one, useAppStore.getState().currentViewConfiguration) : undefined
    const types = [...new Set(selectedEntities.map(e => e.TypeId))]
    const pair = selectedEntities.length === 2 ? selectedEntities : undefined
    const linkTypes = pair != null ? config.Domain.LinkTypes.filter(l => allows(l, pair[0], pair[1])) : []
    const onMap = config.MapConfiguration != null ? selectedEntities.filter(e => e.Coordinates != null) : []
    content = (
      <>
        {one != null
          ? <Header icon={rule?.Icon ?? view?.Icon} color={one.Color ?? rule?.Color ?? view?.Color} name={nameOf(one)} type={configService.getTypeName(one)} />
          : <Header text={String(count)} name={t('n selected', { count })}
            type={[typeCounts(selectedEntities), selectedLinks.length > 0 ? t('n relations', { count: selectedLinks.length }) : ''].filter(x => x !== '').join(' · ')} />}

        {choices.length > 0 && <>
          <Section label={t('fetch')} />
          {choices.map(c => (
            <Item key={c.service.Id} icon={c.service.Icon} label={c.service.Name} title={c.service.Description} reason={c.reason}
              hint={selectedEntities.length > 1 ? String(c.count) : undefined} onOpen={closeSubmenu()}
              onClick={run(() => { explore(c.service.Id) })} />
          ))}
          <Separator />
        </>}

        {canCreate && one != null &&
          <Item icon="conversion_path" label={t('draw link from here')} title={t('draw link from here help')} onOpen={closeSubmenu()}
            onClick={run(() => { setSelected([]); startLinkFrom(getId(one)) })} />}
        {canCreate && one == null &&
          <Item icon="add_link" label={t('new link')} onOpen={closeSubmenu()}
            reason={pair == null ? t('two entities') : linkTypes.length === 0 ? t('no link type') : undefined}
            onClick={run(() => { if (pair != null) setDrawnLink({ from: getId(pair[0]), to: getId(pair[1]) }) })} />}
        {canUseTools && one == null &&
          <Item icon="route" label={t('find link')} title={t('find link desc')} reason={pair == null ? t('two entities') : undefined} onOpen={closeSubmenu()}
            onClick={run(() => {
              if (pair == null) return
              const path = shortestPath(data.edges, getId(pair[0]), getId(pair[1]))
              const edges = data.edges.get().filter(e => path.some((id, i) => (e.from === id && e.to === path[i + 1]) || (e.to === id && e.from === path[i + 1])))
              setSelected([...path, ...edges.map(e => String(e.id))])
            })} />}
        <Item icon="select_all" onOpen={closeSubmenu()}
          label={types.length === 1 ? t('select all of type', { type: configService.getTypeName(selectedEntities[0]) }) : t('select all of these types')}
          onClick={run(() => { types.forEach(selectType) })} />
        <Item icon="hub" label={t('select neighbours')} title={t('select neighbours desc')} onOpen={closeSubmenu()}
          onClick={run(() => { setSelected([...new Set([...selectedIds, ...neighboursOf(selectedIds, data.edges.get())])]) })} />

        <Separator />
        {colors}
        {onMap.some(e => e.ShowOnMap !== true) &&
          <Item icon="add_location_alt" label={t('show on map')} onOpen={closeSubmenu()} onClick={run(() => { setShownOnMap(onMap, true) })} />}
        {onMap.some(e => e.ShowOnMap === true) &&
          <Item icon="wrong_location" label={t('hide on map')} onOpen={closeSubmenu()} onClick={run(() => { setShownOnMap(onMap, false) })} />}
        {properties}
        {edit}
      </>
    )
  } else if (selectedLinks.length > 0) {
    const one = selectedLinks.length === 1 ? selectedLinks[0] : undefined
    const from = one != null ? entities[one.FromEntityId + one.FromEntityTypeId]?.[0] : undefined
    const to = one != null ? entities[one.ToEntityId + one.ToEntityTypeId]?.[0] : undefined
    const styles: Array<{ style: LinkDashStyle, label: string }> = [
      { style: 'LINE', label: t('solid') }, { style: 'DASHED', label: t('dashed') }, { style: 'DOTTED', label: t('dotted') }
    ]
    // The style of the lines, when they all have the same
    const current = new Set(selectedLinks.map(l => l.Style ?? 'LINE'))
    const currentStyle = current.size === 1 ? styles.find(s => current.has(s.style)) : undefined
    const linkName = (link: ILink) => link.LabelShort?.trim() || configService.getTypeName(link)
    content = (
      <>
        {one != null
          ? <Header icon="link" name={linkName(one)} type={from != null && to != null ? nameOf(from) + (one.Direction === 'FROM' ? ' ← ' : one.Direction === 'BOTH' ? ' ↔ ' : one.Direction === 'TO' ? ' → ' : ' – ') + nameOf(to) : configService.getTypeName(one)} />
          : <Header text={String(selectedLinks.length)} name={t('n relations', { count: selectedLinks.length })} />}
        {one != null && from != null && to != null &&
          <div className="m:px-2.5 m:pt-1.5 m:pb-2" onMouseEnter={closeSubmenu()}>
            <DirectionButtons compact direction={toChoice[one.Direction ?? 'NONE']} first={from} second={to}
              onChange={(d) => { updateLink({ ...one, Direction: toDirection[d] }) }} />
          </div>}
        <Separator />
        <Item icon="line_style" label={t('line type')} submenu open={submenu?.key === 'line'} onOpen={openSubmenu('line')} />
        {submenu?.key === 'line' &&
          <Submenu anchor={submenu.anchor} onClose={() => { setSubmenu(undefined) }}>
            <div className="m:w-44">
              {styles.map(s => (
                <Item key={s.style} picture={<LinePicture style={s.style} />} label={s.label}
                  checked={currentStyle?.style === s.style} onClick={run(() => { setLinkStyle(selectedLinks, s.style) })} />
              ))}
            </div>
          </Submenu>}
        {colors}
        <Separator />
        <Item icon="select_all" label={t('select ends')} onOpen={closeSubmenu()}
          onClick={run(() => { setSelected([...new Set([...selectedIds, ...endsOf(selectedLinks)])]) })} />
        {properties}
        {edit}
      </>
    )
  } else if (selectedShapeIds.length > 0) {
    content = <>{edit}</>
  } else {
    // The empty chart: what is made here is placed where it was clicked
    const entityTypes = config.Domain.EntityTypes.filter(e => e.Internal !== true)
    content = (
      <>
        {canCreate && chartPosition != null && entityTypes.length > 0 && <>
          <Section label={t('create here')} />
          {entityTypes.map(type => {
            const view = viewService.getView(type.TypeId, type.GlobalType)
            return (
              <Item key={type.TypeId} icon={view.Icon} iconColor={view.Color} label={type.Name} title={type.Description}
                onClick={run(() => {
                  const entity = newEntity(type, chartPosition)
                  addEntity(entity)
                  window.setTimeout(() => { setSelected([getId(entity)]) }, 100)
                })} />
            )
          })}
          <Separator />
        </>}
        <Item icon="content_paste" label={t('paste')} hint={control('V')} onClick={run(() => props.paste?.())} />
        <Separator />
        <Item icon="select_all" label={t('select everything')} onClick={run(() => { setSelected([...Object.keys(entities), ...Object.keys(links)]) })} />
        {(config.Menu?.Start?.ViewAll ?? true) &&
          <Item icon="center_focus_strong" label={t('show all')} onClick={run(() => { network?.fit() })} />}
      </>
    )
  }

  return (
    <div className="m:fixed m:inset-0 m:z-40" onClick={hide} onContextMenu={hide}>
      <div ref={menu} role="menu" aria-label={t('menu')} onKeyDown={onKeyDown} onClick={(e) => { e.stopPropagation() }} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation() }}
        style={{ left: place?.left ?? position.x, top: place?.top ?? position.y, visibility: place == null ? 'hidden' : undefined }}
        className="m:absolute m:w-[264px] m:max-h-[calc(100vh-16px)] m:overflow-y-auto m:bg-white m:border m:border-gray-300 m:rounded-lg m:shadow-[0_10px_28px_rgba(28,36,48,0.18),0_2px_6px_rgba(28,36,48,0.08)] m:p-1 m:flex m:flex-col">
        {content}
      </div>
    </div>
  )
}
