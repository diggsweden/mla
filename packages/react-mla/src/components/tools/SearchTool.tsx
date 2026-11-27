// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import useSearchStore from '../../store/search-state'
import ItemResultList from '../result/ItemResultList'
import Property from '../common/Property'
import { useTranslation } from 'react-i18next'
import { helpOf } from '../../utils/properties'
import { LoadingResults, primaryButton } from './ToolParts'

// A search of a service of the configuration: its form, and what it found
function SearchTool () {
  const { t } = useTranslation()
  const selectedTool = useSearchStore((state) => state.searchTool)
  const loading = useSearchStore((state) => state.loading)
  const result = useSearchStore((state) => state.result)
  const performSearch = useSearchStore((state) => state.search)

  const [params, setParams] = useState({} as Record<string, string | number | boolean | undefined>)
  // The fields that are not filled in as they must be, by their type
  const [invalid, setInvalid] = useState<string[]>([])
  // The last query, which is asked again when the service failed
  const lastQuery = useRef<unknown>(undefined)

  function setParamValue (id: string, value?: string | number | boolean) {
    setParams({
      ...params,
      [id]: value
    })
  }

  function setValidity (id: string, validity: boolean) {
    setInvalid(current => {
      const without = current.filter(x => x !== id)
      return validity ? (without.length === current.length ? current : without) : (current.includes(id) ? current : [...current, id])
    })
  }

  const noForm = useMemo(() => {
    return selectedTool?.Parameters?.Form == null || selectedTool.Parameters.Form.Fields.length === 0
  }, [selectedTool])

  // A service without a form searches as soon as it is chosen
  useEffect(() => {
    if (noForm) {
      lastQuery.current = { Params: undefined }
      void performSearch(lastQuery.current)
    }
  }, [noForm, performSearch])

  function search (e?: FormEvent) {
    e?.preventDefault()
    if (invalid.length > 0) {
      return
    }

    const query = Object.keys(params).map(k => {
      return {
        TypeId: k,
        Value: params[k]
      }
    })

    lastQuery.current = { Params: query }
    void performSearch(lastQuery.current)
  }

  if (selectedTool == null) {
    return null
  }

  const fields = selectedTool.Parameters.Form?.Fields ?? []
  const invalidNames = fields.filter(f => invalid.includes(f.TypeId)).map(f => f.Name)

  return (
    <div>
      {/* A service without fields has no form, and searches as soon as it is chosen */}
      {!noForm && <form onSubmit={search} className="m:flex m:flex-col m:gap-2.5 m:px-3 m:py-3 m:border-b m:border-gray-200">
        <>
          {fields.map((prop, index) => {
            const help = helpOf(prop.Name, prop.Description)
            return (
              <div key={prop.TypeId}>
                <Property
                  autofocus={index === 0}
                  value={params[prop.TypeId]}
                  config={prop}
                  validChanged={(validity) => { setValidity(prop.TypeId, validity) }}
                  onChange={(newValue) => { setParamValue(prop.TypeId, newValue) }} />
                {help && <p className="m:mt-1 m:text-[12px] m:text-gray-600">{help}</p>}
              </div>
            )
          })}
          <button type="submit" disabled={invalidNames.length > 0} className={primaryButton + ' m:mt-1'}>{t('search')}</button>
          {invalidNames.length > 0 && <p className="m:text-[12px] m:text-red-700 m:text-center">{t('correct to search', { names: invalidNames.join(', ') })}</p>}
        </>
      </form>}
      {loading && <LoadingResults />}
      {!loading && result &&
        <ItemResultList result={result} onRetry={() => { void performSearch(lastQuery.current) }} />
      }
    </div>
  )
}

export default SearchTool
