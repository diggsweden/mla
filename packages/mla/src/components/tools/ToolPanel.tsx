// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import useAppStore from '../../store/app-store'
import ExploreTool from './ExploreTool'
import ImportTool from './ImportTool'
import SearchTool from './SearchTool'
import ActivityTool from './ActivityTool'
import useSearchStore from '../../store/search-state'

interface Props {
  className?: string
}

function ToolPanel (props: Props) {
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

  function getToolName () {
    switch (tool) {
      case 'search': return searchTool?.Name ?? 'Sök'
      case 'explore': return exploreTool?.Name ?? 'Hämta'
      case 'import': return 'Importera ' + importTool?.Name
      case 'activity': return 'Aktivitetsflöde'
      case undefined: return null
    }
  }

  return (
    <aside className={'m-flex m-flex-col m-ease-in-out m-duration-300 ' + (getTool() != null ? 'm-translate-x-0 ' : '-m-translate-x-full ') + props.className}>
      <div className="m-bg-secondary m-w-full m-flex m-justify-center">
        <div className="m-text-white m-p-1 m-h-7">{getToolName()}</div>
        <div onClick={() => { setTool(undefined) }} className="m-absolute m-top-0 m-right-3 m-text-xl m-text-white m-align-center m-cursor-pointer m-alert-del">&times;</div>
      </div>

      <div className="m-flex-1 m-px-3 m-py-4 m-overflow-y-auto m-overflow-x-hidden m-bg-gray-50">
        {getTool()}
      </div>
    </aside>
  )
}

export default ToolPanel
