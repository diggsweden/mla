// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

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

function within (period: TimePeriod, thing: IChartBase): boolean {
  const interval = Interval.fromDateTimes(period.From, period.To)

  // Todo rätta denna
  return interval.contains(thing.DateFrom!) && interval.contains(thing.DateTo!)
}

function ActivityAnalysis (props: Props) {
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

  function filterUniqueLinks (value: Link, index: number, array: Link[]) {
    return (
      array.findIndex(
        (obj) => obj.Id === value.Id
      ) === index
    )
  }

  function getColor (e: IEntity, v: IViewConfiguration): string | undefined {
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

    function mapLink (link: ILink): Link[] {
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
          result.push({
            Id: link.FromEntityId,
            Type: link.FromEntityTypeId,
            Name: ent ? ent.LabelShort : configService.getEntityConfiguration(link.FromEntityTypeId).Name
          })
        }
        if (link.ToEntityTypeId !== config.EntityTypeId) {
          const ent = getEntity(link.ToEntityId + link.ToEntityTypeId)
          result.push({
            Id: link.ToEntityId,
            Type: link.ToEntityTypeId,
            Name: ent ? ent.LabelShort : configService.getEntityConfiguration(link.ToEntityTypeId).Name
          })
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
    return <div className="animate-in fade-in duration-500 flex space-x-4 mt-4">
      <div className="animate-pulse rounded-full bg-slate-200 h-10 w-10"></div>
      <div className="flex-1 space-y-6 py-1">
        <div className="h-2 bg-slate-200 rounded"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-2 bg-slate-200 rounded col-span-2"></div>
            <div className="h-2 bg-slate-200 rounded col-span-1"></div>
          </div>
          <div className="h-2 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  }

  function show (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    setShowSettings({ x: e.clientX, y: e.clientY })
  }

  function toggleAttribute (attr: Attribute) {
    const idx = attributes.findIndex(a => a === attr)
    const update = [...attributes]
    update.splice(idx, 1, { Name: attr.Name, Show: !attr.Show })
    setAttributes(update)
  }

  function shouldShowAttribute (...attrs: string[]): boolean {
    return attrs.some(a => {
      return attributes.some(at => at.Name === a && at.Show)
    })
  }

  function dots (count: number, color: string): ReactElement[] {
    const result = [] as ReactElement[]
    for (let i = 0; i < Math.min(10, count); i++) {
      result.push(<svg key={i} className={`h-3 w-3 mt-1 inline z-10 ${i > 0 ? ' ml-1' : ''}`}>
        <circle cx="5" cy="5" r="5" fill={color} />
      </svg>
      )
    }

    return result
  }

  function dot (color?: string) {
    if (color) {
      return <svg className='w-3 h-3 mr-1 inline'><circle cx="4" cy="4" r="4" fill={color} /></svg>
    }

    return undefined
  }

  let previousDay = (view.length > 0 && view[0].Description.length > 0) ? view[0].Description[0].Date : DateTime.now()
  return (
    <div className={('bg-stone-400 p-5 ' + props.className)}>
      {view.length === 0 &&
        <div>Inget att visa</div>
      }
      {view.length > 0 &&
        <div className="p-8 w-full overflow-x bg-white ">
          <div className="w-full -mt-5 mb-4 -ml-4">
            <button type="button" onClick={(e) => { show(e) }} className='float-left text-white bg-primary enabled:hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded px-2 py-1'>
              <Icon name="settings" className='w-5 h-5 inline-block m-0 -mb-1' color='#ffffff'></Icon> Inställningar
            </button>
          </div>

          {/* Header */}
          <div className="flex w-full mt-8">
            <div className="flex justify-center items-center w-14"><div className="-rotate-90 text-xl">Akt</div></div>
            <div className={'grow max-w-7xl grid'} style={{ gridTemplateColumns: `repeat(${view.length}, minmax(0, 1fr)` }}>
              {view.map((v, i) =>
                <div key={i} className="h-full">
                  <div className="flex h-20 items-center">
                    <div className="flex flex-col justify-center items-center w-full h-full bg-black text-white text-lg">
                      <div>{v.Header}</div>
                      <div>{toDateString(v.From)}</div>
                    </div>
                    {i !== (view.length - 1) &&
                      <div className="w-6">
                        <span className="text-[20px]">&#10132;</span>
                      </div>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activities */}
          <div className="flex w-full min-h-[80px]">
            <div className="flex justify-center items-center"><div className="-rotate-90 text-sm">Aktiviteter</div></div>
            <div className={'grow max-w-7xl grid'} style={{ gridTemplateColumns: `repeat(${view.length}, minmax(0, 1fr)` }}>
              {view.map((v, i) =>
                <div key={i} className="flex h-full">
                  <div className="c p-2 flex grow ">
                    {v.Description.length === 0 &&
                      <div className="italic">Ingen information finns</div>
                    }

                    <div className="w-full">
                      <div className="font-semibold text-left text-sm ml-2">Dag</div>
                      {v.Description.filter(d => d.Attributes.length === 0 || shouldShowAttribute(...d.Attributes)).map((d, j) => {
                        if (dateDiff) {
                          if (j === 0) {
                            previousDay = v.From
                          } else {
                            previousDay = v.Description[j - 1].Date
                          }
                        }
                        const day = daysBetween(previousDay, d.Date)
                        return <div key={v.Header + j} className={'grid grid-cols-[36px_1fr] ' + (day > 0 ? 'mt-1' : '')}>
                          <div className="text-right text-sm font-semibold w-9 border-r border-gray-600 pr-1 pt-px" style={{ borderColor: d.Color, borderRightWidth: (d.Color != null) ? 3 : 1 }} key={'day-' + j}>{((dateDiff && day > 0) ? '+' : '') + ((dateDiff && day === 0) ? '' : day.toString())}</div>
                          <div className="text-left pl-1" key={'text-' + j}>
                            <div>{d.Title}</div>
                            {d.SubItems.length > 0 && <ul className={'list-none list-inside'}>
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
                    <div className="border-l-2 mr-2 border-gray-300 border-dotted"></div>
                  }
                </div>
              )}
            </div>
          </div>

          {/* Cast */}
          <div className="flex w-full">
            <div className="flex justify-center items-center w-[52px]"><div className="-rotate-90 text">Aktörer</div></div>
            <div className="grow text-left">
              {types.map(t =>
                <div key={t.Name} className={'max-w-7xl grid'} style={{ gridTemplateColumns: `repeat(${view.length}, minmax(0, 1fr)` }}>
                  {view.map((v, i) => {
                    const color = config.LinkTypeId != null ? 'black' : viewService.getView(t.TypeId).Color
                    return <div className="flex justify-between w-full" key={i}>
                      {i === 0 &&
                        <div className="mr-2 grow">{t.Name}</div>
                      }
                      <div className={'grow h-px translate-y-3' + (i > intervall.Start[t.TypeId] && i <= intervall.End[t.TypeId] ? ' bg-gray-300' : '')}></div>
                      <div className="">
                        <div className="relative whitespace-nowrap" title={v.Counts[t.TypeId]?.toString()}>
                          {dots(v.Counts[t.TypeId], color)}
                        </div>
                      </div>
                      {i !== (view.length - 1) &&
                        <div className={'w-2 h-px translate-y-3' + (i >= intervall.Start[t.TypeId] && i < intervall.End[t.TypeId] ? ' bg-gray-300' : '')}></div>
                      }
                      {i !== (view.length - 1) &&
                        <div className="border-l-2 border-gray-300 border-dotted">
                          <div className={'w-2 h-px z-0 translate-y-3' + (i >= intervall.Start[t.TypeId] && i < intervall.End[t.TypeId] ? ' bg-gray-300' : '')}></div>
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
      <Popover backgroundClass='bg-gray-400/20' show={showSettings !== undefined} hide={() => { setShowSettings(undefined) } } x={showSettings?.x ?? 0} y={showSettings?.y ?? 0}>
        <Toggle title="Visa dagar som skillnad från föregående datum:" value={dateDiff} onChange={() => { setDateDiff(!dateDiff) }} className='mx-3 my-2' />
        {attributes.map((a) => (
          <Toggle key={a.Name} title={a.Name + ':'} value={a.Show} onChange={() => { toggleAttribute(a) }} className='mx-3 mb-2' />
        ))}
      </Popover>
    </div>
  )
}

function daysBetween (date1: DateTime, date2: DateTime): number {
  return Math.floor(date2.diff(date1, "days").days)
}

export default ActivityAnalysis
