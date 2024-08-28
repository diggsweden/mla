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
    <aside className={'flex flex-col ease-in-out duration-300 ' + (getTool() != null ? 'translate-x-0 ' : '-translate-x-full ') + props.className}>
      <div className='bg-secondary w-full flex justify-center'>
        <div className='text-white p-1 h-7'>{getToolName()}</div>
        <div onClick={() => { setTool(undefined) }} className="absolute top-0 right-3 text-xl text-white align-center cursor-pointer alert-del">&times;</div>
      </div>

      <div className='flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden bg-gray-50'>
        {getTool()}
      </div>
    </aside>
  )
}

export default ToolPanel
