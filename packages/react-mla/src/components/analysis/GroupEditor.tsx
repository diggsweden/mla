// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type DragEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalysisGroup } from '../../store/analysis-store'
import { GripIcon } from './PanelParts'

interface Props {
  groups: AnalysisGroup[]
  // The types of entity that can be in a group, by id
  types: Array<{ id: string, name: string }>
  onChange: (groups: AnalysisGroup[]) => void
}

// The groups of the phase analysis: a type of entity is in one group at most, and the order of the groups is the order in the document
function GroupEditor (props: Props) {
  const { t } = useTranslation()
  const { groups, types, onChange } = props
  const [typeDrag, setTypeDrag] = useState<string | undefined>()
  const [groupDrag, setGroupDrag] = useState<string | undefined>()
  const [over, setOver] = useState<string | undefined>()

  const nameOf = (id: string) => types.find(x => x.id === id)?.name ?? id
  const groupOfType = (id: string) => groups.find(g => g.EntityTypeIds.includes(id))
  const ungrouped = types.filter(x => groupOfType(x.id) == null)

  function endDrag () {
    setTypeDrag(undefined)
    setGroupDrag(undefined)
    setOver(undefined)
  }

  function moveType (typeId: string, toId?: string) {
    onChange(groups.map(g => ({
      ...g,
      EntityTypeIds: g.Id === toId ? [...g.EntityTypeIds.filter(x => x !== typeId), typeId] : g.EntityTypeIds.filter(x => x !== typeId)
    })))
    endDrag()
  }

  function moveGroup (id: string, toIndex: number) {
    const list = [...groups]
    const from = list.findIndex(g => g.Id === id)
    const [item] = list.splice(from, 1)
    list.splice(Math.max(0, Math.min(from < toIndex ? toIndex - 1 : toIndex, list.length)), 0, item)
    onChange(list)
    endDrag()
  }

  function addGroup () {
    const ids = groups.map(g => Number(g.Id.replace(/\D/g, '')) || 0)
    onChange([...groups, { Id: 'g' + (Math.max(0, ...ids) + 1), Name: t('new group'), EntityTypeIds: [] }])
  }

  function overCard (e: DragEvent<HTMLLIElement>, id: string) {
    if (typeDrag == null && groupDrag == null) {
      return
    }
    e.preventDefault()
    setOver(id)
  }

  return (
    <div className="m:flex m:flex-col m:gap-2">
      <p className="m:text-[12px] m:text-gray-600">{t('groups help')}</p>
      <ul className="m:flex m:flex-col m:gap-2">
        {groups.map((g, index) => (
          <li key={g.Id}
            onDragOver={(e) => { overCard(e, g.Id) }}
            onDrop={(e) => {
              e.preventDefault()
              if (typeDrag != null) moveType(typeDrag, g.Id)
              else if (groupDrag != null && groupDrag !== g.Id) moveGroup(groupDrag, index)
              else endDrag()
            }}
            className={'m:rounded-md m:border m:bg-white m:pt-1.5 m:pb-2 m:pr-2 m:pl-1 m:flex m:flex-col m:gap-1.5 ' +
              (over === g.Id ? 'm:border-primary ' : 'm:border-gray-200 ') + (over === g.Id && groupDrag != null ? 'm:border-t-[3px] ' : '') + (groupDrag === g.Id ? 'm:bg-blue-50' : '')}>
            <div className="m:flex m:items-center m:gap-1">
              <button type="button" draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', g.Id); e.dataTransfer.effectAllowed = 'move'; setGroupDrag(g.Id) }}
                onDragEnd={endDrag}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' && index > 0) { e.preventDefault(); moveGroup(g.Id, index - 1) }
                  if (e.key === 'ArrowDown' && index < groups.length - 1) { e.preventDefault(); moveGroup(g.Id, index + 2) }
                }}
                aria-label={t('move group', { name: g.Name })} title={t('drag or use arrow keys')}
                className="m:w-5 m:h-7 m:shrink-0 m:flex m:items-center m:justify-center m:text-gray-500 m:cursor-grab">
                <GripIcon />
              </button>
              <input type="text" value={g.Name} aria-label={t('group name')}
                onChange={(e) => { onChange(groups.map(x => (x.Id === g.Id ? { ...x, Name: e.target.value } : x))) }}
                className="m:flex-1 m:min-w-0 m:text-[13px] m:font-semibold m:border m:border-transparent m:hover:border-gray-300 m:focus:border-primary m:rounded m:px-1.5 m:py-0.5 m:bg-transparent" />
              <button type="button" onClick={() => { onChange(groups.filter(x => x.Id !== g.Id)) }}
                aria-label={t('remove group', { name: g.Name })} title={t('remove group', { name: g.Name })}
                className="m:w-7 m:h-7 m:shrink-0 m:flex m:items-center m:justify-center m:border m:border-gray-300 m:rounded m:bg-white m:hover:bg-gray-100">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 4h9M5.5 4V2.5h3V4M4 4l.6 7.5h4.8L10 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
            <div className="m:flex m:flex-wrap m:gap-1 m:items-center m:pl-6">
              {g.EntityTypeIds.map(typeId => (
                <span key={typeId} draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', typeId); e.dataTransfer.effectAllowed = 'move'; setTypeDrag(typeId) }}
                  onDragEnd={endDrag}
                  title={t('drag to another group')}
                  className="m:inline-flex m:items-center m:gap-1 m:text-[12px] m:pl-2 m:pr-1 m:py-0.5 m:rounded-full m:bg-gray-100 m:cursor-grab">
                  {nameOf(typeId)}
                  <button type="button" onClick={() => { moveType(typeId) }}
                    aria-label={t('remove type from group', { type: nameOf(typeId), group: g.Name })}
                    className="m:w-[18px] m:h-[18px] m:flex m:items-center m:justify-center m:rounded-full m:bg-gray-300 m:hover:bg-gray-400">
                    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </span>
              ))}
              <select value="" aria-label={t('add type to group', { group: g.Name })}
                onChange={(e) => { if (e.target.value) moveType(e.target.value, g.Id) }}
                className="m:text-[12px] m:px-1 m:py-0.5 m:border m:border-dashed m:border-gray-500 m:rounded-full m:bg-white">
                <option value="">{t('add type')}</option>
                {types.filter(x => !g.EntityTypeIds.includes(x.id)).map(x => {
                  const other = groupOfType(x.id)
                  return <option key={x.id} value={x.id}>{other ? t('type moved from', { type: x.name, group: other.Name }) : x.name}</option>
                })}
              </select>
            </div>
            {g.EntityTypeIds.length === 0 && <p className="m:text-[12px] m:text-amber-800 m:pl-6">{t('group without types')}</p>}
          </li>
        ))}
      </ul>

      <div
        onDragOver={(e) => { if (typeDrag != null) { e.preventDefault(); setOver('none') } }}
        onDrop={(e) => { if (typeDrag != null) { e.preventDefault(); moveType(typeDrag) } }}
        className={'m:rounded-md m:border m:border-dashed m:bg-gray-50 m:px-2.5 m:py-2 m:flex m:flex-col m:gap-1.5 ' + (over === 'none' ? 'm:border-primary' : 'm:border-gray-300')}>
        <div className="m:text-[13px] m:font-semibold">{t('ungrouped')}</div>
        <div className="m:flex m:flex-wrap m:gap-1">
          {ungrouped.map(x => (
            <span key={x.id} draggable
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', x.id); e.dataTransfer.effectAllowed = 'move'; setTypeDrag(x.id) }}
              onDragEnd={endDrag}
              title={t('drag to a group')}
              className="m:text-[12px] m:px-2 m:py-0.5 m:rounded-full m:bg-white m:border m:border-gray-300 m:cursor-grab">{x.name}</span>
          ))}
        </div>
        <p className="m:text-[12px] m:text-gray-600">{ungrouped.length === 0 ? t('all types grouped') : t('ungrouped help')}</p>
      </div>

      <button type="button" onClick={addGroup}
        className="m:self-start m:text-[13px] m:px-2.5 m:py-1.5 m:border m:border-dashed m:border-gray-500 m:rounded m:bg-white m:hover:bg-gray-100">{t('add group')}</button>
    </div>
  )
}

export default GroupEditor
