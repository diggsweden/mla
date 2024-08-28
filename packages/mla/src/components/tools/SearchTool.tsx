// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { useEffect, useMemo, useState } from 'react'
import useSearchStore from '../../store/search-state'
import ItemResultList from '../result/ItemResultList'
import Property from '../common/property'

function SearchTool () {
  const selectedTool = useSearchStore((state) => state.searchTool)
  const loading = useSearchStore((state) => state.loading)
  const result = useSearchStore((state) => state.result)

  const [params, setParams] = useState({} as Record<string, string | number | boolean | undefined>)
  const [valid, setValid] = useState(true)

  const performSearch = useSearchStore((state) => state.search)

  function setParamValue (id: string, value?: string | number | boolean) {
    setParams({
      ...params,
      [id]: value
    })
  }

  let validMap = {}
  function setValidity (id: string, validity: boolean) {
    validMap = {
      ...validMap,
      [id]: validity
    }
    setValid(!Object.values(validMap).some(v => !v))
  }

  const noForm = useMemo(() => {
    return selectedTool?.Parameters?.Form == null || selectedTool.Parameters.Form.Fields.length === 0
  }, [selectedTool])

  useEffect(() => {
    if (noForm) {
      void performSearch({ Params: undefined })
    }
  }, [noForm, performSearch])

  function search () {
    if (!valid) {
      return
    }

    const query = Object.keys(params).map(k => {
      return {
        TypeId: k,
        Value: params[k]
      }
    })

    void performSearch({ Params: query })
  }

  if (selectedTool == null) {
    return null
  }

  return (
    <div className='animate-in slide-in-from-left'>
      <div className='search-tools animate-in slide-in-from-left'>
        <p className='text-sm p-1'>{selectedTool.Description}</p>
        {!noForm &&
          <div className='pt-2'>
            {selectedTool.Parameters.Form?.Fields.map((prop, index) => (
              <Property key={prop.TypeId}
                autofocus={index === 0}
                value={params[prop.TypeId]}
                config={prop}
                validChanged={(validity) => { setValidity(prop.TypeId, validity) }}
                onChange={(newValue) => { setParamValue(prop.TypeId, newValue) }} />
            ))}
            <button onClick={search} disabled={!valid} className='w-full text-white bg-primary enabled:hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded px-2 py-1 mr-2 my-4 disabled:opacity-50'>Sök</button>
          </div>
        }
      </div>
      <div className='mt-2'>
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
          <ItemResultList className="animate-in slide-in-from-bottom border-t border-gray-400 pt-2" result={result} />
        }
      </div>
    </div>
  )
}

export default SearchTool
