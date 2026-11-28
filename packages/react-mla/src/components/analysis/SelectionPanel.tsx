// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type DragEvent, type KeyboardEvent, type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Actor } from './analysis-data'
import { ActorBadge, GripIcon, MinusIcon, PanelHeading, PlusIcon, SquareButton } from './PanelParts'

export interface SelectionGroup {
  id: string
  title: string
  keys: string[]
}

interface Props {
  help: string
  groups: SelectionGroup[]
  // The entities that can be chosen and are not, with the name of the group they would go to
  unchosen: Array<{ key: string, groupName?: string }>
  actors: Record<string, Actor>
  countText: (key: string) => string
  onReorder: (groupId: string, keys: string[]) => void
  onRemove: (key: string) => void
  onAdd: (key: string) => void
  onHide: () => void
  // The text when there is nothing left to choose
  emptyText?: string
  // More that belongs to the choice, such as the activities of the time line
  children?: ReactNode
  // The days the view covers, right below the heading
  period?: ReactNode
}

// The choice of what a view shows: the chosen entities by group, in the order they are shown, and the ones that are not chosen
function SelectionPanel (props: Props) {
  const { t } = useTranslation()
  const [drag, setDrag] = useState<{ key: string, group: string } | undefined>()
  const [dropIndex, setDropIndex] = useState<number | undefined>()

  function moveTo (group: SelectionGroup, key: string, index: number) {
    const current = group.keys.indexOf(key)
    const next = group.keys.filter(k => k !== key)
    const at = current !== -1 && current < index ? index - 1 : index
    next.splice(Math.max(0, Math.min(at, next.length)), 0, key)
    props.onReorder(group.id, next)
  }

  function endDrag () {
    setDrag(undefined)
    setDropIndex(undefined)
  }

  function overRow (e: DragEvent<HTMLLIElement>, group: SelectionGroup, index: number) {
    if (drag?.group !== group.id) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    const r = e.currentTarget.getBoundingClientRect()
    setDropIndex(e.clientY < r.top + r.height / 2 ? index : index + 1)
  }

  function keys (e: KeyboardEvent<HTMLButtonElement>, group: SelectionGroup, key: string, index: number) {
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault()
      moveTo(group, key, index - 1)
    } else if (e.key === 'ArrowDown' && index < group.keys.length - 1) {
      e.preventDefault()
      moveTo(group, key, index + 2)
    }
  }

  const dropLine = <li aria-hidden="true" className="m:h-[3px] m:mx-1 m:my-px m:rounded m:bg-blue-700" />

  return (
    <aside aria-label={t('selection')} className="m:w-[320px] m:shrink-0 m:bg-white m:border-r m:border-gray-300 m:min-h-0 m:flex m:flex-col">
      <div className="m:border-b m:border-gray-200">
        <PanelHeading title={t('selection')} help={props.help} hideLabel={t('hide selection')} side="left" onHide={props.onHide} />
      </div>
      {props.period}

      {props.groups.map(group => (
        <section key={group.id} className="m:flex-[2_1_0] m:min-h-0 m:flex m:flex-col">
          <h3 className="m:shrink-0 m:px-4 m:pt-2.5 m:pb-0.5 m:text-[15px] m:font-bold">{group.title}</h3>
          <ul
            onDragOver={(e) => { if (drag?.group === group.id) { e.preventDefault(); if (dropIndex == null) setDropIndex(group.keys.length) } }}
            onDrop={(e) => { if (drag?.group === group.id) { e.preventDefault(); moveTo(group, drag.key, dropIndex ?? group.keys.length); endDrag() } }}
            className={'m:flex-1 m:min-h-0 m:overflow-y-auto m:mx-2 m:mb-1 m:p-0.5 m:rounded-md m:border-2 m:border-dashed ' + (drag?.group === group.id ? 'm:border-blue-700' : 'm:border-transparent')}>
            {group.keys.map((key, index) => {
              const actor = props.actors[key]
              if (actor == null) {
                return null
              }
              return [
                drag?.group === group.id && dropIndex === index ? <li key={key + '-drop'} aria-hidden="true" className="m:h-[3px] m:mx-1 m:my-px m:rounded m:bg-blue-700" /> : null,
                <li key={key}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', key); e.dataTransfer.effectAllowed = 'move'; setDrag({ key, group: group.id }) }}
                  onDragEnd={endDrag}
                  onDragOver={(e) => { overRow(e, group, index) }}
                  className={'m:flex m:gap-1.5 m:items-center m:px-1.5 m:py-[3px] m:rounded m:cursor-grab ' + (drag?.key === key ? 'm:bg-blue-50 m:opacity-50' : '')}>
                  <button type="button" onKeyDown={(e) => { keys(e, group, key, index) }}
                    aria-label={t('move actor', { name: actor.name })} title={t('drag or use arrow keys')}
                    className="m:w-6 m:h-8 m:shrink-0 m:flex m:items-center m:justify-center m:text-gray-500 m:cursor-grab">
                    <GripIcon />
                  </button>
                  <ActorBadge icon={actor.icon} color={actor.iconColor} />
                  <span className="m:flex m:flex-col m:flex-1 m:min-w-0">
                    <span className="m:text-[13px] m:font-semibold m:truncate">{actor.name}</span>
                    <span className="m:text-[12px] m:text-gray-600">{actor.typeName} · {props.countText(key)}</span>
                  </span>
                  <SquareButton label={t('remove actor', { name: actor.name })} onClick={() => { props.onRemove(key) }}><MinusIcon /></SquareButton>
                </li>
              ]
            })}
            {drag?.group === group.id && dropIndex === group.keys.length && dropLine}
            {group.keys.length === 0 && <li className="m:px-2 m:py-2.5 m:text-[12px] m:text-gray-600 m:text-center">{t('nothing chosen')}</li>}
          </ul>
        </section>
      ))}

      <section className={(props.unchosen.length > 0 ? 'm:flex-[2_1_0] m:min-h-0 ' : 'm:flex-none ') + 'm:flex m:flex-col m:mx-2 m:mb-2 m:rounded-md m:bg-gray-50 m:border m:border-gray-200'}>
        <h3 className="m:shrink-0 m:px-2.5 m:pt-2.5 m:pb-1 m:text-[14px] m:font-bold">{t('not chosen')}</h3>
        <ul className="m:flex-1 m:min-h-0 m:overflow-y-auto m:px-1 m:pb-1.5">
          {props.unchosen.map(({ key, groupName }) => {
            const actor = props.actors[key]
            if (actor == null) {
              return null
            }
            return (
              <li key={key} className="m:flex m:gap-2.5 m:items-center m:py-[5px] m:px-1.5 m:pl-2.5">
                <ActorBadge icon={actor.icon} color={actor.iconColor} />
                <span className="m:flex m:flex-col m:flex-1 m:min-w-0">
                  <span className="m:text-[13px] m:font-semibold m:text-gray-700 m:truncate">{actor.name}</span>
                  <span className="m:text-[12px] m:text-gray-600">{actor.typeName}{groupName && props.groups.length > 1 ? ' · ' + groupName : ''}</span>
                </span>
                {groupName != null && <SquareButton label={t('add actor', { name: actor.name })} onClick={() => { props.onAdd(key) }}><PlusIcon /></SquareButton>}
              </li>
            )
          })}
          {props.unchosen.length === 0 && <li className="m:px-1.5 m:py-2.5 m:text-[12px] m:text-gray-600">{props.emptyText ?? t('all chosen')}</li>}
        </ul>
      </section>

      {props.children}
    </aside>
  )
}

export default SelectionPanel
