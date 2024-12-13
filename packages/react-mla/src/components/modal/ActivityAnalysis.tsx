// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type IChartBase, type IEntity, type ILink } from '../../interfaces/data-models'
import configService from '../../services/configurationService'
import viewService from '../../services/viewService'
import useMainStore from '../../store/main-store'
import { type ReactElement, useMemo, useState } from 'react'
import { getId, isLinked } from '../../utils/utils'
import Toggle from '../common/Toggle'
import { toDateString } from '../../utils/date'
import useAppStore from '../../store/app-store'
import type { IViewConfiguration } from '../../interfaces/configuration/view-configuration'
import type { IPhaseConfiguration } from '../../interfaces/configuration/phase-configuration'
import Icon from '../common/Icon'
import Popover from '../common/Popover'
import { DateTime, Interval } from 'luxon'
import { useTranslation } from 'react-i18next'

interface Props {
  className?: string
  config: IPhaseConfiguration
}

interface Description {
  Title: string
  Date: DateTime
  Attributes: string[]
  Color?: string
  SubItems: SubItem[]
}

interface SubItem {
  Text: string
  Attribute?: string
  Color?: string
}

interface TimePeriod {
  From: DateTime
  To: DateTime
  Header: string
  Linked: IEntity[]
  Description: Description[]
  Counts: Record<string, number>
}

interface Intervall {
  Start: Record<string, number>
  End: Record<string, number>
}

interface Link {
  Id: string
  Name: string
  Type: string
}

interface Type {
  Name: string
  TypeId: string
}

interface Attribute {
  Name: string
  Show: boolean
}

function within(period: TimePeriod, thing: IChartBase): boolean {
  const interval = Interval.fromDateTimes(period.From, period.To)

  return interval.contains(thing.DateFrom!) && interval.contains(thing.DateTo!)
}

