// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import useMainStore from '../../store/main-store'
import useSearchStore from '../../store/search-state'
import ItemResultList from '../result/ItemResultList'
import useAppStore from '../../store/app-store'
import { getId } from '../../utils/utils'
import { useTranslation } from 'react-i18next'
import { LoadingResults, sectionLabel } from './ToolParts'

// A fetch of a service of the configuration, for what is selected: what it is fetched for, and what it found
function ExploreTool () {
  const { t } = useTranslation()
  const geoFeature = useAppStore(state => state.selectedGeoFeature)
  const performExplore = useSearchStore(state => state.explore)
  const selection = useMainStore(state => state.selectedEntities)
  const selectedTool = useSearchStore((state) => state.exploreTool)
  // What it is fetched for: the selected of the types the service takes, which are what is sent to it
  const inputs = (list: typeof selection) => {
    const types = selectedTool?.Parameters.EntityTypes
    return types == null ? [] : list.filter(e => types.some(t => t.TypeId === e.TypeId))
  }
  const [seeds, setSeeds] = useState(() => inputs(selection))

  const loading = useSearchStore((state) => state.loading)
  const result = useSearchStore((state) => state.result)

  // Seed with the selection each time the result changes, not when the selection changes
  const [seededFor, setSeededFor] = useState(result)
  if (seededFor !== result) {
    setSeededFor(result)
    setSeeds(inputs(selection))
  }

  if (selectedTool == null) {
    return null
  }

  return (
    <div>
      {(seeds.length > 0 || geoFeature != null) && <div className="m:flex m:flex-col m:gap-2.5 m:px-3 m:py-3 m:border-b m:border-gray-200">
        {/* What it is fetched for: the entities that were selected, or the area on the map */}
        {seeds.length > 0
          ? <div className="m:flex m:flex-col m:gap-1.5">
            <span className={sectionLabel}>{t('fetching for', { count: seeds.length })}</span>
            <div className="m:flex m:flex-wrap m:gap-1.5">
              {seeds.map(s => <span key={getId(s)} className="m:text-[12px] m:font-semibold m:bg-gray-100 m:rounded-full m:px-2.5 m:py-0.5 m:max-w-full m:truncate">{s.LabelShort}</span>)}
            </div>
          </div>
          : <span className={sectionLabel}>{t('fetching for area')}</span>}
      </div>}
      {loading && <LoadingResults />}
      {!loading && result &&
        <ItemResultList seeds={seeds} result={result} onRetry={() => { void performExplore() }} />
      }
    </div>
  )
}

export default ExploreTool
