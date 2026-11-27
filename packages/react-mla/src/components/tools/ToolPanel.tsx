// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import useAppStore from '../../store/app-store'
import ExploreTool from './ExploreTool'
import ImportTool from './ImportTool'
import SearchTool from './SearchTool'
import ActivityTool from './ActivityTool'
import useSearchStore from '../../store/search-state'
import Icon from '../common/Icon'
import { useTranslation } from 'react-i18next'

interface Props {
  className?: string
}

// The panel to the left of the chart, for the tool that is chosen: a search, a fetch, an import or the activity flow of the timeline
function ToolPanel (props: Props) {
  const { t } = useTranslation()

  const tool = useAppStore((state) => state.selectedTool)
  const setTool = useAppStore((state) => state.setTool)
  const searchTool = useSearchStore((state) => state.searchTool)
  const exploreTool = useSearchStore((state) => state.exploreTool)
  const importTool = useSearchStore((state) => state.importTool)

  function getTool () {
    switch (tool) {
      case 'search': return <SearchTool />
      case 'explore': return <ExploreTool />
      case 'import': return <ImportTool />
      case 'activity': return <ActivityTool />
      case undefined: return null
    }
  }

  // The name and the icon of the tool, as the ribbon shows them, and below the name the description of the service, or else the kind of tool
  function heading (): { name: string, kind: string, icon: string } | undefined {
    switch (tool) {
      case 'search': return { name: searchTool?.Name ?? t('search'), kind: searchTool?.Description || t('search'), icon: searchTool?.Icon ?? 'manage_search' }
      case 'explore': return { name: exploreTool?.Name ?? t('fetch'), kind: exploreTool?.Description || t('fetch'), icon: exploreTool?.Icon ?? 'manage_search' }
      case 'import': return { name: importTool?.Name ?? t('import'), kind: importTool?.Description || t('import'), icon: importTool?.Icon ?? 'upload_file' }
      case 'activity': return { name: t('activity flow'), kind: t('timeline'), icon: 'straighten' }
      case undefined: return undefined
    }
  }

  const content = getTool()
  const head = heading()
  return (
    <aside aria-label={head?.name} className={'m:flex m:flex-col m:ease-in-out m:duration-300 m:bg-white ' +
      // A soft shadow to the right lifts the panel off the chart, only while it is seen
      (content != null ? 'm:translate-x-0 m:shadow-[8px_0_20px_-6px_rgba(28,36,48,0.22)] ' : 'm:-translate-x-full ') + props.className}>
      {head != null && (
        <div className="m:flex m:items-center m:gap-2.5 m:px-3 m:py-2.5 m:border-b m:border-gray-200 m:select-none">
          <span className="m:w-[34px] m:h-[34px] m:shrink-0 m:rounded-full m:bg-gray-100 m:flex m:items-center m:justify-center">
            <Icon name={head.icon} className="m:h-[18px] m:w-[18px] m:text-primary" />
          </span>
          <div className="m:flex m:flex-col m:min-w-0 m:flex-1">
            <span className="m:text-[15px] m:font-bold m:leading-tight m:truncate" title={head.name}>{head.name}</span>
            <span className="m:text-[12px] m:text-gray-600 m:leading-snug m:line-clamp-2" title={head.kind}>{head.kind}</span>
          </div>
          <button type="button" aria-label={t('close panel')} title={t('close panel')} onClick={() => { setTool(undefined) }}
            className="m:w-7 m:h-7 m:shrink-0 m:flex m:items-center m:justify-center m:rounded m:border m:border-gray-300 m:bg-white m:text-gray-600 m:hover:bg-gray-100 m:cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      )}

      <div className="mla-form-fields m:flex-1 m:overflow-y-auto m:overflow-x-hidden">
        {content}
      </div>
    </aside>
  )
}

export default ToolPanel