function ActivityAnalysis(props: Props) {
  const { t } = useTranslation();

  const entities = useMainStore((state) => state.entities)
  const links = useMainStore((state) => state.links)
  const events = useMainStore((state) => state.phaseEvents)
  const maxDate = useMainStore((state) => state.maxDate)

  const getEntity = useMainStore((state) => state.getCurrentEntity)

  const config = props.config
  const viewConfig = useAppStore(state => state.currentViewConfiguration)

  const [types, setTypes] = useState([] as Type[])
  const [intervall, setIntervall] = useState({ Start: {}, End: {} } as Intervall)
  const [loading, setLoading] = useState(false)
  const [dateDiff, setDateDiff] = useState(false)
  const [attributes, setAttributes] = useState([] as Attribute[])
  const [showSettings, setShowSettings] = useState(undefined as undefined | { x: number, y: number })

  function filterUniqueLinks(value: Link, index: number, array: Link[]) {
    return (
      array.findIndex(
        (obj) => obj.Id === value.Id
      ) === index
    )
  }

  function getColor(e: IEntity, v: IViewConfiguration): string | undefined {
    if (e.Color) {
      return e.Color
    }

    const rule = viewService.getRule(e, v)
    if (rule?.Color != null) {
      return rule.Color
    }

    return undefined
  }

  const view = useMemo(() => {
    setLoading(true)
    const result = [] as TimePeriod[]
    const attributesUpdate = [] as Attribute[]

    for (let i = 0; i < events.length; i++) {
      result.push({
        From: events[i].Date,
        To: events[i + 1]?.Date ?? maxDate,
        Header: events[i].Description,
        Description: [],
        Counts: {},
        Linked: []
      })
    }

    const desc = Object.values(entities).filter(e => e[0].TypeId === config.EntityTypeId).flat()
    const inter: Intervall = { Start: {}, End: {} }

    function mapLink(link: ILink): Link[] {
      const result = [] as Link[]

      let propValue = undefined as string | undefined
      if (config.LinkPropertyId != null) {
        propValue = viewService.getPropertyValue(link, config.LinkPropertyId)
      }

      if (propValue) {
        result.push({
          Id: link.Id,
          Type: propValue,
          Name: propValue
        })
      } else {
        if (link.FromEntityTypeId !== config.EntityTypeId) {
          const ent = getEntity(link.FromEntityId + link.FromEntityTypeId)
          const config = configService.getEntityConfiguration(link.FromEntityTypeId)

          if (ent != null && config != null) {
            result.push({
              Id: link.FromEntityId,
              Type: link.FromEntityTypeId,
              Name: ent ? ent.LabelShort : config.Name
            })
          }
        }
        if (link.ToEntityTypeId !== config.EntityTypeId) {
          const ent = getEntity(link.ToEntityId + link.ToEntityTypeId)
          const config = configService.getEntityConfiguration(link.ToEntityTypeId);

          if (ent != null && config != null) {
            result.push({
              Id: link.ToEntityId,
              Type: link.ToEntityTypeId,
              Name: ent ? ent.LabelShort : config.Name
            })
          }
        }
      }

      return result
    }

    const typeMap: Record<string, string> = {}
    result.forEach((period, i) => {
      const timespan = desc.filter(e => within(period, e))
      let linkedLinks = [] as Link[]
      const linkMap: Record<string, ILink[]> = {}
      timespan.forEach(e => {
        const id = getId(e)
        linkMap[id] = []
        const found = Object.values(links).filter(l => isLinked(e, l[0])).map(l => l[0])
        found.forEach(l => {
          linkMap[id].push(l)
        })
        linkedLinks.push(...found.flatMap(mapLink))
      })

      period.Description = timespan.map(e => {
        const entAttrs = viewService.getAttributes(e).map(a => a.text)
        entAttrs.forEach(entAttr => {
          if (!attributesUpdate.some(a => a.Name === entAttr)) {
            attributesUpdate.push({
              Name: entAttr,
              Show: true
            })
          }
        })
        return {
          Title: e.LabelLong,
          Date: e.DateFrom!,
          Attributes: entAttrs,
          Color: getColor(e, viewConfig),
          SubItems: linkMap[getId(e)]?.length > 0
            ? linkMap[getId(e)].flatMap(l => {
              const entityId = l.FromEntityTypeId === config.EntityTypeId ? l.ToEntityId + l.ToEntityTypeId : l.FromEntityId + l.FromEntityTypeId
              const entity = entities[entityId][0]

              const attrs = viewService.getAttributes(entity)
              if (attrs.length > 0) {
                return attrs.map((att) => {
                  if (!attributesUpdate.some(a => a.Name === att.text)) {
                    attributesUpdate.push({
                      Name: att.text,
                      Show: true
                    })
                  }
                  return ({ Text: (l.LabelShort + ' - ' + att.text), Attribute: att.text, Color: getColor(entity, viewConfig) })
                })
              }
              return []
            })
            : []
        }
      })
      period.Description.sort((a, b) => a.Date.diff(b.Date).milliseconds)

      linkedLinks = linkedLinks.filter(filterUniqueLinks)
      linkedLinks.forEach(link => {
        typeMap[link.Type] = link.Name
        const l = link.Type
        if (period.Counts[l]) {
          period.Counts[l]++
        } else {
          period.Counts[l] = 1
        }

        if (inter.Start[l] !== undefined) {
          inter.End[l] = i
        } else {
          inter.Start[l] = i
          inter.End[l] = i
        }
      })
    })

    const typeList = Object.keys(typeMap).map(t => ({ TypeId: t, Name: typeMap[t] } satisfies Type))
    typeList.sort((a, b) => a.Name.localeCompare(b.Name))
    setTypes(typeList)
    setAttributes(attributesUpdate)
    setIntervall(inter)
    setLoading(false)

    return result
  }, [entities, events, maxDate, config.EntityTypeId, config.LinkPropertyId, getEntity, links, viewConfig])

  if (loading) {
    return <div className="m-animate-in m-fade-in m-duration-500 m-flex m-space-x-4 m-mt-4">
      <div className="m-animate-pulse m-rounded-full m-bg-slate-200 m-h-10 m-w-10"></div>
      <div className="m-flex-1 m-space-y-6 m-py-1">
        <div className="m-h-2 m-bg-slate-200 m-rounded"></div>
        <div className="m-space-y-3">
          <div className="m-grid m-grid-cols-3 m-gap-4">
            <div className="m-h-2 m-bg-slate-200 m-rounded m-col-span-2"></div>
            <div className="m-h-2 m-bg-slate-200 m-rounded m-col-span-1"></div>
          </div>
          <div className="m-h-2 m-bg-slate-200 m-rounded"></div>
        </div>
      </div>
    </div>
  }

  function show(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    setShowSettings({ x: e.clientX, y: e.clientY })
  }

  function toggleAttribute(attr: Attribute) {
    const idx = attributes.findIndex(a => a === attr)
    const update = [...attributes]
    update.splice(idx, 1, { Name: attr.Name, Show: !attr.Show })
    setAttributes(update)
  }

  function shouldShowAttribute(...attrs: string[]): boolean {
    return attrs.some(a => {
      return attributes.some(at => at.Name === a && at.Show)
    })
  }

  function dots(count: number, color: string): ReactElement[] {
    const result = [] as ReactElement[]
    for (let i = 0; i < Math.min(10, count); i++) {
      result.push(<svg key={i} className={`m-h-3 m-w-3 m-mt-1 m-inline m-z-10 ${i > 0 ? ' m-ml-1' : ''}`}>
        <circle cx="5" cy="5" r="5" fill={color} />
      </svg>
      )
    }

    return result
  }

  function dot(color?: string) {
    if (color) {
      return <svg className="m-w-3 m-h-3 m-mr-1 m-inline"><circle cx="4" cy="4" r="4" fill={color} /></svg>
    }

    return undefined
  }

  let previousDay = (view.length > 0 && view[0].Description.length > 0) ? view[0].Description[0].Date : DateTime.now()
  return (
    <div className={('m-bg-stone-400 m-p-5 ' + props.className)}>
      {view.length === 0 &&
        <div>{t('nothing to show')}</div>
      }
      {view.length > 0 &&
        <div className="m-p-8 m-w-full m-overflow-x m-bg-white m-">
          <div className="m-w-full -m-mt-5 m-mb-4 -m-ml-4">
            <button type="button" onClick={(e) => { show(e) }} className='m-float-left m-text-white m-bg-primary enabled:m-hover:bg-blue-800 focus:m-ring-4 focus:m-ring-blue-300 m-font-medium m-rounded m-px-2 m-py-1'>
              <Icon name="settings" className="m-w-5 m-h-5 m-inline-block m-m-0 -m-mb-1" color='#ffffff'></Icon>{t('settings')}
            </button>
          </div>

          {/* Header */}
          <div className="m-flex m-w-full m-mt-8">
            <div className="m-flex m-justify-center m-items-center m-w-14"><div className="-m-rotate-90 m-text-xl">{t('phase act')}</div></div>
            <div className={'m-grow m-max-w-7xl m-grid'} style={{ gridTemplateColumns: `repeat(${view.length}, minmax(0, 1fr)` }}>
              {view.map((v, i) =>
                <div key={i} className="m-h-full">
                  <div className="m-flex m-h-20 m-items-center m-me-2">
                    <div className="m-flex m-flex-col m-justify-center m-items-center m-w-full m-h-full m-bg-black m-text-white m-text-lg">
                      <div>{v.Header}</div>
                      <div>{toDateString(v.From)}</div>
                    </div>
                    {i !== (view.length - 1) &&
                      <div className="m-w-6">
                        <span className="m-text-[20px]">&#10132;</span>
                      </div>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activities */}
          <div className="m-flex m-w-full m-min-h-[80px]">
            <div className="m-flex m-justify-center m-items-center"><div className="-m-rotate-90 m-text-sm">{t('activities')}</div></div>
            <div className={'m-grow m-max-w-7xl m-grid'} style={{ gridTemplateColumns: `repeat(${view.length}, minmax(0, 1fr)` }}>
              {view.map((v, i) =>
                <div key={i} className="m-flex m-h-full">
                  <div className="m-p-2 m-flex m-grow m-">
                    {v.Description.length === 0 &&
                      <div className="m-italic">{t('no info')}</div>
                    }

                    <div className="m-w-full">
                      <div className="m-font-semibold m-text-left m-text-sm m-ml-2">{t('day')}</div>
                      {v.Description.filter(d => d.Attributes.length === 0 || shouldShowAttribute(...d.Attributes)).map((d, j) => {
                        if (dateDiff) {
                          if (j === 0) {
                            previousDay = v.From
                          } else {
                            previousDay = v.Description[j - 1].Date
                          }
                        }
                        const day = daysBetween(previousDay, d.Date)
                        return <div key={v.Header + j} className={'m-grid m-grid-cols-[36px_1fr] ' + (day > 0 ? 'm-mt-1' : '')}>
                          <div className="m-text-right m-text-sm m-font-semibold m-w-9 m-border-r m-border-gray-600 m-pr-1 m-pt-px" style={{ borderColor: d.Color, borderRightWidth: (d.Color != null) ? 3 : 1 }} key={'day-' + j}>{((dateDiff && day > 0) ? '+' : '') + ((dateDiff && day === 0) ? '' : day.toString())}</div>
                          <div className="m-text-left m-pl-1" key={'text-' + j}>
                            <div>{d.Title}</div>
                            {d.SubItems.length > 0 && <ul className={'m-list-none m-list-inside'}>
                              {d.SubItems.filter(s => s.Attribute == null || shouldShowAttribute(s.Attribute)).map((sub, z) => <li key={z}>{dot(sub.Color ?? '#000000')}{sub.Text}
                              </li>
                              )}
                            </ul>}
                          </div>
                        </div>
                      }
                      )}
                    </div>
                  </div>
                  {i !== (view.length - 1) &&
                    <div className="m-border-l-2 m-mr-2 m-border-gray-300 m-border-dotted"></div>
                  }
                </div>
              )}
            </div>
          </div>

          {/* Cast */}
          <div className="m-flex m-w-full">
            <div className="m-flex m-justify-center m-items-center m-w-[49px]"><div className="-m-rotate-90 m-text">{t('actors')}</div></div>
            <div className="m-grow m-text-left">
              {types.map(t =>
                <div key={t.Name} className={'m-max-w-7xl m-grid'} style={{ gridTemplateColumns: `repeat(${view.length}, minmax(0, 1fr)` }}>
                  {view.map((v, i) => {
                    const color = config.LinkTypeId != null ? 'black' : viewService.getView(t.TypeId).Color
                    return <div className="m-flex m-justify-between m-w-full" key={i}>
                      {i === 0 &&
                        <div className="m-mr-2 m-grow">{t.Name}</div>
                      }
                      <div className={'m-grow m-h-px m-translate-y-3' + (i > intervall.Start[t.TypeId] && i <= intervall.End[t.TypeId] ? ' m-bg-gray-300' : '')}></div>
                      <div className="">
                        <div className="m-relative m-whitespace-nowrap" title={v.Counts[t.TypeId]?.toString()}>
                          {dots(v.Counts[t.TypeId], color)}
                        </div>
                      </div>
                      {i !== (view.length - 1) &&
                        <div className={'m-w-2 m-h-px m-translate-y-3' + (i >= intervall.Start[t.TypeId] && i < intervall.End[t.TypeId] ? ' m-bg-gray-300' : '')}></div>
                      }
                      {i !== (view.length - 1) &&
                        <div className="m-border-l-2 m-border-gray-300 m-border-dotted">
                          <div className={'m-w-2 m-h-px m-z-0 m-translate-y-3' + (i >= intervall.Start[t.TypeId] && i < intervall.End[t.TypeId] ? ' m-bg-gray-300' : '')}></div>
                        </div>
                      }
                    </div>
                  })
                  }
                </div>
              )}
            </div>
          </div>
        </div>

      }
      <Popover backgroundClass='bg-gray-400/20' show={showSettings !== undefined} hide={() => { setShowSettings(undefined) }} x={showSettings?.x ?? 0} y={showSettings?.y ?? 0}>
        <Toggle title={t('show as date diff')} value={dateDiff} onChange={() => { setDateDiff(!dateDiff) }} className="m-mx-3 m-my-2" />
        {attributes.map((a) => (
          <Toggle key={a.Name} title={a.Name + ':'} value={a.Show} onChange={() => { toggleAttribute(a) }} className="m-mx-3 m-mb-2" />
        ))}
      </Popover>
    </div>
  )
}

function daysBetween(date1: DateTime, date2: DateTime): number {
  return Math.floor(date2.diff(date1, "days").days)
}

export default ActivityAnalysis
