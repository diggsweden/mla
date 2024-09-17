// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useMemo, useState } from 'react'
import useSearchStore from '../../store/search-state'
import ItemResultList from '../result/ItemResultList'
import Property from '../common/property'
import Button from '../common/Button'
import { useTranslation } from 'react-i18next'

function SearchTool () {
  const { t } = useTranslation();
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
    <div className="m-animate-in m-slide-in-from-left">
      <div className="m-search-tools m-animate-in m-slide-in-from-left">
        <p className="m-text-sm m-p-1">{selectedTool.Description}</p>
        {!noForm &&
          <div className="m-pt-2">
            {selectedTool.Parameters.Form?.Fields.map((prop, index) => (
              <Property key={prop.TypeId}
                autofocus={index === 0}
                value={params[prop.TypeId]}
                config={prop}
                validChanged={(validity) => { setValidity(prop.TypeId, validity) }}
                onChange={(newValue) => { setParamValue(prop.TypeId, newValue) }} />
            ))}
            <Button onClick={search} disabled={!valid} className='m-w-full'>{t('search')}</Button>
          </div>
        }
      </div>
      <div className="m-mt-2">
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
          <ItemResultList className="m-animate-in m-slide-in-from-bottom m-border-t m-border-gray-400 m-pt-2" result={result} />
        }
      </div>
    </div>
  )
}

export default SearchTool
