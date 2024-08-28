// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useState } from 'react'
import { type IEntity } from '../../interfaces/data-models'
import useMainStore from '../../store/main-store'
import useSearchStore from '../../store/search-state'
import ItemResultList from '../result/ItemResultList'

function ExploreTool () {
  const selection = useMainStore(state => state.selectedEntities)()
  const [seeds, setSeeds] = useState([] as IEntity[])

  const selectedTool = useSearchStore((state) => state.exploreTool)
  const loading = useSearchStore((state) => state.loading)
  const result = useSearchStore((state) => state.result)

  useEffect(() => {
    setSeeds(selection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  if (selectedTool == null) {
    return null
  }

  return (
    <div className='animate-in slide-in-from-left'>
      <div className='search-tools animate-in slide-in-from-left'>
        <p className='text-sm p-1'>{selectedTool.Description}</p>
      </div>
      <div className='pt-2'>
        {loading &&
          <div className="animate-in fade-in duration-500 flex space-x-4 mt-4">
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
        {!loading && result &&
          <ItemResultList seeds={seeds} className="animate-in slide-in-from-bottom" result={result} />
        }
      </div>
    </div>
  )
}

export default ExploreTool
