// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useState } from 'react'
import { type IEntity } from '../../interfaces/data-models'
import useMainStore from '../../store/main-store'
import useSearchStore from '../../store/search-state'
import ItemResultList from '../result/ItemResultList'

function ExploreTool () {
  const selection = useMainStore(state => state.selectedEntities)
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
    <div className="m-animate-in m-slide-in-from-left">
      <div className="m-search-tools m-animate-in m-slide-in-from-left">
        <p className="m-text-sm m-p-1">{selectedTool.Description}</p>
      </div>
      <div className="m-pt-2">
        {loading &&
          <div className="m-animate-in m-fade-in m-duration-500 m-flex m-space-x-4 m-mt-4">
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
        {!loading && result &&
          <ItemResultList seeds={seeds} className="m-animate-in m-slide-in-from-bottom" result={result} />
        }
      </div>
    </div>
  )
}

export default ExploreTool
